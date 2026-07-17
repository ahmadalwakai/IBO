import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";

export const metadata: Metadata = createMetadata({
  title: "Impressum | IBO Creative",
  description: "Impressum und Anbieterkennzeichnung von IBO Creative.",
  path: "/impressum",
});

export default async function ImprintPage() {
  const { company } = await getCmsContent();

  return (
    <main className="site-main">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Impressum</span>
          <h1 className="display">Anbieterkennzeichnung.</h1>
        </div>
      </section>
      <section className="section">
        <div className="container legal-content">
          <h2>{company.legalName}</h2>
          <p>
            {company.address}
            <br />
            Telefon: {company.phone}
            <br />
            E-Mail: {company.email}
          </p>
          <h2>Verantwortlich für den Inhalt</h2>
          <p>{company.legalName}, {company.address}</p>
          <h2>Hinweis</h2>
          <p>
            Dieses Impressum ist als Platzhalter für die finalen rechtlichen Angaben
            vorbereitet und sollte vor Veröffentlichung geprüft und ergänzt werden.
          </p>
        </div>
      </section>
    </main>
  );
}
