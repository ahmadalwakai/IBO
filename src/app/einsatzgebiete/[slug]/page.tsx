import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, MapPinned } from "lucide-react";
import { JsonLd, breadcrumbSchema, createMetadata } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";
import { LuxuryButton } from "@/components/ui/luxury-button";
import { SectionHeading } from "@/components/ui/section-heading";

type CityPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { cities } = await getCmsContent();
  return cities.map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { cities } = await getCmsContent();
  const city = cities.find((item) => item.slug === slug);

  if (!city) {
    return createMetadata({
      title: "Einsatzgebiet nicht gefunden | IBO Creative",
      description: "Dieses Einsatzgebiet wurde nicht gefunden.",
      path: `/einsatzgebiete/${slug}`,
    });
  }

  return createMetadata({
    title: city.seoTitle,
    description: city.seoDescription,
    path: `/einsatzgebiete/${city.slug}`,
  });
}

export default async function CityDetailPage({ params }: CityPageProps) {
  const { slug } = await params;
  const content = await getCmsContent();
  const { cities, services } = content;
  const city = cities.find((item) => item.slug === slug);

  if (!city) notFound();

  return (
    <main className="site-main">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Startseite", path: "/" },
          { name: "Einsatzgebiete", path: "/einsatzgebiete" },
          { name: city.name, path: `/einsatzgebiete/${city.slug}` },
        ], content)}
      />
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Einsatzgebiet</span>
          <h1 className="display">{city.title}</h1>
          <p className="lede">{city.intro}</p>
          <div className="hero-actions">
            <LuxuryButton href="/kontakt" variant="primary">
              Besichtigung anfragen
            </LuxuryButton>
            <LuxuryButton href="/leistungen">Leistungen ansehen</LuxuryButton>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container before-after">
          <div className="content-flow">
            <MapPinned aria-hidden="true" />
            <h2>Lokaler Fokus in {city.name}.</h2>
            <p>
              Die Anforderungen unterscheiden sich je nach Objekt, Nutzung und
              Zustand der Untergründe. Für {city.name} achten wir besonders auf eine
              realistische Planung und klare Abstimmung vor Ort.
            </p>
            <ul className="detail-list">
              {city.localFocus.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="content-flow">
            <h2>Leistungen für {city.name}.</h2>
            <p>
              Ob einzelne Wandfläche, komplette Renovierung oder neuer Boden:
              Wir wählen Materialien und Ablauf passend zu Raum, Nutzung und Budget.
            </p>
            <div className="materials-grid">
              {services.slice(0, 6).map((service) => (
                <Link className="material-pill" href={`/leistungen/${service.slug}`} key={service.slug}>
                  <strong>{service.title}</strong>
                  <ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-band">
        <div className="container">
          <SectionHeading
            eyebrow="Nächster Schritt"
            title={`Projekt in ${city.name} besprechen.`}
            text="Senden Sie uns eine kurze Beschreibung. Wir melden uns zur Abstimmung eines passenden Termins."
            action={{ label: "Kontakt aufnehmen", href: "/kontakt" }}
            split
          />
        </div>
      </section>
    </main>
  );
}
