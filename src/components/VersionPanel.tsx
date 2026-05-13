import React, { useEffect, useState } from 'react';
import { GitBranch, Plus, GitCommit, Clock, ChevronDown, Tag, GitMerge, History, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { versionApi } from '../api/services';
import { formatDistanceToNow } from 'date-fns';
import { useBranchStore } from '../store';

interface Props { projectId: number; }

export default function VersionPanel({ projectId }: Props) {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [showCommit, setShowCommit] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [commitTag, setCommitTag] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'branches' | 'history'>('branches');
  const {
    activeBranchId,
    setActiveBranch
  } = useBranchStore();

  useEffect(() => {
    loadBranches();
  }, [projectId]);

  const loadBranches = async () => {
    try {
      setLoadingBranches(true);
      const res = await versionApi.listBranches(projectId);
      setBranches(res.data || []);
      if (res.data?.length > 0) {

        const def =
          res.data.find((b: any) => b.isDefault)
          || res.data[0];

        setSelectedBranch(def);

        setActiveBranch(
          def.id,
          def.name
        );

        loadCommits(def.id);
      }
    } catch {
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadCommits = async (branchId: number) => {
    try {
      setLoadingCommits(true);
      const res = await versionApi.getBranchHistory(branchId);
      setCommits(res.data?.content || []);
    } catch {
      setCommits([]);
    } finally {
      setLoadingCommits(false);
    }
  };

  const createBranch = async () => {
    if (!newBranchName.trim()) return;
    setCreating(true);
    try {
      await versionApi.createBranch({ projectId, name: newBranchName.trim() });
      toast.success(`Branch "${newBranchName}" created`);
      setNewBranchName('');
      setShowNewBranch(false);
      loadBranches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  const createCommit = async () => {
    if (!commitMessage.trim() || !selectedBranch) return;
    setCreating(true);
    try {
      await versionApi.createCommit({
        branchId: selectedBranch.id,
        projectId,
        message: commitMessage.trim(),
        files: [],
        tag: commitTag.trim() || undefined,
      });
      toast.success('Commit created!');
      setCommitMessage('');
      setCommitTag('');
      setShowCommit(false);
      loadCommits(selectedBranch.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create commit');
    } finally {
      setCreating(false);
    }
  };

  const deleteBranch = async (branch: any) => {
    if (branch.isDefault) { toast.error('Cannot delete the default branch'); return; }
    if (!confirm(`Delete branch "${branch.name}"?`)) return;
    try {
      await versionApi.deleteBranch(branch.id);
      toast.success('Branch deleted');
      loadBranches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete branch');
    }
  };

  return (
    <div className="version-panel">
      {/* Tabs */}
      <div className="tabs" style={{ padding: '0 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <button className={`tab ${activeTab === 'branches' ? 'active' : ''}`} onClick={() => setActiveTab('branches')}>
          <GitBranch size={13} /> Branches
        </button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <History size={13} /> History
        </button>
      </div>

      <div className="version-content">
        {activeTab === 'branches' && (
          <>
            <div className="version-section-header">
              <span>BRANCHES</span>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowNewBranch(!showNewBranch)} id="new-branch-btn">
                <Plus size={14} />
              </button>
            </div>

            {showNewBranch && (
              <div className="version-form">
                <input
                  className="input"
                  style={{ height: 32, fontSize: '0.8125rem' }}
                  placeholder="branch-name"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createBranch()}
                  id="branch-name-input"
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-primary btn-sm flex-1" onClick={createBranch} disabled={creating} id="create-branch-btn">
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowNewBranch(false)}>Cancel</button>
                </div>
              </div>
            )}

            {loadingBranches ? (
              <div style={{ padding: 12 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 4, borderRadius: 6 }} />)}
              </div>
            ) : branches.length === 0 ? (
              <div className="version-empty">
                <GitBranch size={28} style={{ opacity: 0.2 }} />
                <p>No branches yet</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowNewBranch(true)}>Create first branch</button>
              </div>
            ) : (
              <div className="branch-list">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className={`branch-item ${selectedBranch?.id === branch.id ? 'active' : ''}`}
                    onClick={() => {

                      setSelectedBranch(branch);

                      setActiveBranch(
                        branch.id,
                        branch.name
                      );

                      loadCommits(branch.id);

                      setActiveTab('history');
                    }}
                    id={`branch-${branch.id}`}
                  >
                    <GitBranch size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="branch-name">{branch.name}</div>
                      {branch.isDefault && <span className="badge badge-accent" style={{ fontSize: '0.6rem' }}>default</span>}
                    </div>
                    {!branch.isDefault && (
                      <button className="file-action-btn danger" onClick={(e) => { e.stopPropagation(); deleteBranch(branch); }}>
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Commit Form */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
              <button
                className="btn btn-secondary btn-sm w-full"
                onClick={() => setShowCommit(!showCommit)}
                id="new-commit-btn"
              >
                <GitCommit size={14} /> New Commit
              </button>
              {showCommit && (
                <div className="version-form" style={{ marginTop: 8 }}>
                  <input
                    className="input"
                    style={{ height: 32, fontSize: '0.8125rem' }}
                    placeholder="Commit message..."
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    id="commit-message-input"
                  />
                  <input
                    className="input"
                    style={{ height: 32, fontSize: '0.8125rem' }}
                    placeholder="Tag (optional, e.g. v1.0.0)"
                    value={commitTag}
                    onChange={(e) => setCommitTag(e.target.value)}
                    id="commit-tag-input"
                  />
                  <button className="btn btn-primary btn-sm w-full" onClick={createCommit} disabled={creating || !commitMessage.trim()} id="create-commit-btn">
                    {creating ? 'Committing...' : 'Create Commit'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <>
            {selectedBranch && (
              <div className="version-section-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GitBranch size={12} /> {selectedBranch.name}
                </span>
              </div>
            )}
            {loadingCommits ? (
              <div style={{ padding: 12 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 56, marginBottom: 4, borderRadius: 6 }} />)}
              </div>
            ) : commits.length === 0 ? (
              <div className="version-empty">
                <GitCommit size={28} style={{ opacity: 0.2 }} />
                <p>No commits yet</p>
              </div>
            ) : (
              <div className="commit-list">
                {commits.map((commit, i) => (
                  <div key={commit.id} className="commit-item" id={`commit-${commit.id}`}>
                    <div className="commit-timeline">
                      <div className="commit-dot" />
                      {i < commits.length - 1 && <div className="commit-line" />}
                    </div>
                    <div className="commit-content">
                      <div className="commit-message">{commit.message}</div>
                      <div className="commit-meta">
                        <span className="commit-hash">{commit.commitHash?.substring(0, 7)}</span>
                        <span>·</span>
                        <span>{commit.createdAt ? formatDistanceToNow(new Date(commit.createdAt), { addSuffix: true }) : ''}</span>
                      </div>
                      {commit.tag && <span className="badge badge-purple" style={{ marginTop: 4, fontSize: '0.65rem' }}><Tag size={8} /> {commit.tag}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .version-panel { display: flex; flex-direction: column; height: 100%; }
        .version-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .version-section-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px 8px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; color: var(--text-muted); text-transform: uppercase; }
        .version-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; color: var(--text-muted); font-size: 0.8125rem; }
        .version-form { display: flex; flex-direction: column; gap: 6px; padding: 0 16px 8px; }
        .branch-list { display: flex; flex-direction: column; padding: 4px 8px; }
        .branch-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: var(--radius-md); cursor: pointer; transition: background var(--transition-fast); }
        .branch-item:hover { background: var(--bg-elevated); }
        .branch-item.active { background: var(--accent-light); }
        .branch-name { font-size: 0.8125rem; font-weight: 500; font-family: var(--font-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .commit-list { display: flex; flex-direction: column; padding: 12px 16px; gap: 0; }
        .commit-item { display: flex; gap: 12px; }
        .commit-timeline { display: flex; flex-direction: column; align-items: center; width: 16px; flex-shrink: 0; }
        .commit-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); border: 2px solid var(--bg-surface); flex-shrink: 0; margin-top: 4px; }
        .commit-line { flex: 1; width: 2px; background: var(--border-subtle); min-height: 20px; }
        .commit-content { flex: 1; padding-bottom: 16px; }
        .commit-message { font-size: 0.8125rem; font-weight: 500; color: var(--text-primary); margin-bottom: 4px; }
        .commit-meta { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: var(--text-muted); }
        .commit-hash { font-family: var(--font-mono); background: var(--bg-elevated); padding: 1px 5px; border-radius: 3px; }
        .file-action-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 3px; border-radius: 3px; font-size: 16px; line-height: 1; }
        .file-action-btn.danger:hover { color: var(--red); }
      `}</style>
    </div>
  );
}
