import AdminInlineSitePageEditor from "@/components/site/AdminInlineSitePageEditor";
import ContentContainer from "@/components/ContentContainer";
import { getOptionalAdmin } from "@/lib/auth/admin";
import { getSitePageContent } from "@/lib/site-pages";
import { createClient } from "@/lib/supabase/server";
import ContactInquiryForm from "./ContactInquiryForm";

export default async function KontaktPage() {
  const admin = await getOptionalAdmin();
  const supabase = admin?.supabase ?? (await createClient());
  const page = await getSitePageContent(supabase, "kontakt");

  return (
    <ContentContainer>
      <article className="max-w-3xl space-y-8 text-zinc-700 dark:text-zinc-300">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {page.title}
          </h1>
        </header>
        <AdminInlineSitePageEditor
          slug="kontakt"
          title={page.title}
          content={page.content}
          isAdmin={Boolean(admin)}
        />
        <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-700">
          <ContactInquiryForm />
        </section>
      </article>
    </ContentContainer>
  );
}
