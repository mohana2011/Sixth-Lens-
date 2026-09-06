import { cookies } from 'next/headers';
import { galleryCookieName, verifyGalleryAccessToken } from './auth';

export async function hasGalleryAccess(gallery: { slug: string; pin_hash: string | null }): Promise<boolean> {
  if (!gallery.pin_hash) return true;
  const token = cookies().get(galleryCookieName(gallery.slug))?.value;
  if (!token) return false;
  return verifyGalleryAccessToken(token, gallery.slug);
}
