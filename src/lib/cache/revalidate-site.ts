import { revalidateTag } from "next/cache";
import { SITE_CACHE_TAGS } from "@/lib/cache/tags";

const REVALIDATE_PROFILE = "max";

export function revalidateSiteCategories() {
  revalidateTag(SITE_CACHE_TAGS.categories, REVALIDATE_PROFILE);
}

export function revalidateSiteMarketing() {
  revalidateTag(SITE_CACHE_TAGS.marketing, REVALIDATE_PROFILE);
}

export function revalidateSiteHome() {
  revalidateTag(SITE_CACHE_TAGS.home, REVALIDATE_PROFILE);
}

export function revalidateSitePage(slug: string) {
  revalidateTag(`site-page-${slug}`, REVALIDATE_PROFILE);
}

export function revalidatePublicSiteContent() {
  revalidateSiteCategories();
  revalidateSiteMarketing();
  revalidateSiteHome();
}
