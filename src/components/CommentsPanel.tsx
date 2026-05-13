import React, { useEffect, useState } from 'react';
import { MessageSquare, Send, Smile, Check, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { commentApi, collabApi } from '../api/services';
import { sendCommentEvent } from '../api/collabService';
import { useAuthStore } from '../store';
import { formatDistanceToNow } from 'date-fns';

interface Props { fileId: number; projectId: number; }

const REACTIONS = ['👍', '❤️', '😄', '🚀', '👀', '🎉'];

export default function CommentsPanel({ fileId, projectId }: Props) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [lineNumber, setLineNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);

  useEffect(() => {
    loadComments();
    
    // Fetch active session ID for STOMP broadcasting
    collabApi.getActiveSessionForFile(fileId)
      .then(res => setSessionId(res.data.id))
      .catch(() => setSessionId(null));

    // Listen for WebSocket STOMP events dispatched by CodeEditor
    const handleLiveComment = (e: any) => {
      if (e.detail?.fileId === fileId) {
        loadComments(false);
      }
    };
    
    window.addEventListener('collab-comment-added', handleLiveComment);
    
    // Fallback polling
    const interval = setInterval(() => {
      loadComments(false);
    }, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('collab-comment-added', handleLiveComment);
    };
  }, [fileId]);

  const loadComments = async (showLoading = true) => {
    try {
      if (showLoading && comments.length === 0) setLoading(true);
      const res = await commentApi.getFileComments(fileId);
      setComments(res.data?.content || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const broadcastUpdate = () => {
    if (sessionId && user) {
      sendCommentEvent({
        sessionId,
        userId: user.id,
        username: user.username,
        type: 'COMMENT',
        timestamp: Date.now()
      });
    }
  };

  const submitComment = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await commentApi.create({
        fileId,
        projectId,
        body: body.trim(),
        lineNumber: lineNumber ? parseInt(lineNumber) : undefined,
      });
      setBody('');
      setLineNumber('');
      toast.success('Comment added');
      loadComments();
      broadcastUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (parentId: number) => {
    if (!replyBody.trim()) return;
    try {
      await commentApi.create({ fileId, projectId, body: replyBody.trim(), parentId });
      setReplyBody('');
      setReplyTo(null);
      loadComments();
      broadcastUpdate();
    } catch {
      toast.error('Failed to add reply');
    }
  };

  const resolve = async (id: number) => {
    try {
      await commentApi.resolve(id);
      loadComments();
      broadcastUpdate();
    } catch { toast.error('Failed to resolve'); }
  };

  const deleteComment = async (id: number) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await commentApi.delete(id);
      loadComments();
      broadcastUpdate();
    } catch { toast.error('Failed to delete'); }
  };

  const addReaction = async (id: number, emoji: string) => {
    try {
      await commentApi.addReaction(id, emoji);
      loadComments();
      broadcastUpdate();
    } catch { }
  };

  const avatarColor = (name: string) => {
    const colors = ['#6366f1', '#22d3a5', '#f59e0b', '#ef4444', '#8b5cf6'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  const roots = comments.filter((c) => !c.parentId);
  const replies = (parentId: number) => comments.filter((c) => c.parentId === parentId);

  return (
    <div className="comments-panel">
      {/* New Comment Form */}
      <div className="comment-form">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            className="input"
            style={{ height: 32, fontSize: '0.8125rem', flex: 1 }}
            placeholder="Line # (optional)"
            type="number"
            min={1}
            value={lineNumber}
            onChange={(e) => setLineNumber(e.target.value)}
            id="comment-line-input"
          />
        </div>
        <textarea
          className="textarea"
          style={{ minHeight: 72, fontSize: '0.8125rem', resize: 'none' }}
          placeholder="Write a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') submitComment(); }}
          id="comment-body-input"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <button className="btn btn-primary btn-sm" onClick={submitComment} disabled={submitting || !body.trim()} id="submit-comment-btn">
            <Send size={12} /> {submitting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </div>

      {/* Comment List */}
      <div className="comment-list">
        {loading ? (
          <div style={{ padding: 12 }}>
            {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 8, borderRadius: 8 }} />)}
          </div>
        ) : roots.length === 0 ? (
          <div className="version-empty">
            <MessageSquare size={28} style={{ opacity: 0.2 }} />
            <p>No comments yet</p>
          </div>
        ) : (
          roots.map((comment) => (
            <div key={comment.id} className={`comment-item ${comment.resolved ? 'resolved' : ''}`} id={`comment-${comment.id}`}>
              <div className="comment-header">
                <div className="avatar avatar-sm" style={{ background: avatarColor(comment.username || ''), color: 'white', flexShrink: 0 }}>
                  {(comment.username?.[0] || '?').toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="comment-author">{comment.username}</span>
                    {comment.lineNumber && <span className="badge badge-muted">L{comment.lineNumber}</span>}
                    {comment.resolved && <span className="badge badge-green"><Check size={9} /> Resolved</span>}
                  </div>
                  <div className="comment-time">{comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}</div>
                </div>
                <div className="comment-actions">
                  {!comment.resolved && (
                    <button className="file-action-btn" onClick={() => resolve(comment.id)} title="Resolve">
                      <Check size={13} />
                    </button>
                  )}
                  {comment.authorId === user?.id && (
                    <button className="file-action-btn danger" onClick={() => deleteComment(comment.id)} title="Delete">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="comment-body">{comment.body}</div>

              {/* Reactions */}
              <div className="comment-reactions">
                {REACTIONS.map((emoji) => (
                  <button key={emoji} className="reaction-btn" onClick={() => addReaction(comment.id, emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Replies */}
              {replies(comment.id).map((reply) => (
                <div key={reply.id} className="comment-reply">
                  <div className="avatar avatar-sm" style={{ background: avatarColor(reply.username || ''), color: 'white', flexShrink: 0, width: 22, height: 22, fontSize: '0.65rem' }}>
                    {(reply.username?.[0] || '?').toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span className="comment-author">{reply.username}</span>
                    <p className="comment-body" style={{ margin: '2px 0 0' }}>{reply.body}</p>
                  </div>
                </div>
              ))}

              {/* Reply Form */}
              {replyTo === comment.id ? (
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <input
                    className="input"
                    style={{ height: 30, fontSize: '0.8rem', flex: 1 }}
                    placeholder="Write a reply..."
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitReply(comment.id); if (e.key === 'Escape') setReplyTo(null); }}
                    autoFocus
                    id={`reply-input-${comment.id}`}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => submitReply(comment.id)} style={{ height: 30, padding: '0 10px' }}>Reply</button>
                </div>
              ) : (
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', height: 24, marginTop: 4 }} onClick={() => setReplyTo(comment.id)}>
                  Reply
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <style>{`
        .comments-panel { display: flex; flex-direction: column; height: 100%; }
        .comment-form { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; }
        .comment-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 8px; }
        .comment-item { background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; transition: opacity var(--transition-fast); }
        .comment-item.resolved { opacity: 0.6; }
        .comment-header { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
        .comment-author { font-size: 0.8rem; font-weight: 600; }
        .comment-time { font-size: 0.7rem; color: var(--text-muted); }
        .comment-actions { display: flex; gap: 4px; }
        .comment-body { font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; }
        .comment-reactions { display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap; }
        .reaction-btn { background: var(--bg-base); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 2px 6px; font-size: 0.85rem; cursor: pointer; transition: all var(--transition-fast); }
        .reaction-btn:hover { background: var(--bg-hover); border-color: var(--accent); transform: scale(1.1); }
        .comment-reply { display: flex; gap: 8px; align-items: flex-start; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-subtle); }
        .version-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; color: var(--text-muted); font-size: 0.8125rem; }
        .file-action-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 3px; border-radius: 3px; display: flex; align-items: center; transition: all var(--transition-fast); }
        .file-action-btn:hover { color: var(--text-primary); }
        .file-action-btn.danger:hover { color: var(--red); }
      `}</style>
    </div>
  );
}
