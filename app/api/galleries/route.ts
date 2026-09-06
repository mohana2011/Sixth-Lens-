import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { getAdminId } from '@/lib/session';
import { generateSlug } from '@/lib/ids';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const photographerId = await getAdminId();
  if (!photographerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const pin = typeof body.pin === 'string' ? body.pin.trim() : '';
  const expiresAt = typeof body.expiresAt === 'string' && body.expiresAt ? body.expiresAt : null;

  if (!title) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }
  if (pin && !/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 4-8 digits.' }, { status: 400 });
  }

  let slug = generateSlug();
  // Practically unreachable collision guard, since slugs are 14 random chars.
  for (let i = 0; i < 5; i++) {
    const { rows } = await query('select 1 from galleries where slug = $1', [slug]);
    if (rows.length === 0) break;
    slug = generateSlug();
  }

  const pinHash = pin ? await bcrypt.hash(pin, 10) : null;

  const { rows } = await query<{ id: string; slug: string }>(
    `insert into galleries (slug, title, pin_hash, expires_at, photographer_id)
     values ($1, $2, $3, $4, $5)
     returning id, slug`,
    [slug, title, pinHash, expiresAt, photographerId]
  );

  return NextResponse.json({ gallery: rows[0] }, { status: 201 });
}

export async function GET() {
  const photographerId = await getAdminId();
  if (!photographerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rows } = await query(
    `select
       g.id, g.slug, g.title, g.created_at, g.expires_at, g.download_enabled,
       (g.pin_hash is not null) as has_pin,
       count(distinct p.id)::int as photo_count,
       count(distinct f.id)::int as favorite_count,
       count(distinct d.id)::int as download_count,
       count(distinct v.id)::int as view_count
     from galleries g
     left join photos p on p.gallery_id = g.id
     left join favorites f on f.gallery_id = g.id
     left join downloads d on d.gallery_id = g.id
     left join gallery_views v on v.gallery_id = g.id
     where g.photographer_id = $1
     group by g.id
     order by g.created_at desc`,
    [photographerId]
  );

  return NextResponse.json({ galleries: rows });
}
