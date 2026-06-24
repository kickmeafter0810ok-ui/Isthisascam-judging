import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { adminTokenHash } from '../_auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: NextRequest) {
  if (req.cookies.get('admin_auth')?.value !== adminTokenHash()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // Gather data for briefing
  const [
    { count: totalScans },
    { count: todayScans },
    { count: monthScans },
    { data: verdicts },
    { data: recentFeedback },
    { data: appFeedback },
    { data: examples },
  ] = await Promise.all([
    supabase.from('scans').select('*', { count: 'exact', head: true }),
    supabase.from('scans').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabase.from('scans').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('scans').select('verdict').gte('created_at', monthStart),
    supabase.from('feedback').select('original_verdict, correct_verdict, original_text, status').order('created_at', { ascending: false }).limit(20),
    supabase.from('app_feedback').select('rating, what_you_like, needs_improvement, feature_suggestions, is_read').order('created_at', { ascending: false }).limit(20),
    supabase.from('examples').select('*', { count: 'exact', head: true }).eq('confirmed', true),
  ]);

  const verdictCount = { scam: 0, suspicious: 0, safe: 0 };
  verdicts?.forEach(s => { if (s.verdict in verdictCount) verdictCount[s.verdict as keyof typeof verdictCount]++; });
  const pendingReviews = recentFeedback?.filter(f => f.status === 'pending').length || 0;
  const unreadAppFeedback = appFeedback?.filter(f => !f.is_read).length || 0;
  const avgRating = appFeedback?.length
    ? (appFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / appFeedback.length).toFixed(1)
    : 'N/A';

  const dataContext = `
IsThisAScam Dashboard Summary:
- Total scans: ${totalScans}, Today: ${todayScans}, This month: ${monthScans}
- Verdict breakdown (this month): Scam: ${verdictCount.scam}, Suspicious: ${verdictCount.suspicious}, Safe: ${verdictCount.safe}
- Pending feedback reviews: ${pendingReviews}
- Unread user feedback: ${unreadAppFeedback}
- Total confirmed training examples: ${examples}
- Average app rating: ${avgRating}/5 (from ${appFeedback?.length || 0} responses)
- Recent user feedback highlights: ${appFeedback?.slice(0, 5).map(f => `[${f.rating}★] Likes: "${f.what_you_like || 'N/A'}" | Improve: "${f.needs_improvement || 'N/A'}"`).join(' | ')}
- Recent detection corrections: ${recentFeedback?.slice(0, 5).map(f => `"${f.original_text?.substring(0, 50)}" was ${f.original_verdict} → should be ${f.correct_verdict}`).join(' | ')}
`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a product analyst for IsThisAScam, a Malaysian scam detection app. 
Write a concise briefing for the founder. Be direct and actionable. 
Format: 2-3 sentences of summary, then list 3-5 specific action items as "todos" array.
Return JSON: { "summary": "...", "todos": ["action 1", "action 2", ...] }`,
        },
        { role: 'user', content: dataContext },
      ],
      max_tokens: 400,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await res.json();
  const result = JSON.parse(data.choices[0].message.content);
  return NextResponse.json(result);
}