import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminId } from '@/lib/session';
import { publicUrl } from '@/lib/r2';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const photographerId = await getAdminId();
  if (!photographerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { rows: galleryRows } = await query('select id, title from galleries where id = $1 and photographer_id = $2', [
    params.id,
    photographerId,
  ]);
  const gallery = galleryRows[0];
  if (!gallery) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { rows } = await query(
    `select p.id as photo_id, p.r2_key_web, p.sort_order, f.viewer_id, count(*)::int as viewer_count,
            min(f.created_at) as first_favorited_at
     from favorites f
     join photos p on p.id = f.photo_id
     where f.gallery_id = $1
     group by p.id, p.r2_key_web, p.sort_order, f.viewer_id`,
    [gallery.id]
  );

  // Collapse per-viewer rows into one entry per photo with the list of viewers who liked it.
  const byPhoto = new Map<
    string,
    { photo_id: string; web: string; sort_order: number; viewers: string[]; first_favorited_at: string }
  >();
  for (const r of rows) {
    const existing = byPhoto.get(r.photo_id);
    if (existing) {
      existing.viewers.push(r.viewer_id);
    } else {
      byPhoto.set(r.photo_id, {
        photo_id: r.photo_id,
        web: publicUrl(r.r2_key_web),
        sort_order: r.sort_order,
        viewers: [r.viewer_id],
        first_favorited_at: r.first_favorited_at,
      });
    }
  }
  const favorites = [...byPhoto.values()].sort((a, b) => a.sort_order - b.sort_order);

  if (req.nextUrl.searchParams.get('export') === 'csv') {
    const header = 'photo_id,favorite_count,web_url,first_favorited_at\n';
    const lines = favorites
      .map((f) => `${f.photo_id},${f.viewers.length},${f.web},${f.first_favorited_at}`)
      .join('\n');
    return new NextResponse(header + lines, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${gallery.title.replace(/[^a-z0-9]+/gi, '-')}-favorites.csv"`,
      },
    });
  }

  return NextResponse.json({ favorites });
}
