import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  const { data } = await supabase
    .from('scam_intel')
    .select('headline, headline_ms, headline_zh, headline_ta, summary_en, summary_ms, summary_zh, summary_ta, source, source_url, tactic_tags, platform, target_demographic, status, occurrence_count, share_text_en, share_text_ms, share_text_zh, share_text_ta')
    .eq('admin_action', 'approved')
    .eq('added_to_learn', true)
    .order('occurrence_count', { ascending: false })
    .limit(20);

  return NextResponse.json(data || []);
}