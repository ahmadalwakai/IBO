import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";
import { CmsIcon } from "@/lib/cms-icons";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = createMetadata({
  title: "Leistungen | IBO Creative Maler & Bodenleger",
  description:
    "Alle Leistungen von IBO Creative: Malerarbeiten, Tapezierarbeiten, dekorative Wände, Bodenverlegung, Vinyl, Laminat, PVC, Graffiti- und Schimmelbeseitigung.",
  path: "/leistungen",
});

export default async function ServicesPage() {
  const { services } = await getCmsContent();

  return (
    <main className="site-main">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Leistungen</span>
          <h1 className="display">Alles für Wand, Boden und Oberfläche.</h1>
          <p className="lede">
            IBO Creative bündelt Beratung, Materialauswahl und saubere Ausführung
            für private und gewerbliche Räume im Raum Moers.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Überblick"
            title="Wählen Sie die passende Leistung."
            text="Jede Leistung hat eine eigene Seite mit Details, Einsatzbereichen und lokalem SEO-Kontext."
          />
          <div className="service-grid">
            {services.map((service) => (
                <Link className="service-card" href={`/leistungen/${service.slug}`} key={service.slug}>
                  <span className="service-card-media" aria-hidden="true">
                    <Image src={service.image} alt="" fill sizes="(min-width: 1180px) 25vw, (min-width: 640px) 50vw, 100vw" />
                    <span className="service-card-shade" />
                  </span>
                  <span className="service-card-content">
                    <span className="icon-disc">
                      <CmsIcon iconName={service.iconName} aria-hidden="true" />
                    </span>
                    <span className="eyebrow">{service.eyebrow}</span>
                    <h2>{service.title}</h2>
                    <p>{service.short}</p>
                    <span className="service-link">
                      Mehr erfahren <ArrowRight aria-hidden="true" />
                    </span>
                  </span>
                </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
