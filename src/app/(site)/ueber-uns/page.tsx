import type { Metadata } from "next";
import AdminInlineSitePageEditor from "@/components/site/AdminInlineSitePageEditor";
import { buildSitePageMetadata } from "@/lib/seo/site-page-metadata";
import ContentContainer from "@/components/ContentContainer";
import { getOptionalAdmin } from "@/lib/auth/admin";
import { getSitePageContent } from "@/lib/site-pages";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return buildSitePageMetadata("ueber-uns");
}

export default async function UeberUnsPage() {
  const admin = await getOptionalAdmin();
  const supabase = admin?.supabase ?? (await createClient());
  const page = await getSitePageContent(supabase, "ueber-uns");

  return (
    <ContentContainer>
      <article className="max-w-3xl space-y-10 text-zinc-700 dark:text-zinc-300">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {page.title}
          </h1>
        </header>
        <AdminInlineSitePageEditor
          slug="ueber-uns"
          title={page.title}
          content={page.content}
          isAdmin={Boolean(admin)}
        />
      </article>
    </ContentContainer>
  );
}
