import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { FloatingWidgets } from "@/components/floating-widgets";
import { JsonLd, createMetadata, organizationSchema } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = createMetadata({
  title: "IBO Creative | Maler & Bodenleger in Moers",
  description:
    "IBO Creative gestaltet hochwertige Räume mit Malerarbeiten, Tapeten, dekorativen Wänden und Bodenverlegung in Moers, Rheinberg, Duisburg und Rheinhausen.",
});

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await getCmsContent();

  return (
    <html
      lang="de"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <JsonLd data={organizationSchema(content)} />
        <Providers>
          <SiteHeader company={content.company} navItems={content.navItems} />
          {children}
          <FloatingWidgets initialContent={content} />
          <SiteFooter content={content} />
        </Providers>
      </body>
    </html>
  );
}
