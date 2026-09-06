import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { createGalleryAccessToken, galleryCookieName } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  // Tight limit: this is the one endpoint that's meant to be brute-forced against.
  const { ok } = rateLimit(`pin:${clientIp(req)}:${params.slug}`, 8, 5 * 60_000);
  if (!ok) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }

  const { pin } = await req.json().catch(() => ({}));
  if (typeof pin !== 'string' || !pin.trim()) {
    return NextResponse.json({ error: 'PIN is required.' }, { status: 400 });
  }

  const { rows } = await query('select pin_hash from galleries where slug = $1', [params.slug]);
  const gallery = rows[0];
  if (!gallery) return NextResponse.json({ error: 'Gallery not found.' }, { status: 404 });
  if (!gallery.pin_hash) return NextResponse.json({ ok: true }); // no PIN set

  const valid = await bcrypt.compare(pin.trim(), gallery.pin_hash);
  if (!valid) return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });

  const token = await createGalleryAccessToken(params.slug);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(galleryCookieName(params.slug), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
