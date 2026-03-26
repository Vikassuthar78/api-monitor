import { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const METHODS = ['GET','POST','PUT','DELETE','PATCH'];

function StatusBadge({ code }) {
  if (!code) return <span className="badge-danger">ERR</span>;
  if (code < 300) return <span className="badge-success">{code}</span>;
  if (code < 400) return <span className="badge-warn">{code}</span>;
  return <span className="badge-danger">{code}</span>;
}

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  // Filters
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterFailed, setFilterFailed] = useState('');
  const [filterSlow, setFilterSlow] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (url) params.url = url;
      if (method) params.method = method;
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
      if (filterFailed) params.isFailed = filterFailed;
      if (filterSlow) params.isSlowApi = filterSlow;
      const res = await api.get('/logs', { params });
      setLogs(res.data.logs);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  }, [page, url, method, startDate, endDate, filterFailed, filterSlow]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const deleteLog = async (id) => {
    try {
      await api.delete(`/logs/${id}`);
      toast.success('Deleted');
      fetchLogs();
      if (selected?._id === id) setSelected(null);
    } catch { toast.error('Delete failed'); }
  };

  const clearAll = async () => {
    if (!confirm('Clear all logs?')) return;
    try { await api.delete('/logs/clear/all'); toast.success('Logs cleared'); fetchLogs(); }
    catch { toast.error('Failed'); }
  };

  const exportCSV = () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (url) params.set('url', url);
    if (method) params.set('method', method);
    if (startDate) params.set('startDate', new Date(startDate).toISOString());
    if (endDate) params.set('endDate', new Date(endDate).toISOString());
    window.open(`/api/export/csv?${params}&token=${token}`, '_blank');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Logs</h1>
          <p className="text-gray-500 text-sm">{total} total entries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary text-xs py-2 px-3">⬇ CSV</button>
          <button onClick={clearAll} className="btn-danger text-xs py-2 px-3">🗑 Clear All</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <input value={url} onChange={(e) => { setUrl(e.target.value); setPage(1); }} placeholder="Filter URL…" className="input text-xs py-1.5" />
        <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }} className="input text-xs py-1.5">
          <option value="">All Methods</option>
          {METHODS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <input type="datetime-local" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="input text-xs py-1.5" />
        <input type="datetime-local" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="input text-xs py-1.5" />
        <select value={filterFailed} onChange={(e) => { setFilterFailed(e.target.value); setPage(1); }} className="input text-xs py-1.5">
          <option value="">All Status</option>
          <option value="true">Failed Only</option>
          <option value="false">Success Only</option>
        </select>
        <select value={filterSlow} onChange={(e) => { setFilterSlow(e.target.value); setPage(1); }} className="input text-xs py-1.5">
          <option value="">All Speed</option>
          <option value="true">Slow Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-dark-600 text-gray-500">
                <th className="text-left px-4 py-3 font-medium">Timestamp</th>
                <th className="text-left px-4 py-3 font-medium">Method</th>
                <th className="text-left px-4 py-3 font-medium">URL</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Time</th>
                <th className="text-left px-4 py-3 font-medium">Label</th>
                <th className="text-left px-4 py-3 font-medium">Flags</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-600">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-600">No logs yet. Run some API tests!</td></tr>
              ) : logs.map((log) => (
                <tr key={log._id}
                  onClick={() => setSelected(log === selected ? null : log)}
                  className={`border-b border-dark-700 cursor-pointer transition-colors hover:bg-dark-700/50 ${selected?._id === log._id ? 'bg-brand-600/10' : ''}`}>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-semibold ${
                      log.method === 'GET' ? 'text-emerald-400' :
                      log.method === 'POST' ? 'text-blue-400' :
                      log.method === 'PUT' ? 'text-amber-400' :
                      log.method === 'DELETE' ? 'text-red-400' : 'text-purple-400'
                    }`}>{log.method}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 max-w-xs truncate font-mono">{log.url}</td>
                  <td className="px-4 py-3"><StatusBadge code={log.responseStatus} /></td>
                  <td className={`px-4 py-3 font-mono font-semibold ${log.isSlowApi ? 'text-amber-400' : 'text-emerald-400'}`}>{log.responseTimeMs}ms</td>
                  <td className="px-4 py-3 text-gray-500">{log.runLabel || '—'}</td>
                  <td className="px-4 py-3">
                    {log.isSlowApi && <span className="badge-warn mr-1">SLOW</span>}
                    {log.isFailed && <span className="badge-danger">FAIL</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={(e) => { e.stopPropagation(); deleteLog(log._id); }}
                      className="text-gray-600 hover:text-red-400 transition-colors">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3">← Prev</button>
          <span className="text-gray-500 text-xs">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary text-xs py-1.5 px-3">Next →</button>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="card animate-slide-up space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">Request Detail</h2>
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="label">Request Body</div>
              <pre className="bg-dark-900 rounded-lg p-3 text-xs font-mono text-gray-300 overflow-auto max-h-48 border border-dark-600">
                {selected.requestBody ? JSON.stringify(selected.requestBody, null, 2) : 'null'}
              </pre>
            </div>
            <div>
              <div className="label">Response Body</div>
              <pre className="bg-dark-900 rounded-lg p-3 text-xs font-mono text-gray-300 overflow-auto max-h-48 border border-dark-600">
                {typeof selected.responseBody === 'string' ? selected.responseBody : JSON.stringify(selected.responseBody, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
