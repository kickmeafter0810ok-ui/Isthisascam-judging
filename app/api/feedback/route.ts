import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { scanId, correctVerdict, originalVerdict, originalText, deviceId } = await req.json();

    console.log('Feedback received:', { scanId, correctVerdict, originalVerdict });

    const { error: feedbackError } = await supabase.from('feedback').insert({
      scan_id: scanId || null,
      correct_verdict: correctVerdict,
      original_verdict: originalVerdict,
      original_text: originalText,
      device_id: deviceId,
    });

    if (feedbackError) {
      console.error('Feedback insert error:', JSON.stringify(feedbackError));
      return NextResponse.json({ error: feedbackError.message }, { status: 500 });
    }

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

    // Auto-flag contradicted verdicts for admin review
    // Only flag when user disagrees with verdict (correctVerdict !== originalVerdict)
    const isContradiction = correctVerdict !== originalVerdict;
    const isFalseNegative = originalVerdict === 'safe' && correctVerdict === 'scam';
    const isFalsePositive = originalVerdict === 'scam' && correctVerdict === 'safe';

    if (isContradiction) {
      const priority = isFalseNegative ? 'high' : isFalsePositive ? 'medium' : 'low';
      await supabase.from('feedback')
        .update({ 
          status: 'pending',
          priority: priority,
          auto_flagged: true 
        })
        .eq('scan_id', scanId)
        .eq('correct_verdict', correctVerdict);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Feedback route error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}