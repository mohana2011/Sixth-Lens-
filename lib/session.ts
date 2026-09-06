import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, verifyAdminSessionToken } from './auth';
import { query } from './db';

export async function getAdminId(): Promise<string | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export async function requireAdmin(): Promise<{ id: string; email: string; studio_name: string }> {
  const id = await getAdminId();
  if (!id) redirect('/admin/login');
  const { rows } = await query<{ id: string; email: string; studio_name: string }>(
    'select id, email, studio_name from photographers where id = $1',
    [id]
  );
  if (!rows[0]) redirect('/admin/login');
  return rows[0];
}
