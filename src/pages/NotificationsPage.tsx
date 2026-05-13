import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationApi } from '../api/services';
import { formatDistanceToNow } from 'date-fns';
import AppLayout from '../components/AppLayout';
import { Link } from 'react-router-dom';

const TYPE_COLORS: Record<string, string> = {
  PROJECT_INVITATION: 'var(--accent)',
  COMMENT: 'var(--green)',
  MENTION: 'var(--yellow)',
  EXECUTION_COMPLETE: 'var(--blue)',
  VERSION_COMMIT: 'var(--purple)',
  SYSTEM: 'var(--text-muted)',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => { loadNotifications(); }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = filter === 'unread'
        ? await notificationApi.getUnread()
        : await notificationApi.getInbox();
      setNotifications(res.data?.content || []);
      try {
        const sum = await notificationApi.getSummary();
        setUnreadCount(sum.data?.unreadCount || 0);
      } catch {}
    } catch { setNotifications([]); } finally { setLoading(false); }
  };

  const markRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      loadNotifications();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      toast.success('All notifications marked as read');
      loadNotifications();
    } catch {}
  };

  const deleteNotif = async (id: number) => {
    try {
      await notificationApi.delete(id);
      loadNotifications();
    } catch {}
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
        <div className="page-header">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={24} style={{ color: 'var(--accent)' }} /> Notifications
              {unreadCount > 0 && (
                <span className="badge badge-accent">{unreadCount} new</span>
              )}
            </h1>
            <p className="text-muted" style={{ marginTop: 4 }}>Stay up to date with your projects and team</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={markAllRead} id="mark-all-read-btn">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} id="tab-all-notifs">
            All
          </button>
          <button className={`tab ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')} id="tab-unread-notifs">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {loading ? (
          <div>
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10, marginBottom: 8 }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bell size={48} /></div>
            <h3 className="empty-state-title">{filter === 'unread' ? 'All caught up!' : 'No notifications'}</h3>
            <p>{filter === 'unread' ? 'You have no unread notifications' : "You'll see notifications here when something happens"}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notif-item ${!notif.read ? 'unread' : ''}`}
                id={`notif-${notif.id}`}
              >
                <div className="notif-indicator" style={{ background: TYPE_COLORS[notif.type] || 'var(--accent)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="notif-title">{notif.title}</div>
                  <div className="notif-message">{notif.message}</div>
                  <div className="notif-time">
                    {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : ''}
                    <span className="badge badge-muted" style={{ marginLeft: 8 }}>{notif.type?.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {!notif.read && (
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => markRead(notif.id)} title="Mark as read" id={`mark-read-${notif.id}`}>
                      <Check size={14} />
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteNotif(notif.id)} title="Delete" id={`delete-notif-${notif.id}`}>
                    <Trash2 size={14} style={{ color: 'var(--red)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .notif-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }
        .notif-item:hover { border-color: var(--border-default); }
        .notif-item.unread { background: var(--bg-elevated); border-color: var(--border-default); }
        .notif-indicator { width: 4px; height: 100%; min-height: 16px; border-radius: 2px; flex-shrink: 0; align-self: stretch; }
        .notif-title { font-size: 0.875rem; font-weight: 600; margin-bottom: 2px; }
        .notif-message { font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 6px; }
        .notif-time { font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; }
      `}</style>
    </AppLayout>
  );
}
