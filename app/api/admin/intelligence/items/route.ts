import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  if (req.cookies.get('admin_auth')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  console.log('ENV CHECK:', {
    url: url ? url.slice(0, 30) : 'MISSING',
    key: key ? key.slice(0, 20) : 'MISSING',
  });

  const supabase = createClient(url!, key!);

  const { data, error, count } = await supabase
    .from('scam_intel')
    .select('*', { count: 'exact' })
    .limit(100);

  console.log('Result:', { count, dataLength: data?.length, error: error?.message });

  return NextResponse.json(data || []);
}