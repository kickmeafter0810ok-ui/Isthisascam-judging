import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

function scrubPII(text: string): string {
  if (!text) return text;
  return text
    .replace(/\d{6}-\d{2}-\d{4}/g, '[IC_REDACTED]')
    .replace(/\b\d{10,16}\b/g, '[ACCOUNT_REDACTED]')
    .replace(/(\+?60|0)\d{8,9}/g, '[PHONE_REDACTED]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
}

export async function POST(req: NextRequest) {
  try {
    const { scanId, correctVerdict, originalVerdict, originalText, deviceId } = await req.json();

    console.log('Feedback received:', { scanId, correctVerdict, originalVerdict });

 const { error: feedbackError } = await supabase.from('feedback').insert({
  scan_id: scanId || null,
  correct_verdict: correctVerdict,
  original_verdict: originalVerdict,
  original_text: scrubPII(originalText),
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

// High priority: AI said not-scam, user says scam (dangerous miss)
const isHighPriority = 
  (originalVerdict === 'safe' || originalVerdict === 'suspicious') && 
  correctVerdict === 'scam';

// Medium priority: AI said scam, user says safe/suspicious (possible false alarm)
const isMediumPriority = 
  originalVerdict === 'scam' && 
  (correctVerdict === 'safe' || correctVerdict === 'suspicious');

// Low priority: safe ↔ suspicious disagreements (minor severity)


if (isContradiction) {
  const priority = isHighPriority ? 'high' : isMediumPriority ? 'medium' : 'low';
  await supabase.from('feedback')
    .update({ status: 'pending', priority, auto_flagged: true })
    .eq('scan_id', scanId)
    .eq('correct_verdict', correctVerdict);
}


    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Feedback route error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}