import HeaderNav from "@/components/HeaderNav";
import {
  HEADER_MARKETING_KEYS,
  getCachedActiveCategories,
  getCachedMarketingContentMap,
  pickMarketingContent,
} from "@/lib/site-data";

export default async function Header() {
  const [categories, marketing] = await Promise.all([
    getCachedActiveCategories(),
    getCachedMarketingContentMap(),
  ]);
  const copy = pickMarketingContent(marketing, HEADER_MARKETING_KEYS);

  return <HeaderNav categories={categories} copy={copy} />;
}
