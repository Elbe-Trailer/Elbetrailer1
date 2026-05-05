const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");
const CLOUDFLARE_BASE = (process.env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");
const CLOUDFLARE_VARIANT = (process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGE_VARIANT ?? "")
  .trim()
  .replace(/^\/+|\/+$/g, "");

function cleanPath(path: string): string {
  return path.replace(/^\/+/, "");
}

export function supabasePublicStorageUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanPath(path)}`;
}

export function cloudflarePublicStorageUrl(bucket: string, path: string): string {
  const clean = cleanPath(path);
  if (!CLOUDFLARE_BASE) return "";
  if (CLOUDFLARE_VARIANT) {
    return `${CLOUDFLARE_BASE}/${CLOUDFLARE_VARIANT}/${bucket}/${clean}`;
  }
  return `${CLOUDFLARE_BASE}/${bucket}/${clean}`;
}

export function publicStorageCandidates(bucket: string, path: string): string[] {
  const urls: string[] = [];
  const cf = cloudflarePublicStorageUrl(bucket, path);
  if (cf) urls.push(cf);
  if (SUPABASE_URL) urls.push(supabasePublicStorageUrl(bucket, path));
  return urls;
}

export function publicStorageUrl(bucket: string, path: string): string {
  const [primary] = publicStorageCandidates(bucket, path);
  return primary ?? "";
}
