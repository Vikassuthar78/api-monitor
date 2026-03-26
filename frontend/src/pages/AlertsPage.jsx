import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const DEFAULT_FORM = { type: 'email', destination: '', thresholdMs: 500, label: '', active: true };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const res = await api.get('/alerts'); setAlerts(res.data.alerts); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/alerts/${editing}`, form); toast.success('Updated!'); }
      else { await api.post('/alerts', form); toast.success('Alert created!'); }
      setForm(DEFAULT_FORM); setEditing(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this alert?')) return;
    try { await api.delete(`/alerts/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const toggleActive = async (alert) => {
    try {
      await api.put(`/alerts/${alert._id}`, { active: !alert.active });
      toast.success(alert.active ? 'Disabled' : 'Enabled');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Alert Configuration</h1>
        <p className="text-gray-500 text-sm">Get notified when APIs are slow or failing</p>
      </div>

      {/* Info banner */}
      <div className="card border border-amber-500/30 bg-amber-500/5">
        <div className="flex gap-3 items-start text-sm">
          <span>⚠️</span>
          <div className="text-gray-400">
            <span className="text-amber-400 font-medium">Enable alerts in backend:</span> Set <code className="text-brand-400 font-mono text-xs bg-dark-900 px-1.5 py-0.5 rounded">EMAIL_ENABLED=true</code> or{' '}
            <code className="text-brand-400 font-mono text-xs bg-dark-900 px-1.5 py-0.5 rounded">SLACK_ENABLED=true</code> in your <code className="font-mono text-xs">.env</code> file and configure the credentials.
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">{editing ? 'Edit Alert' : 'New Alert'}</h2>
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Alert Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
              <option value="email">📧 Email</option>
              <option value="slack">💬 Slack Webhook</option>
            </select>
          </div>
          <div>
            <label className="label">{form.type === 'email' ? 'Email Address' : 'Slack Webhook URL'}</label>
            <input
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder={form.type === 'email' ? 'alert@example.com' : 'https://hooks.slack.com/…'}
              className="input" required
            />
          </div>
          <div>
            <label className="label">Threshold (ms) — alert when response time exceeds this</label>
            <input type="number" min="100" max="60000" value={form.thresholdMs}
              onChange={(e) => setForm({ ...form, thresholdMs: parseInt(e.target.value) })}
              className="input" />
          </div>
          <div>
            <label className="label">Label <span className="text-gray-600">(optional)</span></label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Production alerts" className="input" />
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="btn-primary px-5">{editing ? 'Save Changes' : 'Create Alert'}</button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm(DEFAULT_FORM); }} className="btn-secondary px-5">Cancel</button>
            )}
          </div>
        </form>
      </div>

      {/* Alert list */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-dark-600 text-gray-500">
              <th className="text-left px-5 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Destination</th>
              <th className="text-left px-4 py-3 font-medium">Threshold</th>
              <th className="text-left px-4 py-3 font-medium">Label</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-600">Loading…</td></tr>
            ) : alerts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-600">No alerts configured</td></tr>
            ) : alerts.map((a) => (
              <tr key={a._id} className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                <td className="px-5 py-3">
                  {a.type === 'email' ? <span className="badge-info">📧 Email</span> : <span className="badge-info">💬 Slack</span>}
                </td>
                <td className="px-4 py-3 text-gray-300 font-mono max-w-xs truncate">{a.destination}</td>
                <td className="px-4 py-3 text-amber-400 font-mono">{a.thresholdMs}ms</td>
                <td className="px-4 py-3 text-gray-500">{a.label || '—'}</td>
                <td className="px-4 py-3">
                  {a.active ? <span className="badge-success">Active</span> : <span className="badge-neutral">Disabled</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(a)} className="text-gray-500 hover:text-amber-400 transition-colors text-base">
                      {a.active ? '⏸' : '▶'}
                    </button>
                    <button onClick={() => { setEditing(a._id); setForm({ type: a.type, destination: a.destination, thresholdMs: a.thresholdMs, label: a.label, active: a.active }); }}
                      className="text-gray-500 hover:text-brand-400 transition-colors">✏</button>
                    <button onClick={() => del(a._id)} className="text-gray-500 hover:text-red-400 transition-colors">✕</button>
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
