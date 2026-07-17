import type { Metadata } from "next";
import { JsonLd, createMetadata, faqSchema } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = createMetadata({
  title: "FAQ | IBO Creative",
  description:
    "Antworten auf häufige Fragen zu Besichtigung, Angeboten, Malerarbeiten, Bodenverlegung und Projektablauf bei IBO Creative.",
  path: "/faq",
});

export default async function FaqPage() {
  const content = await getCmsContent();
  const { faqs } = content;

  return (
    <main className="site-main">
      <JsonLd data={faqSchema(content)} />
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">FAQ</span>
          <h1 className="display">Fragen vor dem Projektstart.</h1>
          <p className="lede">
            Die wichtigsten Antworten zu Ablauf, Angebot, Material und Ausführung.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Antworten" title="Kurz und klar." />
          <div className="faq-grid">
            {faqs.map((faq) => (
              <article className="faq-item" key={faq.question}>
                <h2 className="faq-button">{faq.question}</h2>
                <p className="faq-panel">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
