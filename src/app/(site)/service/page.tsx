import type { Metadata } from "next";
import AdminInlineSitePageEditor from "@/components/site/AdminInlineSitePageEditor";
import { buildSitePageMetadata } from "@/lib/seo/site-page-metadata";
import ContentContainer from "@/components/ContentContainer";
import { getCachedSitePageContent } from "@/lib/site-pages";
import ContactInquiryForm from "@/app/(site)/kontakt/ContactInquiryForm";

export async function generateMetadata(): Promise<Metadata> {
  return buildSitePageMetadata("service");
}

export default async function ServicePage() {
  const page = await getCachedSitePageContent("service");

  return (
    <ContentContainer>
      <article className="max-w-3xl space-y-8 text-zinc-700 dark:text-zinc-300">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {page.title}
          </h1>
        </header>
        <AdminInlineSitePageEditor
          slug="service"
          title={page.title}
          content={page.content}
        />
        <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-700">
          <ContactInquiryForm />
        </section>
      </article>
    </ContentContainer>
  );
}
