import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const REVIEW_PROMPT = `You are reviewing user feedback for a scam detection app.
A user says the AI gave the WRONG verdict for a message.
Your job is to decide if the user's correction is valid.

Return JSON only: { "approve": true/false, "reason": "one sentence explaining your recommendation" }

approve: true = user is RIGHT, the AI was wrong, we should update our examples
approve: false = user is WRONG, the original AI verdict was correct, reject this feedback

Be concise. Focus on whether the correction makes sense, not on analyzing the scam.`;

export async function POST(req: NextRequest) {
  if (req.cookies.get('admin_auth')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { feedbackId, action, originalText, correctVerdict } = await req.json();

  if (action === 'ai_review') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: REVIEW_PROMPT },
          { role: 'user', content: `Message: "${originalText}"\nUser says correct verdict: ${correctVerdict}` },
        ],
        max_tokens: 100,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const review = JSON.parse(data.choices[0].message.content);

    if (review.approve) {
      await supabase.from('examples').upsert({
        text: originalText,
        correct_verdict: correctVerdict,
        explanation: `AI verified: ${review.reason}`,
        confirmed: true,
      }, { onConflict: 'text' });
      await supabase.from('feedback').update({ status: 'approved' }).eq('id', feedbackId);
    } else {
      await supabase.from('feedback').update({ status: 'rejected' }).eq('id', feedbackId);
    }
    return NextResponse.json(review);
  }

  if (action === 'approve') {
    await supabase.from('examples').upsert({
      text: originalText,
      correct_verdict: correctVerdict,
      explanation: `Manually approved by admin`,
      confirmed: true,
    }, { onConflict: 'text' });
    await supabase.from('feedback').update({ status: 'approved' }).eq('id', feedbackId);
    return NextResponse.json({ success: true });
  }

  if (action === 'reject') {
    await supabase.from('feedback').update({ status: 'rejected' }).eq('id', feedbackId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}