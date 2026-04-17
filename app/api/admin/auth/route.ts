import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password === process.env.ADMIN_PASSWORD) {
    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_auth', process.env.ADMIN_PASSWORD!, { 
      httpOnly: true, 
      secure: true,
      maxAge: 60 * 60 * 24 // 24 hours
    });
    return res;
  }
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}