import React, { useState } from 'react';
import { X, Plus, Globe, Lock, Code } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectApi } from '../api/services';

interface Props {
  onClose: () => void;
  onCreated: (project: any) => void;
}

const LANGUAGES = ['JAVA', 'PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'GO', 'RUST', 'CPP', 'C', 'KOTLIN', 'BASH'];
const LANG_COLORS: Record<string, string> = {
  JAVA: '#f89820', PYTHON: '#3572A5', JAVASCRIPT: '#f1e05a', TYPESCRIPT: '#3178c6',
  GO: '#00ADD8', RUST: '#dea584', CPP: '#f34b7d', C: '#555555', KOTLIN: '#A97BFF', BASH: '#89e051',
};

export default function CreateProjectModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    language: 'PYTHON',
    visibility: 'PRIVATE',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await projectApi.create(form);
      // Call onCreated first to close the modal, then let parent handle refresh
      onCreated(res.data);
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 401 || status === 403) {
        toast.error('Session expired. Please log in again.');
      } else if (status === 409) {
        toast.error('A project with this name already exists');
      } else if (!err.response) {
        toast.error('Cannot reach server. Is the backend running?');
      } else {
        toast.error(msg || 'Failed to create project');
      }
      console.error('Project creation error:', err.response?.data || err.message);
      // Don't close on error — let user fix and retry
      setLoading(false);
    }
    // Note: do NOT put setLoading(false) in finally when success calls onCreated
    // because onCreated unmounts this component (setShowCreate(false))
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">New Project</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              id="project-name-input"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="my-awesome-project"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              id="project-desc-input"
              className="textarea"
              placeholder="What is this project about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ minHeight: 70 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Primary Language</label>
            <div className="lang-grid">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`lang-option ${form.language === lang ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, language: lang })}
                  id={`lang-${lang.toLowerCase()}`}
                >
                  <div className="lang-dot" style={{ background: LANG_COLORS[lang] }} />
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Visibility</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className={`visibility-option ${form.visibility === 'PRIVATE' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, visibility: 'PRIVATE' })}
                id="visibility-private"
              >
                <Lock size={16} />
                <div>
                  <div className="font-semibold text-sm">Private</div>
                  <div className="text-xs text-muted">Only members can access</div>
                </div>
              </button>
              <button
                type="button"
                className={`visibility-option ${form.visibility === 'PUBLIC' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, visibility: 'PUBLIC' })}
                id="visibility-public"
              >
                <Globe size={16} />
                <div>
                  <div className="font-semibold text-sm">Public</div>
                  <div className="text-xs text-muted">Anyone can view</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading} id="confirm-create-project-btn">
            {loading ? <><div className="spinner spinner-sm" /> Creating...</> : <><Plus size={14} /> Create Project</>}
          </button>
        </div>
      </div>

      <style>{`
        .lang-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .lang-option {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 10px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-size: 0.75rem; font-weight: 500;
          cursor: pointer; color: var(--text-secondary);
          font-family: var(--font-sans);
          transition: all var(--transition-fast);
        }
        .lang-option:hover { border-color: var(--border-default); color: var(--text-primary); }
        .lang-option.selected { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }
        .lang-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .visibility-option {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer; color: var(--text-secondary);
          font-family: var(--font-sans);
          transition: all var(--transition-fast);
          text-align: left;
        }
        .visibility-option:hover { border-color: var(--border-default); color: var(--text-primary); }
        .visibility-option.selected { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }
        .input-error { border-color: var(--red) !important; }
      `}</style>
    </div>
  );
}
