# Cloudflare image migration runbook

## 1) Configure environment

Set these variables in the deployment environment and local `.env`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDFLARE_R2_ENDPOINT`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `NEXT_PUBLIC_CLOUDFLARE_PUBLIC_BASE_URL`
- optional: `NEXT_PUBLIC_CLOUDFLARE_IMAGE_VARIANT`

## 2) Deploy application code

Deploy the app changes first. Uploads and image URLs use Cloudflare R2 only (`publicStorageUrl(...)`).

## 3) Run migration (idempotent)

Run:

```bash
npm run migrate:images:cloudflare
```

The script:

- Migrates `listings.gallery_paths` from `listings/`
- Migrates `blog_posts.cover_image_path` from `blog/`
- Migrates `banner_slides.image_path` from `banners/`
- Migrates `accessories.image_path` from `accessories/`
- Skips objects that already exist in R2

If a run is interrupted, rerun the same command.

## 4) Validate critical flows

- Admin: create listing with multiple images
- Admin: update listing and append image
- Admin: delete listing and verify image cleanup
- Admin: create/update/delete blog cover image
- Site: listing cards and detail pages render images
- Site: blog list and blog detail render cover images
- Admin/site: banner and accessory images still render

## 5) Cutover and cleanup

After migration validates:

1. Ensure Cloudflare base URL is active in all environments.
2. Verify no image requests rely on Supabase storage paths.
3. Optionally remove Supabase storage buckets/policies after backup.
