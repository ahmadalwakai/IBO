import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, MapPinned } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = createMetadata({
  title: "Einsatzgebiete | Maler & Bodenleger am Niederrhein",
  description:
    "IBO Creative arbeitet in Moers, Rheinberg, Duisburg und Rheinhausen. Entdecken Sie lokale Informationen zu unseren Einsatzgebieten.",
  path: "/einsatzgebiete",
});

export default async function CitiesPage() {
  const { cities } = await getCmsContent();

  return (
    <main className="site-main">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Einsatzgebiete</span>
          <h1 className="display">Kurze Wege für saubere Projekte.</h1>
          <p className="lede">
            Wir betreuen ausgewählte Städte rund um Moers mit persönlicher Beratung,
            präziser Planung und hochwertiger Ausführung.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Region"
            title="Unsere lokalen Stadtseiten."
            text="Jede Stadtseite enthält eigenen Kontext für typische Projekte, Wege und Anforderungen vor Ort."
          />
          <div className="city-grid four">
            {cities.map((city) => (
              <Link className="city-card" href={`/einsatzgebiete/${city.slug}`} key={city.slug}>
                <MapPinned aria-hidden="true" />
                <h2>{city.name}</h2>
                <p className="muted">{city.intro}</p>
                <span className="service-link">
                  Mehr erfahren <ArrowRight aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
