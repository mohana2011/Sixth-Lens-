import { SignJWT, jwtVerify } from 'jose';

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export const ADMIN_COOKIE = 'sl_admin_session';
export const galleryCookieName = (slug: string) => `sl_gallery_${slug}`;

export async function createAdminSessionToken(photographerId: string) {
  return new SignJWT({ sub: photographerId, type: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey());
}

export async function verifyAdminSessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.type !== 'admin' || typeof payload.sub !== 'string') return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export async function createGalleryAccessToken(gallerySlug: string) {
  return new SignJWT({ slug: gallerySlug, type: 'gallery' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey());
}

export async function verifyGalleryAccessToken(
  token: string,
  gallerySlug: string
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.type === 'gallery' && payload.slug === gallerySlug;
  } catch {
    return false;
  }
}
