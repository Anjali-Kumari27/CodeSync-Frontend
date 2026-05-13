import React, { useState } from 'react';
import { Play, Square, ChevronDown, AlertCircle, CheckCircle, Clock, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { executionApi } from '../api/services';

interface Props {
  code: string;
  language: string;
  fileId: number;
  projectId: number;
}

const LANG_OPTIONS = ['JAVA', 'PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'C', 'CPP', 'GO', 'RUST', 'KOTLIN', 'BASH'];

export default function ExecutionPanel({ code, language, fileId, projectId }: Props) {
  const [selectedLang, setSelectedLang] = useState(language);
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Executing...');
  const [result, setResult] = useState<any>(null);
  const [pollingId, setPollingId] = useState<number | null>(null);
  const [execId, setExecId] = useState<number | null>(null);

  const run = async () => {
    if (!code.trim()) { toast.error('No code to execute'); return; }
    setRunning(true);
    setResult(null);
    setStatusMsg('Submitting...');
    try {
      const res = await executionApi.execute({
        projectId,
        fileId,
        code,
        language: selectedLang,
        stdin: stdin || undefined,
      });
      setExecId(res.data.id);
      setStatusMsg('Queued — pulling Docker image if needed...');

      let attempts = 0;
      // 90 attempts × 1s = 90s max (first run needs time to pull Docker image)
      const MAX_ATTEMPTS = 90;

      const interval = window.setInterval(async () => {
        attempts++;
        if (attempts === 10) setStatusMsg('Compiling / running...');
        if (attempts === 30) setStatusMsg('Still running — Docker image may be downloading for the first time...');
        try {
          const poll = await executionApi.getById(res.data.id);
          const status = poll.data.status;
          if (status === 'COMPLETED' || status === 'FAILED' || status === 'TIMED_OUT') {
            clearInterval(interval);
            setResult(poll.data);
            setRunning(false);
            setPollingId(null);
          } else if (attempts >= MAX_ATTEMPTS) {
            clearInterval(interval);
            setRunning(false);
            setResult({ status: 'FAILED', errorMessage: 'Timed out waiting for result. The Docker image might still be downloading — try again in a minute.' });
          }
        } catch {
          clearInterval(interval);
          setRunning(false);
          setResult({ status: 'FAILED', errorMessage: 'Lost connection to execution service.' });
        }
      }, 1000);
      setPollingId(interval);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Execution failed';
      toast.error(msg);
      setResult({ status: 'FAILED', errorMessage: msg });
      setRunning(false);
    }
  };

  const cancel = async () => {
    if (pollingId) clearInterval(pollingId);
    if (execId) {
      try { await executionApi.cancel(execId); } catch {}
    }
    setRunning(false);
    setResult({ status: 'FAILED', errorMessage: 'Cancelled by user' });
  };

  const success = result?.status === 'COMPLETED' && result?.exitCode === 0;
  const failed = result && !success;

  return (
    <div className="exec-panel">
      {/* Controls */}
      <div className="exec-controls">
        <div className="exec-lang-select">
          <select
            className="select"
            style={{ height: 32, fontSize: '0.8125rem', width: 'auto', minWidth: 120 }}
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            id="exec-language-select"
          >
            {LANG_OPTIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="exec-btns">
          {running ? (
            <button className="btn btn-danger btn-sm" onClick={cancel} id="cancel-exec-btn">
              <Square size={12} /> Cancel
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={run} id="run-exec-btn">
              <Play size={12} /> Run
            </button>
          )}
        </div>
      </div>

      {/* Stdin */}
      <div className="exec-section">
        <div className="exec-section-label">Standard Input (stdin)</div>
        <textarea
          className="textarea"
          style={{ minHeight: 60, fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', resize: 'vertical' }}
          placeholder="Enter input for your program..."
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          id="exec-stdin"
        />
      </div>

      {/* Output */}
      <div className="exec-output">
        <div className="exec-section-label" style={{ padding: '0 0 8px' }}>
          Output
          {result && (
            <span className={`badge ${success ? 'badge-green' : 'badge-red'} ml-2`} style={{ marginLeft: 8 }}>
              {success ? <><CheckCircle size={10} /> Success</> : <><AlertCircle size={10} /> {result.status}</>}
            </span>
          )}
        </div>

        {running ? (
          <div className="exec-running">
            <div className="spinner spinner-sm" />
            <span>{statusMsg}</span>
          </div>
        ) : result ? (
          <div className="exec-result">
            {result.executionTimeMs && (
              <div className="exec-meta">
                <Clock size={12} /> {result.executionTimeMs}ms · Exit code: {result.exitCode ?? 'N/A'}
              </div>
            )}
            {result.stdout && (
              <div>
                <div className="exec-output-label">stdout</div>
                <pre className="exec-output-text">{result.stdout}</pre>
              </div>
            )}
            {result.stderr && (
              <div>
                <div className="exec-output-label error">stderr</div>
                <pre className="exec-output-text error">{result.stderr}</pre>
              </div>
            )}
            {result.errorMessage && (
              <div>
                <div className="exec-output-label error">Error</div>
                <pre className="exec-output-text error">{result.errorMessage}</pre>
              </div>
            )}
            {!result.stdout && !result.stderr && !result.errorMessage && (
              <p className="text-muted text-sm" style={{ padding: 8 }}>No output</p>
            )}
          </div>
        ) : (
          <div className="exec-placeholder">
            <Play size={24} style={{ opacity: 0.2 }} />
            <p>Click Run to execute your code</p>
          </div>
        )}
      </div>

      <style>{`
        .exec-panel { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
        .exec-controls {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }
        .exec-lang-select { display: flex; align-items: center; }
        .exec-btns { display: flex; gap: 6px; }
        .exec-section { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; }
        .exec-section-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; }
        .exec-output { flex: 1; overflow-y: auto; padding: 12px 16px; }
        .exec-running { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.875rem; padding: 12px 0; }
        .exec-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; height: 120px; color: var(--text-muted); font-size: 0.8125rem; }
        .exec-result { display: flex; flex-direction: column; gap: 12px; }
        .exec-meta { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; }
        .exec-output-label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.06em; margin-bottom: 4px; text-transform: uppercase; }
        .exec-output-label.error { color: var(--red); }
        .exec-output-text {
          background: var(--bg-base); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm); padding: 10px 12px;
          font-family: var(--font-mono); font-size: 0.8rem;
          white-space: pre-wrap; word-break: break-all;
          color: var(--text-primary); max-height: 300px; overflow-y: auto;
        }
        .exec-output-text.error { color: var(--red); border-color: rgba(248,113,113,0.3); }
      `}</style>
    </div>
  );
}
