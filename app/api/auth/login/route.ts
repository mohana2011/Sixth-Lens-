import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { ADMIN_COOKIE, createAdminSessionToken } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { ok } = rateLimit(`login:${clientIp(req)}`, 10, 5 * 60_000);
  if (!ok) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const { email, password } = await req.json().catch(() => ({}));
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const { rows } = await query<{ id: string; password_hash: string }>(
    'select id, password_hash from photographers where email = $1',
    [email.toLowerCase().trim()]
  );
  const photographer = rows[0];
  const valid = photographer ? await bcrypt.compare(password, photographer.password_hash) : false;

  if (!photographer || !valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const token = await createAdminSessionToken(photographer.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
