import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { adminTokenHash } from '../../_auth';

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

  const { id, action } = await req.json();

  const actionMap: Record<string, { admin_action: string; added_to_learn: boolean }> = {
    approve:  { admin_action: 'approved',  added_to_learn: true  },
    dismiss:  { admin_action: 'dismissed', added_to_learn: false },
    undo:     { admin_action: 'pending',   added_to_learn: false },
  };

  const update = actionMap[action];
  if (!update) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  await supabase.from('scam_intel').update(update).eq('id', id);

  // Auto-embed when approved — closes the flywheel loop
   // Auto-embed when approved — closes the flywheel loop
  if (action === 'approve') {
    try {
      const { data: item } = await supabase
        .from('scam_intel')
        .select('id, headline, summary_en, tactic_tags')
        .eq('id', id)
        .single();

      if (item) {
        const textToEmbed = `${item.headline}. ${item.summary_en}. Tactics: ${item.tactic_tags?.join(', ')}`;
        const embedding = await generateEmbedding(textToEmbed);
        await supabase
          .from('scam_intel')
          .update({ embedding })
          .eq('id', id);
      }
    } catch (e) {
      console.error('Embedding failed:', e);
    }
  }

  return NextResponse.json({ success: true });
}