// Nur serverseitige Helfer – bewusst KEIN "use server": das würde uploadObject
// und removeObjects als öffentlich aufrufbare Server Actions ohne Admin-Check
// registrieren. Aufrufer (Admin-Actions/-Routen) prüfen die Berechtigung selbst.
import "server-only";

import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Alle Uploads sind Bilder. SVG/HTML o. Ä. werden abgelehnt, weil sie auf der
// öffentlichen R2-Domain als aktiver Inhalt (Script) ausgeliefert würden.
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function getR2Client(): { client: S3Client; bucket: string } {
  const endpoint = getRequiredEnv("CLOUDFLARE_R2_ENDPOINT");
  const accessKeyId = getRequiredEnv("CLOUDFLARE_R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  const bucket = getRequiredEnv("CLOUDFLARE_R2_BUCKET");

  return {
    bucket,
    client: new S3Client({
      region: "auto",
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

function objectKey(bucket: string, path: string): string {
  return `${bucket}/${path.replace(/^\/+/, "")}`;
}

export async function uploadObject(params: {
  bucket: string;
  path: string;
  file: File;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { bucket, path, file } = params;
  if (!file || file.size === 0) return { ok: false, error: "Leere Datei." };
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, error: "Dateityp nicht erlaubt (JPG, PNG, WEBP, GIF, AVIF)." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Datei ist zu groß (max. 15 MB)." };
  }

  try {
    const { client, bucket: r2Bucket } = getR2Client();
    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);
    await client.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: objectKey(bucket, path),
        Body: body,
        ContentType: file.type,
      }),
    );
    return { ok: true };
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message.includes("is not set")) {
      return { ok: false, error: "Cloudflare R2 ist nicht konfiguriert." };
    }
    return { ok: false, error: "Cloudflare-Upload fehlgeschlagen." };
  }
}

export async function removeObjects(params: {
  bucket: string;
  paths: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { bucket, paths } = params;
  if (!paths.length) return { ok: true };

  try {
    const { client, bucket: r2Bucket } = getR2Client();
    const objects = paths.map((path) => ({ Key: objectKey(bucket, path) }));
    await client.send(
      new DeleteObjectsCommand({
        Bucket: r2Bucket,
        Delete: { Objects: objects, Quiet: true },
      }),
    );
    return { ok: true };
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message.includes("is not set")) {
      return { ok: false, error: "Cloudflare R2 ist nicht konfiguriert." };
    }
    return { ok: false, error: "Cloudflare-Löschen fehlgeschlagen." };
  }
}
