import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export function adminTokenHash() {
  return createHash('sha256').update(process.env.ADMIN_PASSWORD!).digest('hex');
}

export function authCheck(req: NextRequest): NextResponse | null {
  if (req.cookies.get('admin_auth')?.value !== adminTokenHash()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
