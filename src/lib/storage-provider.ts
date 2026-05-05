"use server";

import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type SupabaseStorageFallback = {
  storage: {
    from: (bucket: string) => {
      upload: (path: string, file: File, options: { upsert: boolean }) => Promise<{ error: { message?: string } | null }>;
      remove: (paths: string[]) => Promise<{ error: { message?: string } | null }>;
    };
  };
};

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function hasCloudflareR2Config(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_R2_ENDPOINT &&
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
      process.env.CLOUDFLARE_R2_BUCKET,
  );
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
  supabaseFallback?: SupabaseStorageFallback;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { bucket, path, file, supabaseFallback } = params;
  if (!file || file.size === 0) return { ok: false, error: "Leere Datei." };

  if (!hasCloudflareR2Config()) {
    if (!supabaseFallback) {
      return { ok: false, error: "Cloudflare R2 ist nicht konfiguriert." };
    }
    const { error } = await supabaseFallback.storage
      .from(bucket)
      .upload(path, file, { upsert: false });
    return error ? { ok: false, error: error.message ?? "Upload fehlgeschlagen." } : { ok: true };
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
        ContentType: file.type || "application/octet-stream",
      }),
    );
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Cloudflare-Upload fehlgeschlagen." };
  }
}

export async function removeObjects(params: {
  bucket: string;
  paths: string[];
  supabaseFallback?: SupabaseStorageFallback;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { bucket, paths, supabaseFallback } = params;
  if (!paths.length) return { ok: true };

  if (!hasCloudflareR2Config()) {
    if (!supabaseFallback) {
      return { ok: false, error: "Cloudflare R2 ist nicht konfiguriert." };
    }
    const { error } = await supabaseFallback.storage.from(bucket).remove(paths);
    return error ? { ok: false, error: error.message ?? "Löschen fehlgeschlagen." } : { ok: true };
  }

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
    return { ok: false, error: "Cloudflare-Löschen fehlgeschlagen." };
  }
}
