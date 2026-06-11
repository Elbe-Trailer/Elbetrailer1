import Footer from "@/components/Footer";
import Header from "@/components/Header";
import CookieConsent from "@/components/consent/CookieConsent";
import GoogleAnalytics from "@/components/seo/GoogleAnalytics";
import GoogleConsentMode from "@/components/seo/GoogleConsentMode";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="w-full flex-1 overflow-x-hidden">{children}</main>
      <Footer />
      <CookieConsent />
      {gaMeasurementId ? (
        <>
          <GoogleConsentMode />
          <GoogleAnalytics measurementId={gaMeasurementId} />
        </>
      ) : null}
    </>
  );
}
