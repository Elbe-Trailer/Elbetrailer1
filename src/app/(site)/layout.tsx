import Footer from "@/components/Footer";
import Header from "@/components/Header";

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
    </>
  );
}
