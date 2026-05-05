import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

function env(name) {
  const value = process.env[name]?.trim() ?? "";
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const R2_ENDPOINT = env("CLOUDFLARE_R2_ENDPOINT");
const R2_ACCESS_KEY_ID = env("CLOUDFLARE_R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = env("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
const R2_BUCKET = env("CLOUDFLARE_R2_BUCKET");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const specs = [
  { table: "listings", bucket: "listings", type: "array", column: "gallery_paths" },
  { table: "blog_posts", bucket: "blog", type: "single", column: "cover_image_path" },
  { table: "banner_slides", bucket: "banners", type: "single", column: "image_path" },
  { table: "accessories", bucket: "accessories", type: "single", column: "image_path" },
];

async function r2HasObject(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadFromSupabasePublic(bucket, path) {
  const clean = String(path).replace(/^\/+/, "");
  const key = `${bucket}/${clean}`;
  if (await r2HasObject(key)) return "skipped";

  const sourceUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${clean}`;
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`Source fetch failed (${res.status}) for ${sourceUrl}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buf,
      ContentType: res.headers.get("content-type") || "application/octet-stream",
    }),
  );
  return "uploaded";
}

async function migrateSpec(spec) {
  console.log(`\nMigrating ${spec.table}.${spec.column} -> ${spec.bucket}/...`);
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  let from = 0;
  const pageSize = 500;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(spec.table)
      .select(`id, ${spec.column}`)
      .range(from, to);

    if (error) throw error;
    if (!data?.length) break;

    for (const row of data) {
      const value = row[spec.column];
      const paths =
        spec.type === "array"
          ? (Array.isArray(value) ? value : []).filter(Boolean)
          : value
            ? [value]
            : [];

      for (const path of paths) {
        try {
          const result = await uploadFromSupabasePublic(spec.bucket, path);
          if (result === "uploaded") uploaded += 1;
          else skipped += 1;
        } catch (error) {
          failed += 1;
          console.error(`Failed: ${spec.table}:${row.id} -> ${spec.bucket}/${path}`);
          console.error(error);
        }
      }
    }

    from += data.length;
  }

  return { uploaded, skipped, failed };
}

async function main() {
  console.log("Starting Supabase -> Cloudflare R2 image migration...");
  let totalUploaded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const spec of specs) {
    const result = await migrateSpec(spec);
    totalUploaded += result.uploaded;
    totalSkipped += result.skipped;
    totalFailed += result.failed;
    console.log(
      `${spec.table}: uploaded=${result.uploaded} skipped=${result.skipped} failed=${result.failed}`,
    );
  }

  console.log("\nDone.");
  console.log(
    `Totals: uploaded=${totalUploaded} skipped=${totalSkipped} failed=${totalFailed}`,
  );
  if (totalFailed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
