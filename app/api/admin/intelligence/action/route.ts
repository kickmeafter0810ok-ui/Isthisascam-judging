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

  await supabase
    .from('scam_intel')
    .update({
      admin_action: action === 'approve' ? 'approved' : 'dismissed',
      added_to_learn: action === 'approve',
    })
    .eq('id', id);

  return NextResponse.json({ success: true });
}