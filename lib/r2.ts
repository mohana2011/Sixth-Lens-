import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  type GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function createClient() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials are not fully configured');
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

let _client: S3Client | undefined;
function client() {
  if (!_client) _client = createClient();
  return _client;
}

const BUCKET = () => {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error('R2_BUCKET is not set');
  return bucket;
};

export const r2Keys = {
  original: (galleryId: string, photoId: string, ext: string) =>
    `originals/${galleryId}/${photoId}.${ext}`,
  web: (galleryId: string, photoId: string) => `web/${galleryId}/${photoId}.jpg`,
  thumb: (galleryId: string, photoId: string) => `thumb/${galleryId}/${photoId}.jpg`,
};

export async function putObject(key: string, body: Buffer, contentType: string) {
  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function getObject(key: string): Promise<GetObjectCommandOutput> {
  return client().send(new GetObjectCommand({ Bucket: BUCKET(), Key: key }));
}

export async function deleteObject(key: string) {
  await client().send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));
}

// web/ and thumb/ keys are served from a public R2 bucket (r2.dev subdomain or a
// custom domain) since they're low-res previews meant to be viewed freely by
// anyone holding the gallery link. Originals stay private and only ever leave
// the server via a short-lived presigned URL (see presignedDownloadUrl below).
export function publicUrl(key: string): string {
  const host = process.env.R2_PUBLIC_HOSTNAME;
  if (!host) throw new Error('R2_PUBLIC_HOSTNAME is not set');
  return `https://${host}/${key}`;
}

export async function presignedDownloadUrl(
  key: string,
  filename: string,
  expiresIn = 900
) {
  const command = new GetObjectCommand({
    Bucket: BUCKET(),
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, '')}"`,
  });
  return getSignedUrl(client(), command, { expiresIn });
}
