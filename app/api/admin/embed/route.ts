import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { adminTokenHash } from '../_auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });
  const data = await res.json();
  return data.data[0].embedding;
}

export async function POST(req: NextRequest) {
  if (req.cookies.get('admin_auth')?.value !== adminTokenHash()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await req.json();

    // Fetch the scam_intel item
    const { data: item, error: fetchError } = await supabase
      .from('scam_intel')
      .select('id, headline, summary_en, tactic_tags')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Generate embedding from headline + summary
    const textToEmbed = `${item.headline}. ${item.summary_en}. Tactics: ${item.tactic_tags?.join(', ')}`;
    const embedding = await generateEmbedding(textToEmbed);

    // Store embedding
    const { error: updateError } = await supabase
      .from('scam_intel')
      .update({ embedding })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Batch embed all approved items missing embeddings
export async function GET(req: NextRequest) {
  if (req.cookies.get('admin_auth')?.value !== adminTokenHash()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { data: items, error } = await supabase
      .from('scam_intel')
      .select('id, headline, summary_en, tactic_tags')
      .eq('admin_action', 'approved')
      .is('embedding', null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!items?.length) return NextResponse.json({ message: 'No items to embed', count: 0 });

    let embedded = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const textToEmbed = `${item.headline}. ${item.summary_en}. Tactics: ${item.tactic_tags?.join(', ')}`;
        const res = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: textToEmbed,
          }),
        });
        const data = await res.json();
        const embedding = data.data[0].embedding;

        await supabase
          .from('scam_intel')
          .update({ embedding })
          .eq('id', item.id);

        embedded++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({ success: true, embedded, failed });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}