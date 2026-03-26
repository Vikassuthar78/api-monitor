import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../api/axiosInstance';

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

const StatCard = ({ icon, label, value, sub, color = 'brand' }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl
      ${color === 'green' ? 'bg-emerald-500/20' :
        color === 'red' ? 'bg-red-500/20' :
        color === 'amber' ? 'bg-amber-500/20' : 'bg-brand-600/20'}`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card text-xs p-2.5 shadow-xl border border-dark-500">
      <div className="text-gray-400 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, e] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/trends?bucket=hour'),
          api.get('/analytics/endpoints'),
        ]);
        setSummary(s.data.summary);
        setTrends(t.data.trends.map((x) => ({ ...x, time: x._id, avg: Math.round(x.avgResponseTime), max: x.maxResponseTime })));
        setEndpoints(e.data.endpoints.slice(0, 8).map((x) => ({
          name: `${x._id.method} ${x._id.url.replace(/https?:\/\/[^/]+/, '').slice(0, 30)}`,
          avg: Math.round(x.avgResponseTime),
          count: x.count,
        })));
      } catch { /* no logs yet */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pieData = summary ? [
    { name: 'Success', value: summary.success },
    { name: 'Failed', value: summary.failed },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm">Real-time API performance overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📡" label="Total Requests" value={summary?.total ?? 0} />
        <StatCard icon="✅" label="Successful" value={summary?.success ?? 0} color="green" />
        <StatCard icon="❌" label="Failed" value={summary?.failed ?? 0} color="red" />
        <StatCard icon="⚡" label="Avg Response" value={`${Math.round(summary?.avgResponseTime ?? 0)}ms`} color="amber"
          sub={`Max: ${summary?.maxResponseTime ?? 0}ms`} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line chart */}
        <div className="card lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Response Time Trend</h2>
          {trends.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data yet — run some API tests</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => v.split('T')[1] || v} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit="ms" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="avg" name="Avg (ms)" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="max" name="Max (ms)" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Success vs Failure</h2>
          {(!summary || summary.total === 0) ? (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, '']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bar chart */}
      {endpoints.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Avg Response Time per Endpoint</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={endpoints} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} unit="ms" />
              <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={200} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" name="Avg ms" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
