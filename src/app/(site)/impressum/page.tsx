import type { Metadata } from "next";
import AdminInlineSitePageEditor from "@/components/site/AdminInlineSitePageEditor";
import { buildSitePageMetadata } from "@/lib/seo/site-page-metadata";
import ContentContainer from "@/components/ContentContainer";
import { getCachedSitePageContent } from "@/lib/site-pages";

export async function generateMetadata(): Promise<Metadata> {
  return buildSitePageMetadata("impressum");
}

export default async function ImpressumPage() {
  const page = await getCachedSitePageContent("impressum");

  return (
    <ContentContainer>
      <article className="max-w-3xl space-y-8 text-zinc-700 dark:text-zinc-300">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {page.title}
          </h1>
        </header>
        <AdminInlineSitePageEditor
          slug="impressum"
          title={page.title}
          content={page.content}
        />
      </article>
    </ContentContainer>
  );
}
