import Link from 'next/link';
import { requireAdmin } from '@/lib/session';
import { query } from '@/lib/db';
import AdminNav from '@/components/admin/AdminNav';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const admin = await requireAdmin();

  const { rows: galleries } = await query(
    `select
       g.id, g.slug, g.title, g.created_at, g.expires_at,
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
    [admin.id]
  );

  return (
    <main className="min-h-dvh bg-paper">
      <AdminNav studioName={admin.studio_name} />

      <div className="mx-auto max-w-6xl px-4 py-10 safe-x sm:px-6">
        <h1 className="font-serif text-2xl text-ink">Galleries</h1>

        {galleries.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-line py-16 text-center text-ink/50">
            <p>No galleries yet.</p>
            <Link href="/admin/galleries/new" className="mt-3 inline-block text-sm text-ink underline">
              Create your first gallery
            </Link>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink/50">
                  <th className="py-2 pr-4 font-normal">Title</th>
                  <th className="py-2 pr-4 font-normal">Created</th>
                  <th className="py-2 pr-4 font-normal">Photos</th>
                  <th className="py-2 pr-4 font-normal">Views</th>
                  <th className="py-2 pr-4 font-normal">Favorites</th>
                  <th className="py-2 pr-4 font-normal">Downloads</th>
                  <th className="py-2 pr-4 font-normal" />
                </tr>
              </thead>
              <tbody>
                {galleries.map((g) => (
                  <tr key={g.id} className="border-b border-line/60">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/galleries/${g.id}`} className="font-medium text-ink hover:underline">
                        {g.title}
                      </Link>
                      {g.has_pin && (
                        <span className="ml-2 rounded-full bg-ink/5 px-2 py-0.5 text-[10px] tracking-wide text-ink/50">
                          PIN
                        </span>
                      )}
                      {g.expires_at && new Date(g.expires_at) < new Date() && (
                        <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] tracking-wide text-red-500">
                          Expired
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-ink/60">
                      {new Date(g.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 text-ink/60">{g.photo_count}</td>
                    <td className="py-3 pr-4 text-ink/60">{g.view_count}</td>
                    <td className="py-3 pr-4 text-ink/60">{g.favorite_count}</td>
                    <td className="py-3 pr-4 text-ink/60">{g.download_count}</td>
                    <td className="py-3 pr-4 text-right">
                      <Link href={`/admin/galleries/${g.id}`} className="text-ink/50 hover:text-ink">
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
