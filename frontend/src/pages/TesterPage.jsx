import { useState, useRef } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const METHOD_COLORS = { GET:'text-emerald-400', POST:'text-blue-400', PUT:'text-amber-400', DELETE:'text-red-400', PATCH:'text-purple-400' };

const defaultHeaders = [{ key: 'Content-Type', value: 'application/json' }];

function HeadersEditor({ headers, setHeaders }) {
  const add = () => setHeaders([...headers, { key: '', value: '' }]);
  const remove = (i) => setHeaders(headers.filter((_, idx) => idx !== i));
  const update = (i, field, val) => setHeaders(headers.map((h, idx) => idx === i ? { ...h, [field]: val } : h));
  return (
    <div className="space-y-2">
      {headers.map((h, i) => (
        <div key={i} className="flex gap-2">
          <input value={h.key} onChange={(e) => update(i, 'key', e.target.value)} placeholder="Key" className="input text-xs py-1.5 flex-1" />
          <input value={h.value} onChange={(e) => update(i, 'value', e.target.value)} placeholder="Value" className="input text-xs py-1.5 flex-1" />
          <button onClick={() => remove(i)} className="text-red-400 hover:text-red-300 px-2">✕</button>
        </div>
      ))}
      <button onClick={add} className="btn-secondary text-xs py-1 px-3">+ Add Header</button>
    </div>
  );
}

function StatusBadge({ code }) {
  if (!code) return null;
  const cls = code < 300 ? 'badge-success' : code < 400 ? 'badge-warn' : 'badge-danger';
  return <span className={cls}>{code}</span>;
}

export default function TesterPage() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [headers, setHeaders] = useState(defaultHeaders);
  const [body, setBody] = useState('');
  const [queryParams, setQueryParams] = useState([]);
  const [runLabel, setRunLabel] = useState('');
  const [tab, setTab] = useState('body');
  const [resTab, setResTab] = useState('body');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const startRef = useRef(null);

  const headersObj = Object.fromEntries(headers.filter((h) => h.key).map((h) => [h.key, h.value]));
  const paramsObj = Object.fromEntries(queryParams.filter((p) => p.key).map((p) => [p.key, p.value]));

  const run = async () => {
    if (!url.trim()) return toast.error('URL is required');
    let parsedBody = undefined;
    if (body.trim() && ['POST','PUT','PATCH'].includes(method)) {
      try { parsedBody = JSON.parse(body); } catch { return toast.error('Invalid JSON body'); }
    }
    setLoading(true);
    try {
      const res = await api.post('/test/run', {
        method, url, headers: headersObj,
        body: parsedBody, queryParams: paramsObj, runLabel,
      });
      setResult(res.data.log);
      if (res.data.log.isSlowApi) toast.error(`⚠️ Slow API: ${res.data.log.responseTimeMs}ms`);
      else if (res.data.log.isFailed) toast.error(`Request failed (${res.data.log.responseStatus})`);
      else toast.success(`${res.data.log.responseStatus} — ${res.data.log.responseTimeMs}ms`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request error');
    } finally {
      setLoading(false);
    }
  };

  const formatBody = (b) => {
    if (typeof b === 'string') return b;
    try { return JSON.stringify(b, null, 2); } catch { return String(b); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">API Tester</h1>
        <p className="text-gray-500 text-sm">Fire HTTP requests and inspect responses</p>
      </div>

      {/* Request builder */}
      <div className="card space-y-4">
        {/* Method + URL + Send */}
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={`input w-28 font-mono font-semibold text-sm py-2.5 ${METHOD_COLORS[method]}`}
          >
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            className="input flex-1 font-mono text-sm"
          />
          <button onClick={run} disabled={loading} className="btn-primary px-6 shrink-0 flex items-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '▶'}
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>

        {/* Run label */}
        <div>
          <label className="label">Run Label <span className="text-gray-600">(for comparison)</span></label>
          <input value={runLabel} onChange={(e) => setRunLabel(e.target.value)} placeholder="v1-run" className="input text-sm py-1.5 max-w-xs" />
        </div>

        {/* Tabs */}
        <div className="border-b border-dark-600">
          {['headers', ...((['POST','PUT','PATCH'].includes(method)) ? ['body'] : []), 'params'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'headers' && <HeadersEditor headers={headers} setHeaders={setHeaders} />}

        {tab === 'body' && (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={'{\n  "key": "value"\n}'}
            rows={8}
            className="input font-mono text-xs resize-y"
          />
        )}

        {tab === 'params' && (
          <HeadersEditor
            headers={queryParams}
            setHeaders={setQueryParams}
          />
        )}
      </div>

      {/* Response panel */}
      {result && (
        <div className="card space-y-4 animate-slide-up">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-gray-300">Response</h2>
            <div className="flex items-center gap-3 text-xs">
              <StatusBadge code={result.responseStatus} />
              <span className={`font-mono font-semibold ${result.responseTimeMs > 500 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ⏱ {result.responseTimeMs}ms
              </span>
              {result.isSlowApi && <span className="badge-warn">⚠ Slow</span>}
              {result.isFailed && <span className="badge-danger">✗ Failed</span>}
            </div>
          </div>

          <div className="border-b border-dark-600">
            {['body', 'headers'].map((t) => (
              <button key={t} onClick={() => setResTab(t)}
                className={`px-4 py-2 text-xs font-medium capitalize border-b-2 transition-colors ${resTab === t ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                {t}
              </button>
            ))}
          </div>

          {resTab === 'body' && (
            <pre className="bg-dark-900 rounded-lg p-4 text-xs font-mono text-gray-300 overflow-auto max-h-96 border border-dark-600">
              {formatBody(result.responseBody)}
            </pre>
          )}
          {resTab === 'headers' && (
            <div className="space-y-1.5">
              {Object.entries(result.responseHeaders || {}).map(([k, v]) => (
                <div key={k} className="flex gap-3 text-xs">
                  <span className="text-brand-400 font-mono min-w-40 shrink-0">{k}</span>
                  <span className="text-gray-400 font-mono break-all">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
