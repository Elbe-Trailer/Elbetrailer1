import AdminInlineSitePageEditor from "@/components/site/AdminInlineSitePageEditor";
import ContentContainer from "@/components/ContentContainer";
import { getOptionalAdmin } from "@/lib/auth/admin";
import { getSitePageContent } from "@/lib/site-pages";
import { createClient } from "@/lib/supabase/server";

export default async function DatenschutzPage() {
  const admin = await getOptionalAdmin();
  const supabase = admin?.supabase ?? (await createClient());
  const page = await getSitePageContent(supabase, "datenschutz");

  return (
    <ContentContainer>
      <article className="max-w-3xl space-y-8 text-zinc-700 dark:text-zinc-300">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {page.title}
          </h1>
        </header>
        <AdminInlineSitePageEditor
          slug="datenschutz"
          title={page.title}
          content={page.content}
          isAdmin={Boolean(admin)}
        />
      </article>
    </ContentContainer>
  );
}
