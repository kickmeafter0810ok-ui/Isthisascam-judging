import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { scanId, correctVerdict, originalVerdict, originalText, deviceId } = await req.json();

    await supabase.from('feedback').insert({
      scan_id: scanId,
      correct_verdict: correctVerdict,
      original_verdict: originalVerdict,
      original_text: originalText,
      device_id: deviceId,
    });

    // If enough feedback on same text, auto-add to examples
    const { count } = await supabase
      .from('feedback')
      .select('*', { count: 'exact' })
      .eq('original_text', originalText)
      .eq('correct_verdict', correctVerdict);

    if (count && count >= 3) {
      await supabase.from('examples').upsert({
        text: originalText,
        correct_verdict: correctVerdict,
        explanation: `Community reported: ${count} users marked this as ${correctVerdict}`,
        confirmed: true,
      }, { onConflict: 'text' });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}