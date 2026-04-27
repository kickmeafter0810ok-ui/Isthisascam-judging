import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  // Check failed attempts in last 15 minutes
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('admin_attempts')
    .select('*', { count: 'exact' })
    .eq('ip', ip)
    .gte('created_at', fifteenMinsAgo);

  if (count && count >= 5) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429 }
    );
  }

  const { password } = await req.json();

  if (password === process.env.ADMIN_PASSWORD) {
    // Clear failed attempts on success
    await supabase.from('admin_attempts').delete().eq('ip', ip);
    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_auth', process.env.ADMIN_PASSWORD!, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24
    });
    return res;
  }

  // Record failed attempt
  await supabase.from('admin_attempts').insert({ ip });
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}