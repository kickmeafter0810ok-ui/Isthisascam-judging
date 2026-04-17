import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const BASE_PROMPT = `You are a scam detection expert for Malaysia and Singapore.
Analyze the given message or image and respond in the user's language.
Be especially careful with legitimate bank SMS notifications - they are usually safe.
Return JSON only:
{
  "verdict": "scam" | "suspicious" | "safe",
  "confidence": 0-100,
  "reason": "brief explanation in user's language",
  "tactics": ["list", "of", "tactics", "detected"],
  "extracted_text": "if image input, extract ALL text visible in the image. If text input, return null."
}
Tactics: urgency, impersonation, phishing_link, credential_harvesting, prize_scam, loan_scam, job_scam, romance_scam, investment_scam.
Legitimate bank SMS patterns (mark as SAFE):
- Contains specific card last 4 digits
- Contains exact merchant name and amount
- From known bank codes (HLB, MAY, CIMB, UOB, RHB)
- No links or asks for credentials`;

async function getExamples(): Promise<string> {
  try {
    const { data } = await supabase
      .from('examples')
      .select('text, correct_verdict, explanation')
      .eq('confirmed', true)
      .limit(10);
    if (!data?.length) return '';
    const examples = data.map(e =>
      `Message: "${e.text}"\nVerdict: ${e.correct_verdict}\nReason: ${e.explanation}`
    ).join('\n\n');
    return `\n\nLearned examples from user feedback:\n${examples}`;
  } catch { return ''; }
}

export async function POST(req: NextRequest) {
  try {
    const { text, imageBase64, language, deviceId } = await req.json();
    if (!text && !imageBase64) return NextResponse.json({ error: 'No input' }, { status: 400 });

    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: 'API key missing' }, { status: 500 });

    const examples = await getExamples();
    const systemPrompt = BASE_PROMPT + examples;

    const userContent: any[] = imageBase64
      ? [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' } },
          { type: 'text', text: `Analyze this screenshot for scams. Extract all visible text. Respond in: ${language}` },
        ]
      : [{ type: 'text', text: `Analyze for scams. Respond in: ${language}\n\nMessage: ${text}` }];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: imageBase64 ? 'gpt-4o' : 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: JSON.stringify(data.error) }, { status: 500 });

    const result = JSON.parse(data.choices[0].message.content);

    const country = req.headers.get('x-vercel-ip-country') || 'Unknown';
    const region = req.headers.get('x-vercel-ip-country-region') || 'Unknown';

    // Use extracted text for images, original text for text input
    const storedText = imageBase64
      ? (result.extracted_text || '[Screenshot - text extraction failed]')
      : text;

    const { data: scan, error: scanError } = await supabase.from('scans').insert({
      verdict: result.verdict,
      confidence: result.confidence,
      language,
      is_image: !!imageBase64,
      tactics: result.tactics || [],
      country,
      region,
      device_id: deviceId || null,
    }).select('id').single();

    if (scanError) console.error('Supabase insert error:', JSON.stringify(scanError));

    return NextResponse.json({ ...result, scanId: scan?.id, storedText });
  } catch (e: any) {
    console.error('Route error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}