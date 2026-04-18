import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const country = req.headers.get('x-vercel-ip-country') || 'Unknown';

    const { error } = await supabase.from('app_feedback').insert({
      rating: body.rating,
      what_you_like: body.whatYouLike,
      needs_improvement: body.needsImprovement,
      feature_suggestions: body.featureSuggestions,
      would_recommend: body.wouldRecommend,
      anything_else: body.anythingElse,
      name: body.name || null,
      contact: body.contact || null,
      language: body.language,
      country,
    });

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}