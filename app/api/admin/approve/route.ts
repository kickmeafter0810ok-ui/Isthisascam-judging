import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

function authCheck(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalScans },
    { count: todayScans },
    { count: monthScans },
    { data: verdicts },
    { data: countries },
    { data: languages },
    { data: tactics },
    { data: recentScans },
    { data: pendingFeedback },
    { count: totalFeedback },
  ] = await Promise.all([
    supabase.from('scans').select('*', { count: 'exact', head: true }),
    supabase.from('scans').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabase.from('scans').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('scans').select('verdict').gte('created_at', monthStart),
    supabase.from('scans').select('country').not('country', 'eq', 'Unknown'),
    supabase.from('scans').select('language'),
    supabase.from('scans').select('tactics').not('tactics', 'eq', '{}'),
    supabase.from('scans').select('verdict, confidence, language, country, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('feedback').select('*, scans(verdict)').order('created_at', { ascending: false }).limit(20),
    supabase.from('feedback').select('*', { count: 'exact', head: true }),
  ]);

  // Count verdicts
  const verdictCount = { scam: 0, suspicious: 0, safe: 0 };
  verdicts?.forEach(s => { if (s.verdict in verdictCount) verdictCount[s.verdict as keyof typeof verdictCount]++; });

  // Count countries
  const countryCount: Record<string, number> = {};
  countries?.forEach(s => { countryCount[s.country] = (countryCount[s.country] || 0) + 1; });
  const topCountries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Count languages
  const langCount: Record<string, number> = {};
  languages?.forEach(s => { langCount[s.language] = (langCount[s.language] || 0) + 1; });

  // Count tactics
  const tacticCount: Record<string, number> = {};
  tactics?.forEach(s => { s.tactics?.forEach((t: string) => { tacticCount[t] = (tacticCount[t] || 0) + 1; }); });
  const topTactics = Object.entries(tacticCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return NextResponse.json({
    totalScans, todayScans, monthScans, totalFeedback,
    verdictCount, topCountries, langCount, topTactics,
    recentScans, pendingFeedback,
  });
}