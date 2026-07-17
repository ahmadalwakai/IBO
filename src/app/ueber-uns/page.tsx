import type { Metadata } from "next";
import { BadgeCheck, Hammer, ScanLine } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";
import { CmsIcon } from "@/lib/cms-icons";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = createMetadata({
  title: "Über uns | IBO Creative",
  description:
    "Lernen Sie IBO Creative kennen: Maler- und Bodenlegerhandwerk aus Moers mit sauberer Planung, hochwertiger Ausführung und persönlicher Beratung.",
  path: "/ueber-uns",
});

export default async function AboutPage() {
  const { checklist, company } = await getCmsContent();

  return (
    <main className="site-main">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Über uns</span>
          <h1 className="display">Handwerk mit Anspruch und ruhigem Blick.</h1>
          <p className="lede">
            {company.name} arbeitet für Räume, in denen Oberflächen nicht nur neu,
            sondern bewusst gestaltet wirken.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container before-after">
          <div className="content-flow">
            <SectionHeading eyebrow="Haltung" title="Warum wir anders arbeiten." />
            <p>
              Wir sehen Malerarbeiten und Bodenverlegung nicht als getrennte Gewerke,
              sondern als zusammenhängende Raumwirkung. Deshalb beginnt jedes Projekt
              mit Fragen zu Licht, Nutzung, Material und gewünschter Atmosphäre.
            </p>
            <p>
              Das Ergebnis soll hochwertig aussehen, im Alltag funktionieren und ohne
              unnötige Unruhe auskommen.
            </p>
          </div>
          <div className="why-grid">
            {[Hammer, ScanLine, BadgeCheck].map((Icon, index) => (
              <div className="why-item" key={index}>
                <Icon aria-hidden="true" />
                <h2>{["Saubere Vorbereitung", "Präzise Details", "Verlässliche Übergabe"][index]}</h2>
                <p className="muted">
                  {[
                    "Untergründe, Schutz und Material werden vor Beginn geklärt.",
                    "Kanten, Fugen und Übergänge entscheiden über die Wirkung.",
                    "Am Ende zählt eine Fläche, die sauber und vollständig übergeben wird.",
                  ][index]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-band">
        <div className="container">
          <SectionHeading eyebrow="Versprechen" title="Was Sie erwarten können." />
          <div className="materials-grid">
            {checklist.map((item) => (
                <div className="material-pill" key={item.text}>
                  <strong>{item.text}</strong>
                  <CmsIcon iconName={item.iconName} aria-hidden="true" />
                </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
