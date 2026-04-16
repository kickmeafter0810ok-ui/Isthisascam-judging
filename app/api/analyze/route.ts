import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a scam detection expert for Malaysia and Singapore. 
Analyze the given message or image and respond in the user's language.
Return JSON only:
{
  "verdict": "scam" | "suspicious" | "safe",
  "confidence": 0-100,
  "reason": "brief explanation in user's language",
  "tactics": ["list", "of", "tactics", "detected"]
}
Tactics to detect: urgency, impersonation, phishing_link, credential_harvesting, prize_scam, loan_scam, job_scam, romance_scam, investment_scam.
Be strict. Malaysian scams often mix English, Malay, Chinese, Tamil (Manglish/Rojak).`;

export async function POST(req: NextRequest) {
  try {
    const { text, imageBase64, language } = await req.json();
    if (!text && !imageBase64) return NextResponse.json({ error: 'No input' }, { status: 400 });

    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: 'API key missing' }, { status: 500 });

    const userContent: any[] = imageBase64
      ? [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' } },
          { type: 'text', text: `Analyze this screenshot for scams. Respond in: ${language}` },
        ]
      : [
          { type: 'text', text: `Analyze for scams. Respond in: ${language}\n\nMessage: ${text}` },
        ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: imageBase64 ? 'gpt-4o' : 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('OpenAI error:', JSON.stringify(data));
      return NextResponse.json({ error: JSON.stringify(data.error) }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(data.choices[0].message.content));
  } catch (e: any) {
    console.error('Route error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}