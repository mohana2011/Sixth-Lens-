import { requireAdmin } from '@/lib/session';
import AdminNav from '@/components/admin/AdminNav';
import NewGalleryForm from '@/components/admin/NewGalleryForm';

export const dynamic = 'force-dynamic';

export default async function NewGalleryPage() {
  const admin = await requireAdmin();

  return (
    <main className="min-h-dvh bg-paper">
      <AdminNav studioName={admin.studio_name} />
      <div className="mx-auto max-w-6xl px-4 py-10 safe-x sm:px-6">
        <h1 className="mb-8 font-serif text-2xl text-ink">New Gallery</h1>
        <NewGalleryForm />
      </div>
    </main>
  );
}
