import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const CRON_EXAMPLES = [
  { label: 'Every 5 min', value: '*/5 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day 9am', value: '0 9 * * *' },
  { label: 'Every Monday', value: '0 9 * * 1' },
];

const DEFAULT_FORM = { name: '', method: 'GET', url: '', cronExpression: '*/5 * * * *', runLabel: '', active: true, body: '' };

export default function SchedulerPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const res = await api.get('/scheduler'); setTests(res.data.tests); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      let parsedBody = null;
      if (form.body && String(form.body).trim()) {
        try { parsedBody = JSON.parse(form.body); } catch { return toast.error('Invalid JSON in Request Body'); }
      }
      
      const payload = { ...form, body: parsedBody };

      if (editing) {
        await api.put(`/scheduler/${editing}`, payload);
        toast.success('Updated!');
      } else {
        await api.post('/scheduler', payload);
        toast.success('Scheduled test created!');
      }
      setForm(DEFAULT_FORM); setEditing(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this scheduled test?')) return;
    try { await api.delete(`/scheduler/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const toggleActive = async (test) => {
    try {
      await api.put(`/scheduler/${test._id}`, { active: !test.active });
      toast.success(test.active ? 'Paused' : 'Activated');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Scheduler</h1>
        <p className="text-gray-500 text-sm">Configure recurring API tests with cron expressions</p>
      </div>

      {/* Form */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">{editing ? 'Edit Scheduled Test' : 'New Scheduled Test'}</h2>
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Health Check" className="input" required />
          </div>
          <div>
            <label className="label">URL</label>
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://api.example.com/health" className="input" required />
          </div>
          <div>
            <label className="label">Method</label>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="input">
              {['GET','POST','PUT','DELETE','PATCH'].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Run Label</label>
            <input value={form.runLabel} onChange={(e) => setForm({ ...form, runLabel: e.target.value })} placeholder="scheduled-run" className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Cron Expression</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {CRON_EXAMPLES.map((ex) => (
                <button type="button" key={ex.value} onClick={() => setForm({ ...form, cronExpression: ex.value })}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${form.cronExpression === ex.value ? 'border-brand-500 text-brand-400 bg-brand-600/10' : 'border-dark-500 text-gray-500 hover:border-gray-500'}`}>
                  {ex.label}
                </button>
              ))}
            </div>
            <input value={form.cronExpression} onChange={(e) => setForm({ ...form, cronExpression: e.target.value })} placeholder="*/5 * * * *" className="input font-mono text-sm" required />
          </div>
          
          {['POST', 'PUT', 'PATCH'].includes(form.method) && (
            <div className="md:col-span-2">
              <label className="label">Request Body <span className="text-gray-600">(JSON format)</span></label>
              <textarea 
                value={form.body} 
                onChange={(e) => setForm({ ...form, body: e.target.value })} 
                placeholder={`{\n  "key": "value"\n}`} 
                className="input font-mono text-xs resize-y" 
                rows={4} 
              />
            </div>
          )}

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="btn-primary px-5">{editing ? 'Save Changes' : 'Create'}</button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm(DEFAULT_FORM); }} className="btn-secondary px-5">Cancel</button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-dark-600 text-gray-500">
              <th className="text-left px-5 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Method</th>
              <th className="text-left px-4 py-3 font-medium">URL</th>
              <th className="text-left px-4 py-3 font-medium">Cron</th>
              <th className="text-left px-4 py-3 font-medium">Last Run</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-600">Loading…</td></tr>
            ) : tests.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-600">No scheduled tests yet</td></tr>
            ) : tests.map((t) => (
              <tr key={t._id} className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                <td className="px-5 py-3 text-gray-200 font-medium">{t.name}</td>
                <td className="px-4 py-3 font-mono text-blue-400">{t.method}</td>
                <td className="px-4 py-3 text-gray-400 font-mono max-w-xs truncate">{t.url}</td>
                <td className="px-4 py-3 font-mono text-purple-400">{t.cronExpression}</td>
                <td className="px-4 py-3 text-gray-500">{t.lastRun ? new Date(t.lastRun).toLocaleString() : 'Never'}</td>
                <td className="px-4 py-3">
                  {t.active ? <span className="badge-success">Active</span> : <span className="badge-neutral">Paused</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(t)} className="text-gray-500 hover:text-amber-400 transition-colors text-base">
                      {t.active ? '⏸' : '▶'}
                    </button>
                    <button onClick={() => { setEditing(t._id); setForm({ name: t.name, method: t.method, url: t.url, cronExpression: t.cronExpression, runLabel: t.runLabel, active: t.active, body: t.body ? JSON.stringify(t.body, null, 2) : '' }); }}
                      className="text-gray-500 hover:text-brand-400 transition-colors">✏</button>
                    <button onClick={() => del(t._id)} className="text-gray-500 hover:text-red-400 transition-colors">✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
