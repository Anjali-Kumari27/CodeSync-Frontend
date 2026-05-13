import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Play, Save, GitBranch, Users, Settings, ChevronRight, ChevronDown,
  File, Folder, FolderOpen, Plus, Trash2, MoreVertical, MessageSquare, Edit3,
  Terminal, History, ArrowLeft, Code2, X, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fileApi, projectApi, executionApi, versionApi } from '../api/services';
import { useEditorStore, useAuthStore } from '../store';
import AppLayout from '../components/AppLayout';
import CodeEditor from '../components/CodeEditor';
import ExecutionPanel from '../components/ExecutionPanel';
import VersionPanel from '../components/VersionPanel';
import CommentsPanel from '../components/CommentsPanel';
import CreateFileModal from '../components/CreateFileModal';
import MembersModal from '../components/MembersModal';
import { useBranchStore } from '../store';

const LANG_MAP: Record<string, string> = {
  '.java': 'JAVA', '.py': 'PYTHON', '.js': 'JAVASCRIPT', '.ts': 'TYPESCRIPT',
  '.cpp': 'CPP', '.c': 'C', '.go': 'GO', '.rs': 'RUST', '.kt': 'KOTLIN', '.sh': 'BASH',
};

function getLanguage(filename: string): string {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return LANG_MAP[ext] || 'JAVASCRIPT';
}

// Backend uses fileName/fileType/filePath — normalize to name/type/path for UI
function normalizeFile(f: any): any {
  if (!f) return f;

  return {
    ...f,
    id: f.id,
    name: f.name ?? f.fileName,
    type: f.type ?? f.fileType,
    path: f.path ?? f.filePath,

    // FIX parent mapping
    parentId:
      f.parentId ??
      f.parent?.id ??
      null,

    children: f.children
      ? f.children.map(normalizeFile)
      : undefined,
  };
}

function normalizeTree(tree: any[]): any[] {
  return (tree || []).map(normalizeFile);
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const readOnly = searchParams.get('readOnly') === 'true';
  const { user } = useAuthStore();
  const { tabs, activeTabId, openTab, closeTab, setActiveTab, updateContent, markSaved } = useEditorStore();

  const [project, setProject] = useState<any>(null);
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rightPanel, setRightPanel] = useState<'execution' | 'git' | 'comments' | null>(null);
  const [showCreateFile, setShowCreateFile] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedParent, setSelectedParent] = useState<number | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const { activeBranchId } = useBranchStore();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: any;
  } | null>(null);

  const [renameFile, setRenameFile] = useState<any | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const projectId = parseInt(id!);
  const activeTab = tabs.find((t) => t.fileId === activeTabId);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const loadProject = async () => {
    try {
      setLoading(true);
      const [projRes, treeRes] = await Promise.all([
        projectApi.getById(projectId),
        fileApi.getTree(projectId),
      ]);
      setProject(projRes.data);
      // Normalize backend field names (fileName→name, fileType→type, filePath→path)
      setFileTree(normalizeTree(treeRes.data || []));
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Access denied');
        navigate('/dashboard');
      } else if (err.response?.status === 404) {
        toast.error('Project not found');
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (file: any) => {
    const normalized = normalizeFile(file);
    if (normalized.type === 'DIRECTORY') {
      toggleDir(normalized.id);
      return;
    }
    const existing = tabs.find((t) => t.fileId === normalized.id);
    if (existing) { setActiveTab(normalized.id); return; }

    try {
      const branchId = activeBranchId || 1;

      const res =
        await versionApi.getBranchFileContent(
          branchId,
          normalized.id
        );
      let content = res.data?.content ?? res.data ?? '';

      if (!content) {
        const fallback = await fileApi.getContent(normalized.id);
        content =
          fallback.data?.content ??
          fallback.data ??
          '';
      };
      openTab({
        fileId: normalized.id,
        fileName: normalized.name,
        filePath: normalized.path || normalized.name,
        content: typeof content === 'string' ? content : '',
        language: getLanguage(normalized.name || ''),
        dirty: false,
        projectId,
      });
    } catch {
      toast.error('Failed to open file');
    }
  };

  const saveFile = async () => {

    if (!activeTab || !activeTab.dirty) return;

    setSaving(true);

    try {

      const payload = {
        branchId: activeBranchId || 1,
        projectId: project.id,
        message: `Updated ${activeTab.fileName}`,
        files: [
          {
            fileId: activeTab.fileId || 1,
            filePath: activeTab.filePath || activeTab.fileName,
            content: activeTab.content || "",
            changeType: "MODIFIED"
          }
        ]
      };

      console.log("COMMIT PAYLOAD:", payload);

      await versionApi.createCommit(payload);

      toast.success("File saved successfully");

    } catch (err) {

      console.error(err);

      toast.error("Failed to save file");

    } finally {

      setSaving(false);

    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveFile();
    }
  }, [activeTab]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleDir = (id: number) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFileCreated = async (file: any) => {
    const normalized = normalizeFile(file);

    setShowCreateFile(false);

    if (normalized.parentId) {
      setExpandedDirs(prev => {
        const next = new Set(prev);
        next.add(normalized.parentId);
        return next;
      });
    }

    setSelectedParent(null);
    toast.success(`Created ${normalized.name}`);

    await loadProject();

    if (normalized.type !== 'DIRECTORY') {
      openFile(normalized);
    }
  };

  const deleteFile = async (file: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${file.name}"?`)) return;

    try {
      if (file.type === 'DIRECTORY') {
        await fileApi.deleteDirectory(file.id);
      } else {
        await fileApi.delete(file.id);
      }

      closeTab(file.id);
      toast.success('Deleted successfully');
      loadProject();
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const openContextMenu = (
    e: React.MouseEvent,
    file: any
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file
    });
  };

  const startRename = (file: any) => {
    setRenameFile(file);
    setRenameValue(file.name);
    setContextMenu(null);
  };

  const submitRename = async () => {
    if (!renameFile || !renameValue.trim()) return;

    try {
      const newName = renameValue.trim();

      await fileApi.update(renameFile.id, {
        fileName: newName,
        filePath: newName
      });

      // Auto rename Java public class
      if (
        renameFile.type === "FILE" &&
        renameFile.name.endsWith(".java") &&
        newName.endsWith(".java")
      ) {
        try {
          const res = await fileApi.getContent(renameFile.id);

          let content =
            res.data?.content ??
            res.data ??
            "";

          const oldClass = renameFile.name.replace(".java", "");
          const newClass = newName.replace(".java", "");

          const regex = new RegExp(
            `public\\s+class\\s+${oldClass}\\b`,
            "g"
          );

          content = content.replace(
            regex,
            `public class ${newClass}`
          );

          await fileApi.update(renameFile.id, {
            content
          });

        } catch (e) {
          console.error("Class rename sync failed", e);
        }
      }

      toast.success("Renamed successfully");

      setRenameFile(null);
      setRenameValue("");

      await loadProject();

    } catch (err) {
      console.error(err);
      toast.error("Rename failed");
    }
  };

  const createInsideFolder = (folderId: number) => {
    setSelectedParent(folderId);
    setShowCreateFile(true);
    setContextMenu(null);
  };

  const handleDeleteFromMenu = async () => {
    if (!contextMenu) return;

    const file = contextMenu.file;

    try {
      if (file.type === "DIRECTORY") {
        await fileApi.deleteDirectory(file.id);
      } else {
        await fileApi.delete(file.id);
      }

      closeTab(file.id);
      toast.success("Deleted successfully");

      setContextMenu(null);
      await loadProject();
    } catch {
      toast.error("Delete failed");
    }
  };


  if (loading) {
    return (
      <AppLayout hideNav>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
            <p className="text-muted">Loading project...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideNav>
      <div className="ide-layout">
        {/* ── IDE Topbar ── */}
        <div className="ide-topbar">
          <div className="ide-topbar-left">
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/dashboard')} data-tooltip="Back to Dashboard">
              <ArrowLeft size={16} />
            </button>
            <div className="ide-topbar-divider" />
            <Code2 size={16} style={{ color: 'var(--accent)' }} />
            <span className="ide-project-name">
              {project?.name} {readOnly && '(Read Only)'}
            </span>
            <ChevronRight size={14} className="text-muted" />
            {activeTab && <span className="ide-file-name">{activeTab.fileName}</span>}
            {activeTab?.dirty && <span className="dirty-dot" />}
          </div>

          <div className="ide-topbar-center">
            {tabs.map((tab) => (
              <div
                key={tab.fileId}
                className={`ide-tab ${tab.fileId === activeTabId ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.fileId)}
                id={`tab-${tab.fileId}`}
              >
                <File size={12} />
                <span className="ide-tab-name">{tab.fileName}</span>
                {tab.dirty && <span className="dirty-dot" />}
                <button
                  className="ide-tab-close"
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.fileId); }}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>

          <div className="ide-topbar-right">
            {!readOnly && (
              <button
                className={`btn btn-secondary btn-sm ${saving ? 'opacity-50' : ''}`}
                onClick={saveFile}
                disabled={!activeTab?.dirty || saving}
                id="save-btn"
              >
                <Save size={14} /> {saving ? 'Saving...' : 'Save'}
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setRightPanel(p => p === 'execution' ? null : 'execution')} id="run-btn">
              <Play size={14} /> Run
            </button>
            <div className="divider-vertical" />
            <button className={`btn btn-ghost btn-sm btn-icon ${rightPanel === 'git' ? 'active-icon' : ''}`} onClick={() => setRightPanel(p => p === 'git' ? null : 'git')} data-tooltip="Version Control">
              <GitBranch size={16} />
            </button>
            <button className={`btn btn-ghost btn-sm btn-icon ${rightPanel === 'comments' ? 'active-icon' : ''}`} onClick={() => setRightPanel(p => p === 'comments' ? null : 'comments')} data-tooltip="Comments">
              <MessageSquare size={16} />
            </button>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowMembers(true)} data-tooltip="Members">
              <Users size={16} />
            </button>
          </div>
        </div>

        {/* ── Main IDE Body ── */}
        <div className="ide-body">
          {/* File Explorer */}
          <div className="ide-sidebar">
            <div className="ide-sidebar-header">
              <span className="ide-sidebar-title">EXPLORER</span>
              {!readOnly && (
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => setShowCreateFile(true)}
                  data-tooltip="New File"
                  id="new-file-btn"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
            <div className="ide-file-tree">
              <FileTree
                nodes={fileTree}
                expandedDirs={expandedDirs}
                activeFileId={activeTabId}
                onOpen={openFile}
                onDelete={deleteFile}
                onNewFile={(parentId) => {
                  setSelectedParent(parentId);
                  setShowCreateFile(true);
                }}
                onContextMenu={readOnly ? undefined : openContextMenu}
              />
            </div>
          </div>

          {/* Editor Area */}
          <div className="ide-editor-area">
            {activeTab ? (

              <CodeEditor
                key={activeTab.fileId}
                fileId={activeTab.fileId}
                content={activeTab.content}
                language={activeTab.language}
                onChange={(content) => {
                  if (!readOnly) {
                    updateContent(activeTab.fileId, content);
                  }
                }}
                projectId={projectId}
              />

            ) : (
              <div className="ide-empty">
                <Code2 size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Open a file from the explorer to start editing
                </p>

                {!readOnly && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 12 }}
                    onClick={() => setShowCreateFile(true)}
                  >
                    <Plus size={14} /> Create New File
                  </button>
                )}


              </div>
            )}
          </div>

          {/* Right Panel */}
          {rightPanel && (
            <div className="ide-right-panel">
              <div className="ide-panel-header">
                <span className="ide-panel-title">
                  {rightPanel === 'execution' && <><Terminal size={14} /> Terminal</>}
                  {rightPanel === 'git' && <><GitBranch size={14} /> Version Control</>}
                  {rightPanel === 'comments' && <><MessageSquare size={14} /> Comments</>}
                </span>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setRightPanel(null)}>
                  <X size={14} />
                </button>
              </div>
              {rightPanel === 'execution' && activeTab && (
                <ExecutionPanel
                  code={activeTab.content}
                  language={activeTab.language}
                  fileId={activeTab.fileId}
                  projectId={projectId}
                />
              )}
              {rightPanel === 'git' && <VersionPanel projectId={projectId} />}
              {rightPanel === 'comments' && activeTab && (
                <CommentsPanel fileId={activeTab.fileId} projectId={projectId} />
              )}
            </div>
          )}
        </div>

        {showCreateFile && (
          <CreateFileModal
            projectId={projectId}
            parentId={selectedParent}
            onClose={() => { setShowCreateFile(false); setSelectedParent(null); }}
            onCreated={handleFileCreated}
          />
        )}
        {showMembers && project && (
          <MembersModal project={project} onClose={() => setShowMembers(false)} />
        )}


        {contextMenu && (
          <div
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: 8,
              padding: 6,
              zIndex: 9999,
              minWidth: 160,
              boxShadow: "0 10px 30px rgba(0,0,0,.35)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.file.type === "DIRECTORY" && (
              <>
                <div
                  className="ctx-item"
                  onClick={() => createInsideFolder(contextMenu.file.id)}
                >
                  <Plus size={14} /> New File
                </div>

                <div
                  className="ctx-item"
                  onClick={() => {
                    setSelectedParent(contextMenu.file.id);
                    setShowCreateFile(true);
                    setContextMenu(null);
                  }}
                >
                  <Folder size={14} /> New Folder
                </div>
              </>
            )}

            <div
              className="ctx-item"
              onClick={() => startRename(contextMenu.file)}
            >
              <Edit3 size={14} /> Rename
            </div>

            <div
              className="ctx-item danger"
              onClick={handleDeleteFromMenu}
            >
              <Trash2 size={14} /> Delete
            </div>

            <style>{`
      .ctx-item{
        display:flex;
        align-items:center;
        gap:8px;
        padding:8px 10px;
        border-radius:6px;
        cursor:pointer;
        font-size:14px;
        color:white;
      }

      .ctx-item:hover{
        background:#2d2d2d;
      }

      .ctx-item.danger:hover{
        background:#ef4444;
      }
    `}</style>
          </div>
        )}

        {renameFile && (
          <div className="modal-backdrop">
            <div className="modal modal-sm">
              <div className="modal-header">
                <h3>Rename</h3>
              </div>

              <div style={{ padding: 16 }}>
                <input
                  className="input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setRenameFile(null)}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  onClick={submitRename}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        .ide-layout { display: flex; flex-direction: column; height: 100vh; background: var(--bg-base); }
        .ide-topbar {
          display: flex; align-items: center; justify-content: space-between;
          height: 48px; padding: 0 12px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-subtle);
          gap: 12px; flex-shrink: 0; z-index: 10;
        }
        .ide-topbar-left { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 0 0 auto; }
        .ide-topbar-divider { width: 1px; height: 20px; background: var(--border-subtle); }
        .ide-project-name { font-weight: 600; font-size: 0.875rem; color: var(--text-secondary); }
        .ide-file-name { font-size: 0.8125rem; color: var(--text-muted); font-family: var(--font-mono); }
        .dirty-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--yellow); flex-shrink: 0; }
        .ide-topbar-center {
          display: flex; align-items: center; gap: 2px; flex: 1; overflow-x: auto;
          scrollbar-width: none;
        }
        .ide-topbar-center::-webkit-scrollbar { display: none; }
        .ide-tab {
          display: flex; align-items: center; gap: 6px;
          padding: 0 10px 0 12px; height: 32px;
          border-radius: var(--radius-sm);
          cursor: pointer; flex-shrink: 0;
          font-size: 0.8125rem; color: var(--text-muted);
          border: 1px solid transparent;
          transition: all var(--transition-fast);
          font-family: var(--font-mono);
          white-space: nowrap;
        }
        .ide-tab:hover { background: var(--bg-elevated); color: var(--text-secondary); }
        .ide-tab.active { background: var(--bg-elevated); color: var(--text-primary); border-color: var(--border-subtle); }
        .ide-tab-name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
        .ide-tab-close { background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 2px; border-radius: 3px; opacity: 0; transition: opacity var(--transition-fast); }
        .ide-tab:hover .ide-tab-close { opacity: 1; }
        .ide-tab-close:hover { background: var(--bg-hover); color: var(--text-primary); }
        .ide-topbar-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .active-icon { background: var(--accent-light) !important; color: var(--accent) !important; }
        .ide-body { display: flex; flex: 1; overflow: hidden; }
        .ide-sidebar {
          width: 240px; flex-shrink: 0;
          background: var(--bg-surface);
          border-right: 1px solid var(--border-subtle);
          display: flex; flex-direction: column; overflow: hidden;
        }
        .ide-sidebar-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px 8px;
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
          color: var(--text-muted); flex-shrink: 0;
        }
        .ide-sidebar-title { color: var(--text-muted); }
        .ide-file-tree { flex: 1; overflow-y: auto; padding: 4px 0; }
        .ide-editor-area { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
        .ide-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ide-right-panel {
          width: 360px; flex-shrink: 0;
          border-left: 1px solid var(--border-subtle);
          background: var(--bg-surface);
          display: flex; flex-direction: column; overflow: hidden;
        }
        .ide-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 0.75rem; font-weight: 700; color: var(--text-muted);
          letter-spacing: 0.06em; flex-shrink: 0;
        }
        .ide-panel-title { display: flex; align-items: center; gap: 6px; }
      `}</style>
    </AppLayout>
  );
}


function FileTree({
  nodes,
  expandedDirs,
  activeFileId,
  onOpen,
  onContextMenu
}: any) {
  const sortNodes = (items: any[]) => {
    return [...items].sort((a, b) => {
      if (a.type === "DIRECTORY" && b.type !== "DIRECTORY") return -1;
      if (a.type !== "DIRECTORY" && b.type === "DIRECTORY") return 1;
      return a.name.localeCompare(b.name);
    });
  };

  const renderNodes = (items: any[], level: number): React.ReactNode => {
    return sortNodes(items).map((node) => {
      const isDir = node.type === "DIRECTORY";
      const isOpen = expandedDirs.has(node.id);
      const isActive = node.id === activeFileId;

      return (
        <div key={node.id}>
          <div
            className={`file-item ${isActive ? "file-item-active" : ""}`}
            style={{ paddingLeft: 12 + level * 18 }}
            onClick={() => onOpen(node)}
            onContextMenu={(e) => onContextMenu(e, node)}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              {isDir ? (
                isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
              ) : (
                <span style={{ width: 12 }} />
              )}

              {isDir
                ? (isOpen ? <FolderOpen size={14} /> : <Folder size={14} />)
                : <File size={13} />}
            </span>

            <span className="file-item-name">{node.name}</span>
          </div>

          {isDir &&
            isOpen &&
            node.children &&
            node.children.length > 0 &&
            renderNodes(node.children, level + 1)}
        </div>
      );
    });
  };

  return (
    <>
      {renderNodes(nodes, 0)}

      <style>{`
        .file-item{
          display:flex;
          align-items:center;
          gap:6px;
          height:28px;
          cursor:pointer;
          font-size:0.8125rem;
          color:var(--text-secondary);
          border-radius:4px;
          margin:1px 4px;
          user-select:none;
        }

        .file-item:hover{
          background:var(--bg-elevated);
        }

        .file-item-active{
          background:var(--accent-light);
          color:var(--accent);
        }

        .file-item-name{
          flex:1;
          font-family:var(--font-mono);
        }
      `}</style>
    </>
  );
}
