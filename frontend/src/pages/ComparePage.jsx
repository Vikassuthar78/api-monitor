import { useState } from 'react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

function DeltaBadge({ a, b }) {
  if (a == null || b == null) return <span className="text-gray-600">—</span>;
  const diff = a - b;
  if (Math.abs(diff) < 5) return <span className="badge-neutral">≈ same</span>;
  return diff > 0
    ? <span className="badge-danger">+{diff}ms slower</span>
    : <span className="badge-success">{Math.abs(diff)}ms faster</span>;
}

export default function ComparePage() {
  const [labelsInput, setLabelsInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    const labels = labelsInput.trim();
    if (!labels) return toast.error('Enter labels to compare');
    setLoading(true);
    try {
      const res = await api.get('/compare', { params: { labels } });
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Comparison failed');
    } finally { setLoading(false); }
  };

  const labelArr = result?.labels || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Compare Runs</h1>
        <p className="text-gray-500 text-sm">Side-by-side performance comparison across test runs</p>
      </div>

      <div className="card flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">Run Labels <span className="text-gray-600">(comma-separated)</span></label>
          <input
            value={labelsInput}
            onChange={(e) => setLabelsInput(e.target.value)}
            placeholder="v1-run, v2-run, staging"
            className="input"
          />
        </div>
        <button onClick={compare} disabled={loading} className="btn-primary px-6 py-2.5 shrink-0">
          {loading ? '…' : 'Compare'}
        </button>
      </div>

      {result && (
        <div className="space-y-3 animate-slide-up">
          {Object.entries(result.comparison).length === 0 ? (
            <div className="card text-center text-gray-600 py-10">No data found for these labels. Run tests with a run label first.</div>
          ) : Object.entries(result.comparison).map(([endpoint, runs]) => (
            <div key={endpoint} className="card space-y-3">
              <div className="font-mono text-sm text-brand-400 font-semibold">{endpoint}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-dark-600">
                      <th className="text-left py-2 pr-4 font-medium">Metric</th>
                      {labelArr.map((l) => <th key={l} className="text-left py-2 px-4 font-medium">{l}</th>)}
                      {labelArr.length === 2 && <th className="text-left py-2 px-4 font-medium">Delta</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'avgResponseTime', label: 'Avg Response (ms)', fmt: (v) => `${v}ms` },
                      { key: 'maxResponseTime', label: 'Max Response (ms)', fmt: (v) => `${v}ms` },
                      { key: 'minResponseTime', label: 'Min Response (ms)', fmt: (v) => `${v}ms` },
                      { key: 'count', label: 'Requests', fmt: (v) => v },
                      { key: 'successRate', label: 'Success Rate', fmt: (v) => `${v}%` },
                      { key: 'failed', label: 'Failed', fmt: (v) => v },
                    ].map(({ key, label, fmt }) => (
                      <tr key={key} className="border-b border-dark-700">
                        <td className="py-2 pr-4 text-gray-500">{label}</td>
                        {labelArr.map((l) => (
                          <td key={l} className={`py-2 px-4 font-mono ${runs[l] == null ? 'text-gray-700' : 'text-gray-200'}`}>
                            {runs[l] != null ? fmt(runs[l][key]) : '—'}
                          </td>
                        ))}
                        {labelArr.length === 2 && key === 'avgResponseTime' && (
                          <td className="py-2 px-4">
                            <DeltaBadge a={runs[labelArr[0]]?.avgResponseTime} b={runs[labelArr[1]]?.avgResponseTime} />
                          </td>
                        )}
                        {labelArr.length === 2 && key !== 'avgResponseTime' && <td />}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
