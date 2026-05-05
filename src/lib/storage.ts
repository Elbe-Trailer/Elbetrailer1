const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export function publicStorageUrl(bucket: string, path: string): string {
  const clean = path.replace(/^\/+/, "");
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${clean}`;
}
