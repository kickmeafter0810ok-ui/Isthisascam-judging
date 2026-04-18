import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const REVIEW_PROMPT = `You are a quality control agent for a Malaysian scam detection app.

A user flagged an AI verdict as wrong. You must evaluate:
1. Is the user's correction logical? (Does the suggested verdict make sense for this message?)
2. Is this message relevant to scam detection? (Some messages may be unrelated - LinkedIn posts, random text, etc.)

Return JSON only:
{
  "approve": true/false,
  "reason": "2-3 sentences explaining: (1) whether the correction is logical, (2) whether this message is relevant to scam detection, (3) your recommendation to approve or reject"
}

approve: true = correction is valid AND message is relevant → add to training examples
approve: false = correction is wrong OR message is irrelevant → reject this feedback

Examples of irrelevant messages: LinkedIn posts, news articles, random English text, non-Malaysian content.
Examples of relevant messages: Bank SMS, WhatsApp scam messages, prize notifications, job offers, investment pitches.`;

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
    const { error: exampleError } = await supabase.from('examples').upsert({
      text: originalText,
      correct_verdict: correctVerdict,
      explanation: `Manually approved by admin`,
      confirmed: true,
    }, { onConflict: 'text' });
    if (exampleError) console.error('Example upsert error:', JSON.stringify(exampleError));
    const { error: feedbackError } = await supabase.from('feedback').update({ status: 'approved' }).eq('id', feedbackId);
    if (feedbackError) console.error('Feedback update error:', JSON.stringify(feedbackError));
    return NextResponse.json({ success: true, exampleError, feedbackError });
  }

 if (action === 'reject') {
    await supabase.from('feedback').update({ status: 'rejected' }).eq('id', feedbackId);
    return NextResponse.json({ success: true });
  }

  if (action === 'mark_read') {
    const { appFeedbackId } = await req.json().catch(() => ({ appFeedbackId: null }));
    const id = appFeedbackId || feedbackId;
    await supabase.from('app_feedback').update({ is_read: true }).eq('id', id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}