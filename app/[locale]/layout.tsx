import { TopBar } from "@/components/layout/top-bar";
import { Footer } from "@/components/layout/footer";

export function generateStaticParams() {
  return [{ locale: "it" }, { locale: "en" }];
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
