'use client';

import { useEffect, useState, useCallback } from 'react';

// Map stored language codes to readable names for the admin panel.
const LANG_LABELS: Record<string, string> = {
  'en': 'English',
  'ms': 'Malay',
  'zh-s': 'Chinese (Simplified)',
  'zh-t': 'Chinese (Traditional)',
  'zh': 'Chinese',
  'ta': 'Tamil',
};
const langLabel = (code: string) => LANG_LABELS[code] || code || 'Unknown';

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
  appFeedback: any[];
}

function IntelCard({ item, onAction }: { item: any; onAction: (id: string, action: 'approve' | 'dismiss' | 'undo') => void }) {
  return (
    <div className="bg-gray-700 rounded-xl p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 flex-wrap">
          {item.status === 'emerging' && (
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">🚨 Emerging</span>
          )}
          {item.tactic_tags?.map((tag: string) => (
            <span key={tag} className="text-xs bg-gray-600 text-gray-200 px-2 py-0.5 rounded-full">
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-400 shrink-0 ml-2">{item.source}</span>
      </div>
      <p className="text-sm font-semibold text-white mb-1">{item.headline}</p>
      <p className="text-xs text-gray-300 mb-2">{item.summary_en}</p>
      <div className="text-xs text-gray-400 mb-3 flex gap-3">
        {item.platform && <span>📱 {item.platform}</span>}
        {item.target_demographic && <span>👥 {item.target_demographic}</span>}
        <span>🔁 {item.occurrence_count}x reported</span>
      </div>
      <div className="flex gap-2">
        {item.admin_action === 'pending' && <>
          <button onClick={() => onAction(item.id, 'approve')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg">
            ✅ Approve & Publish
          </button>
          <button onClick={() => onAction(item.id, 'dismiss')}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold py-2 rounded-lg">
            ✕ Dismiss
          </button>
        </>}
        {item.admin_action !== 'pending' && (
          <button onClick={() => onAction(item.id, 'undo')}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold py-2 rounded-lg">
            ↩ Undo — move back to pending
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [authed, setAuthed]       = useState(false);
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewResults, setReviewResults] = useState<Record<string, any>>({});
  const [brief, setBrief]         = useState<string>('');
  const [briefLoading, setBriefLoading] = useState(false);
  const [todos, setTodos]         = useState<string[]>([]);
  const [doneTodos, setDoneTodos] = useState<string[]>([]);
  const [intelItems, setIntelItems] = useState<any[]>([]);
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelResults, setIntelResults] = useState<any>(null);


  const fetchStats = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/stats');
    if (res.ok) setStats(await res.json());
    setLoading(false);
  }, []);

  const fetchIntel = useCallback(async () => {
    const res = await fetch('/api/admin/intelligence/items');
    if (res.ok) setIntelItems(await res.json());
  }, []);

  const runIntelligenceScan = async () => {
    setIntelLoading(true);
    const res = await fetch('/api/admin/intelligence', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setIntelResults(data.results);
      await fetchIntel();
    }
    setIntelLoading(false);
  };

 
  
  const fetchBrief = useCallback(async () => {
    setBriefLoading(true);
    const res = await fetch('/api/admin/brief');
    if (res.ok) {
      const data = await res.json();
      setBrief(data.summary || '');
      setTodos(data.todos || []);
    }
    setBriefLoading(false);
  }, []);

  useEffect(() => {
    if (authed) { fetchStats(); fetchBrief(); fetchIntel(); }
  }, [authed, fetchStats, fetchBrief, fetchIntel]);

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
      body: JSON.stringify({ feedbackId: f.id, action, originalText: f.original_text, correctVerdict: f.correct_verdict }),
    });
    const data = await res.json();
    setReviewResults(prev => ({ ...prev, [f.id]: data }));
    setReviewing(null);
    if (action !== 'ai_review') fetchStats();
  };

  const markAppFeedbackRead = async (id: string) => {
    await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appFeedbackId: id, action: 'mark_read' }),
    });
    fetchStats();
  };



  const handleIntelAction = async (id: string, action: 'approve' | 'dismiss' | 'undo') => {
    await fetch('/api/admin/intelligence/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    await fetchIntel();
  };

  const tickTodo = (todo: string) => {
    setDoneTodos(prev => [...prev, todo]);
    setTodos(prev => prev.filter(t => t !== todo));
  };

  if (!authed) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-3xl mb-2">🔐</p>
          <h1 className="text-xl font-bold text-gray-900">IsThisAScam Admin</h1>
        </div>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="Enter admin password"
          className="w-full p-3 border-2 border-gray-300 rounded-xl mb-3 text-gray-900" />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button onClick={login} className="w-full bg-red-500 text-white font-bold py-3 rounded-xl">Login</button>
      </div>
    </div>
  );

  // Only show the full-screen loader on the very first load (stats still null).
  // On background refreshes (after approve, or the Refresh button) stats is
  // already populated, so we keep the page mounted — otherwise unmounting resets
  // the scroll position to the top.
  if (!stats) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  );

  const totalVerdicts = stats.verdictCount.scam + stats.verdictCount.suspicious + stats.verdictCount.safe || 1;
  const unreadAppFeedback = stats.appFeedback?.filter(f => !f.is_read) || [];
  const readAppFeedback = stats.appFeedback?.filter(f => f.is_read) || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">🔐 IsThisAScam Dashboard</h1>
            <p className="text-gray-400 text-sm">Real-time analytics & feedback review</p>
          </div>
          <button onClick={() => { fetchStats(); fetchBrief(); }} disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-4 py-2 rounded-lg text-sm">
            {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* AI Summary & To-Dos */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">🤖 AI Briefing & To-Dos</h2>
            <button onClick={fetchBrief} disabled={briefLoading}
              className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg disabled:opacity-50">
              {briefLoading ? '⏳ Generating...' : '✨ Refresh Brief'}
            </button>
          </div>

          {brief ? (
           <div className="bg-gray-700 rounded-xl p-4 mb-4 text-sm text-gray-100 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
           {brief}
            </div>
          ) : (
            <div className="bg-gray-700 rounded-xl p-4 mb-4 text-sm text-gray-400">
              {briefLoading ? '⏳ Generating AI summary...' : 'Click "Refresh Brief" to generate an AI summary of your app\'s status.'}
            </div>
          )}

          {/* To-Do Items */}
          {todos.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase">Action Items</p>
              {todos.map((todo, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-700 rounded-lg p-3">
                  <button onClick={() => tickTodo(todo)}
                    className="w-5 h-5 rounded border-2 border-gray-400 hover:border-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-100">{todo}</span>
                </div>
              ))}
            </div>
          )}

          {/* Done items */}
          {doneTodos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Completed</p>
              {doneTodos.map((todo, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-800 rounded-lg p-3 opacity-50">
                  <div className="w-5 h-5 rounded border-2 border-green-400 bg-green-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-sm text-gray-400 line-through">{todo}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Scans', value: stats.totalScans, icon: '🔍' },
            { label: 'Today', value: stats.todayScans, icon: '📅' },
            { label: 'This Month', value: stats.monthScans, icon: '📆' },
            { label: 'Feedback', value: stats.totalFeedback, icon: '💼' },
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
            <h2 className="font-bold mb-4 text-lg">Verdict Breakdown</h2>
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
                  <span className="text-sm">{langLabel(lang)}</span>
                  <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded-full">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* App Feedback from Users */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="font-bold mb-2 text-lg">💼 User Feedback
            {unreadAppFeedback.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadAppFeedback.length} new</span>
            )}
          </h2>
          <p className="text-gray-400 text-sm mb-4">Feedback submitted via the in-app feedback form</p>

          {/* Unread first */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-1">
            {unreadAppFeedback.length === 0 && readAppFeedback.length === 0 && (
              <p className="text-gray-400 text-sm">No user feedback yet</p>
            )}
            {unreadAppFeedback.map(f => (
              <div key={f.id} className="bg-yellow-950 rounded-xl p-4 border-2 border-yellow-400">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-yellow-400 text-xs font-bold">NEW</span>
                    <span className="text-yellow-400">{'⭐'.repeat(f.rating || 0)}</span>
                    <span className="text-gray-400 text-xs">{f.language} · {f.country}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{new Date(f.created_at).toLocaleDateString()}</span>
                </div>
                {f.what_you_like && <p className="text-sm text-gray-100 mb-1"><span className="text-green-400 font-semibold">Likes: </span>{f.what_you_like}</p>}
                {f.needs_improvement && <p className="text-sm text-gray-100 mb-1"><span className="text-red-400 font-semibold">Improve: </span>{f.needs_improvement}</p>}
                {f.feature_suggestions && <p className="text-sm text-gray-100 mb-1"><span className="text-blue-400 font-semibold">Features: </span>{f.feature_suggestions}</p>}
                {f.anything_else && <p className="text-sm text-gray-100 mb-1"><span className="text-gray-400 font-semibold">Other: </span>{f.anything_else}</p>}
                {f.would_recommend !== null && <p className="text-xs text-gray-400 mb-2">Would recommend: {f.would_recommend ? '✅ Yes' : '❌ No'}</p>}
                {f.name && <p className="text-xs text-gray-400">From: {f.name} {f.contact && `(${f.contact})`}</p>}
                <button onClick={() => markAppFeedbackRead(f.id)}
                  className="mt-3 w-full bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold py-2 rounded-lg">
                  ✓ Mark as Read
                </button>
              </div>
            ))}
          </div>

          {/* Read feedback collapsed */}
          {readAppFeedback.length > 0 && (
            <details className="mt-4">
              <summary className="text-gray-400 text-sm cursor-pointer">
                {readAppFeedback.length} read feedback items
              </summary>
              <div className="space-y-3 mt-3">
                {readAppFeedback.map(f => (
                  <div key={f.id} className="bg-gray-900 rounded-xl p-4 opacity-40 border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-yellow-400">{'⭐'.repeat(f.rating || 0)}</span>
                      <span className="text-gray-400 text-xs">{new Date(f.created_at).toLocaleDateString()}</span>
                    </div>
                    {f.what_you_like && <p className="text-xs text-gray-300 mb-1"><span className="text-green-400">Likes: </span>{f.what_you_like}</p>}
                    {f.needs_improvement && <p className="text-xs text-gray-300 mb-1"><span className="text-red-400">Improve: </span>{f.needs_improvement}</p>}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Recent Scans */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="font-bold mb-4 text-lg">Recent Scans</h2>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2">Date &amp; Time</th>
                  <th className="text-left py-2">Verdict</th>
                  <th className="text-left py-2">Confidence</th>
                  <th className="text-left py-2">Language</th>
                  <th className="text-left py-2">Country</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentScans?.map((scan: any) => (
                  <tr key={scan.id} className="border-b border-gray-700">
                    <td className="py-2 text-gray-400 whitespace-nowrap">{new Date(scan.created_at).toLocaleString()}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        scan.verdict === 'scam' ? 'bg-red-900 text-red-300' :
                        scan.verdict === 'suspicious' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-green-900 text-green-300'}`}>
                        {scan.verdict}
                      </span>
                    </td>
                    <td className="py-2">{scan.confidence}%</td>
                    <td className="py-2">{langLabel(scan.language)}</td>
                    <td className="py-2">{scan.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

{/* Scam Intelligence Feed */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold text-lg">🔍 Scam Intelligence Feed</h2>
              <p className="text-gray-400 text-sm">AI-curated scam patterns from Malaysian news sources</p>
            </div>
            <button onClick={runIntelligenceScan} disabled={intelLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-bold">
              {intelLoading ? '⏳ Scanning...' : '🔍 Run Scan'}
            </button>
          </div>

          {intelResults && (
  <div className="bg-gray-700 rounded-lg p-3 mb-4 text-xs text-gray-300">
    <p className="mb-2">
      Last scan: fetched {intelResults.fetched} articles → {intelResults.scamRelated} scam-related → {intelResults.newItems} new patterns → {intelResults.duplicates} duplicates skipped
    </p>
    {intelResults.sourceHealth && (
      <details>
        <summary className="cursor-pointer text-gray-400 mb-2">Feed health ({intelResults.sourceHealth.filter((s: any) => s.status === 'ok').length}/{intelResults.sourceHealth.length} working)</summary>
        <div className="grid grid-cols-2 gap-1 mt-2">
          {intelResults.sourceHealth.map((s: any) => (
            <div key={s.name} className="flex items-center gap-1">
              <span>{s.status === 'ok' ? '✅' : s.status === 'empty' ? '⚠️' : '❌'}</span>
              <span className={s.status === 'ok' ? 'text-green-400' : s.status === 'empty' ? 'text-yellow-400' : 'text-red-400'}>
                {s.name}: {s.fetched} articles
              </span>
            </div>
          ))}
        </div>
      </details>
    )}
  </div>
)}

    {/* Emerging alerts */}
{intelItems.filter(i => i.status === 'emerging').length > 0 && (
  <div className="mb-4">
    <p className="text-xs font-bold text-red-400 uppercase mb-2">🚨 Emerging</p>
    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
      {intelItems.filter(i => i.status === 'emerging' && i.admin_action === 'pending').map(item => (
        <IntelCard key={item.id} item={item} onAction={handleIntelAction} />
      ))}
    </div>
  </div>
)}

          {/* New items */}
          <div className="mb-4">
            <p className="text-xs font-bold text-yellow-400 uppercase mb-2">⚠️ Pending Review</p>
            <div className="space-y-3">
              {intelItems.filter(i => i.status === 'new' && i.admin_action === 'pending').length === 0 && (
                <p className="text-gray-400 text-sm">No pending items — run a scan to fetch latest alerts</p>
              )}
              {intelItems.filter(i => i.status === 'new' && i.admin_action === 'pending').map(item => (
                <IntelCard key={item.id} item={item} onAction={handleIntelAction} />
              ))}
            </div>
          </div>

          {/* Approved items */}
         {intelItems.filter(i => i.admin_action === 'approved').length > 0 && (
  <details className="mt-4">
    <summary className="text-green-400 text-sm cursor-pointer mb-2 font-semibold">
      ✅ {intelItems.filter(i => i.admin_action === 'approved').length} approved items — click to expand
    </summary>
    <div className="space-y-3 mt-2 max-h-96 overflow-y-auto">
      {intelItems.filter(i => i.admin_action === 'approved').map(item => (
        <IntelCard key={item.id} item={item} onAction={handleIntelAction} />
      ))}
    </div>
  </details>
)}

          {/* Dismissed items */}
          {intelItems.filter(i => i.admin_action === 'dismissed').length > 0 && (
  <details className="mt-2">
    <summary className="text-gray-500 text-sm cursor-pointer mb-2">
      ❌ {intelItems.filter(i => i.admin_action === 'dismissed').length} dismissed items — click to expand
    </summary>
              <div className="space-y-3 mt-2">
                {intelItems.filter(i => i.admin_action === 'dismissed').map(item => (
                  <IntelCard key={item.id} item={item} onAction={handleIntelAction} />
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Feedback Review */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="font-bold mb-2 text-lg">🔄 Detection Feedback Review</h2>
          <p className="text-gray-400 text-sm mb-4">User corrections to scam verdicts — approve to improve AI detection</p>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {stats.pendingFeedback?.length === 0 && (
              <p className="text-gray-400 text-sm">No feedback yet</p>
            )}
         {[...(stats.pendingFeedback || [])].sort((a, b) => {
  const statusOrder = { pending: 0, approved: 1, rejected: 2 };
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] ?? 0) - 
                     (statusOrder[b.status as keyof typeof statusOrder] ?? 0);
  if (statusDiff !== 0) return statusDiff;
  return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) - 
         (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2);
                }).map((f: any) => (
                <div key={f.id} className={`rounded-xl p-4 transition-all ${
                  f.status === 'approved' ? 'bg-green-900 opacity-40 border border-green-700' : 
                  f.status === 'rejected' ? 'bg-gray-900 opacity-40 border border-gray-700' : 
                  'bg-gray-700 border border-gray-600'}`}>
                <div className="flex gap-2 mb-2 items-center flex-wrap">
                    {f.auto_flagged && f.status === 'pending' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                     f.priority === 'high' ? 'bg-red-500 text-white' :
                      f.priority === 'medium' ? 'bg-orange-500 text-white' :
                      'bg-gray-500 text-white'}`}>
                       {f.priority === 'high' ? '🚨 High Priority' : 
                        f.priority === 'medium' ? '⚠️ Medium Priority' : 
                     '📋 Auto-flagged'}
                    </span>
                     )}
               {f.status !== 'pending' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${f.status === 'approved' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {f.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${f.original_verdict === 'scam' ? 'bg-red-900 text-red-300' : f.original_verdict === 'suspicious' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}`}>
                    Was: {f.original_verdict}
                  </span>
                  <span>→</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${f.correct_verdict === 'scam' ? 'bg-red-900 text-red-300' : f.correct_verdict === 'suspicious' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}`}>
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