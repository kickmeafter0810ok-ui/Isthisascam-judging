'use client';

import { useEffect, useState, useCallback } from 'react';

interface Stats {
  totalScans: number;
  todayScans: number;
  monthScans: number;
  totalFeedback: number;
  verdictCount: { scam: number; suspicious: number; safe: number };
  topCountries: [string, number][];
  langCount: Record<string, number>;
  topTactics: [string, number][];
  recentScans: any[];
  pendingFeedback: any[];
}

export default function AdminDashboard() {
  const [authed, setAuthed]     = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [stats, setStats]       = useState<Stats | null>(null);
  const [loading, setLoading]   = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewResults, setReviewResults] = useState<Record<string, any>>({});

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/stats');
    if (res.ok) { setStats(await res.json()); }
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) fetchStats(); }, [authed, fetchStats]);

  const login = async () => {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) { setAuthed(true); setError(''); }
    else setError('Wrong password');
  };

  const handleApprove = async (f: any, action: 'approve' | 'reject' | 'ai_review') => {
    setReviewing(f.id);
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedbackId: f.id,
        action,
        originalText: f.original_text,
        correctVerdict: f.correct_verdict,
      }),
    });
    const data = await res.json();
    setReviewResults(prev => ({ ...prev, [f.id]: data }));
    setReviewing(null);
    if (action !== 'ai_review') fetchStats();
  };

  if (!authed) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-3xl mb-2">🛡️</p>
          <h1 className="text-xl font-bold text-gray-900">IsThisAScam Admin</h1>
        </div>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="Enter admin password"
          className="w-full p-3 border-2 border-gray-300 rounded-xl mb-3 text-gray-900" />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button onClick={login} className="w-full bg-red-500 text-white font-bold py-3 rounded-xl">
          Login
        </button>
      </div>
    </div>
  );

  if (loading || !stats) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  );

  const totalVerdicts = stats.verdictCount.scam + stats.verdictCount.suspicious + stats.verdictCount.safe || 1;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">🛡️ IsThisAScam Dashboard</h1>
            <p className="text-gray-400 text-sm">Real-time analytics & feedback review</p>
          </div>
          <button onClick={fetchStats} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">
            🔄 Refresh
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Scans', value: stats.totalScans, icon: '🔍' },
            { label: 'Today', value: stats.todayScans, icon: '📅' },
            { label: 'This Month', value: stats.monthScans, icon: '📆' },
            { label: 'Feedback', value: stats.totalFeedback, icon: '💬' },
          ].map(m => (
            <div key={m.label} className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl mb-1">{m.icon}</p>
              <p className="text-3xl font-bold">{m.value ?? 0}</p>
              <p className="text-gray-400 text-sm">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Verdict Breakdown */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="font-bold mb-4 text-lg">Verdict Breakdown (This Month)</h2>
            {[
              { label: 'Scam', count: stats.verdictCount.scam, color: 'bg-red-500' },
              { label: 'Suspicious', count: stats.verdictCount.suspicious, color: 'bg-yellow-500' },
              { label: 'Safe', count: stats.verdictCount.safe, color: 'bg-green-500' },
            ].map(v => (
              <div key={v.label} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>{v.label}</span>
                  <span>{v.count} ({Math.round(v.count / totalVerdicts * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className={`${v.color} h-2 rounded-full`} style={{ width: `${v.count / totalVerdicts * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Top Tactics */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="font-bold mb-4 text-lg">Top Scam Tactics</h2>
            <div className="space-y-2">
              {stats.topTactics.map(([tactic, count]) => (
                <div key={tactic} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{tactic.replace(/_/g, ' ')}</span>
                  <span className="bg-red-900 text-red-300 text-xs px-2 py-1 rounded-full">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Countries */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="font-bold mb-4 text-lg">Top Countries</h2>
            <div className="space-y-2">
              {stats.topCountries.map(([country, count]) => (
                <div key={country} className="flex justify-between items-center">
                  <span className="text-sm">{country}</span>
                  <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Language Breakdown */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="font-bold mb-4 text-lg">Language Usage</h2>
            <div className="space-y-2">
              {Object.entries(stats.langCount).sort((a, b) => b[1] - a[1]).map(([lang, count]) => (
                <div key={lang} className="flex justify-between items-center">
                  <span className="text-sm">{lang}</span>
                  <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded-full">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="font-bold mb-4 text-lg">Recent Scans</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Verdict</th>
                  <th className="text-left py-2">Confidence</th>
                  <th className="text-left py-2">Language</th>
                  <th className="text-left py-2">Country</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentScans?.map((scan: any) => (
                  <tr key={scan.id} className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">{new Date(scan.created_at).toLocaleTimeString()}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        scan.verdict === 'scam' ? 'bg-red-900 text-red-300' :
                        scan.verdict === 'suspicious' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-green-900 text-green-300'}`}>
                        {scan.verdict}
                      </span>
                    </td>
                    <td className="py-2">{scan.confidence}%</td>
                    <td className="py-2">{scan.language}</td>
                    <td className="py-2">{scan.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feedback Review */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="font-bold mb-2 text-lg">Feedback Review</h2>
          <p className="text-gray-400 text-sm mb-4">Review user corrections — approve to improve detection, use AI to auto-verify</p>
          <div className="space-y-4">
            {stats.pendingFeedback?.length === 0 && (
              <p className="text-gray-400 text-sm">No feedback yet</p>
            )}
            {[...( stats.pendingFeedback || [])].sort((a, b) => {
  const order = { pending: 0, approved: 1, rejected: 2 };
  return (order[a.status as keyof typeof order] ?? 0) - (order[b.status as keyof typeof order] ?? 0);
}).map((f: any) => (
              <div key={f.id} className={`rounded-xl p-4 ${f.status === 'approved' ? 'bg-green-900 opacity-60' : f.status === 'rejected' ? 'bg-red-900 opacity-60' : 'bg-gray-700'}`}>
                <div className="flex gap-2 mb-2 items-center">
  {f.status !== 'pending' && (
    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${f.status === 'approved' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
      {f.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
    </span>
  )}
  
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    f.original_verdict === 'scam' ? 'bg-red-900 text-red-300' :
                    f.original_verdict === 'suspicious' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-green-900 text-green-300'}`}>
                    Was: {f.original_verdict}
                  </span>
                  <span>→</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    f.correct_verdict === 'scam' ? 'bg-red-900 text-red-300' :
                    f.correct_verdict === 'suspicious' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-green-900 text-green-300'}`}>
                    Should be: {f.correct_verdict}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-3 bg-gray-900 p-2 rounded-lg">{f.original_text}</p>

                {reviewResults[f.id] && (
                  <div className={`text-xs p-2 rounded-lg mb-3 ${reviewResults[f.id].approve ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    AI: {reviewResults[f.id].approve ? '✅ Approve' : '❌ Reject'} — {reviewResults[f.id].reason}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => handleApprove(f, 'ai_review')} disabled={reviewing === f.id}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg disabled:opacity-50">
                    {reviewing === f.id ? '⏳' : '🤖 AI Review'}
                  </button>
                  <button onClick={() => handleApprove(f, 'approve')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg">
                    ✅ Approve
                  </button>
                  <button onClick={() => handleApprove(f, 'reject')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg">
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}