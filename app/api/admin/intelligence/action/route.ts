import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  if (req.cookies.get('admin_auth')?.value !== process.env.ADMIN_PASSWORD) {
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
  return NextResponse.json({ success: true });
}