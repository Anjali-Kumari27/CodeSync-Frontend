import React, { useState } from 'react';
import { X, Plus, Folder, File } from 'lucide-react';
import toast from 'react-hot-toast';
import { fileApi } from '../api/services';

interface Props {
  projectId: number;
  parentId: number | null;
  onClose: () => void;
  onCreated: (file: any) => void;
}

export default function CreateFileModal({ projectId, parentId, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'FILE' | 'DIRECTORY'>('FILE');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) { setError('Name is required'); return; }

    setLoading(true);
    setError('');
    try {
      // Backend expects: filePath (NOT path), fileType (NOT type)
      // filePath = just the file/dir name for root-level, no leading slash
      const filePath = trimmedName.replace(/^\/+/, ''); // strip any leading slashes

      const res = await fileApi.create({
        projectId,
        filePath,
        fileType: type,           // 'FILE' | 'DIRECTORY'
        content: type === 'FILE' ? content : undefined,
        parentId: parentId ?? undefined,
      });
      // onCreated will close/unmount this modal — call it last
      onCreated(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.join(', ')
        || 'Failed to create';
      setError(msg);
      console.error('File creation error:', err.response?.data || err.message);
      setLoading(false); // only reset on error; success unmounts the component
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-header">
          <h3 className="modal-title">
            {type === 'FILE' ? <><File size={16} /> New File</> : <><Folder size={16} /> New Directory</>}
          </h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Type Toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          <button
            className={`btn btn-sm flex-1 ${type === 'FILE' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setType('FILE')}
            id="create-file-btn"
          >
            <File size={14} /> File
          </button>
          <button
            className={`btn btn-sm flex-1 ${type === 'DIRECTORY' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setType('DIRECTORY')}
            id="create-dir-btn"
          >
            <Folder size={14} /> Directory
          </button>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Name</label>
          <input
            className="input"
            placeholder={type === 'FILE' ? 'e.g. Main.java, index.ts' : 'e.g. src, utils'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
            id="file-name-input"
          />
          {error && <p className="form-error">{error}</p>}
        </div>

        {type === 'FILE' && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Initial Content (optional)</label>
            <textarea
              className="textarea"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', minHeight: 100 }}
              placeholder="// Enter initial file content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              id="file-content-input"
            />
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading || !name.trim()} id="confirm-create-file-btn">
            {loading ? <><div className="spinner spinner-sm" /> Creating...</> : <><Plus size={14} /> Create</>}
          </button>
        </div>
      </div>
    </div>
  );
}
