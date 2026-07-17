import type { Metadata } from "next";
import { Quote } from "lucide-react";
import { JsonLd, createMetadata, reviewSchema } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = createMetadata({
  title: "Kundenstimmen | IBO Creative",
  description:
    "Kundenstimmen zu Malerarbeiten, Bodenverlegung und Renovierungsprojekten von IBO Creative in Moers und Umgebung.",
  path: "/kundenstimmen",
});

export default async function TestimonialsPage() {
  const content = await getCmsContent();
  const { testimonials } = content;

  return (
    <main className="site-main">
      <JsonLd data={reviewSchema(content)} />
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Kundenstimmen</span>
          <h1 className="display">Was nach der Übergabe zählt.</h1>
          <p className="lede">
            Gute Projekte erkennt man an klarer Abstimmung, sauberer Ausführung und
            Räumen, die sich direkt fertig anfühlen.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Bewertungen" title="Stimmen aus Projekten." />
          <div className="testimonial-grid">
            {testimonials.concat(testimonials.slice(0, 2)).map((testimonial, index) => (
              <article className="testimonial-card" key={`${testimonial.name}-${index}`}>
                <Quote aria-hidden="true" />
                <blockquote>„{testimonial.quote}“</blockquote>
                <p>
                  <strong>{testimonial.name}</strong>
                  <br />
                  <span className="muted">{testimonial.context}</span>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
