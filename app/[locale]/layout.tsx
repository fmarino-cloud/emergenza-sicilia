import { TopBar } from "@/components/layout/top-bar";
import { Footer } from "@/components/layout/footer";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://emergenzasicilia.it";

export function generateStaticParams() {
  return [{ locale: "it" }, { locale: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const alternates = {
    canonical: `${baseUrl}/${locale}`,
    languages: {
      it: `${baseUrl}/it`,
      en: `${baseUrl}/en`,
    },
  };

  return {
    alternates,
  };
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen flex flex-col bg-white">
        <TopBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
