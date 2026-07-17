import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import {
  JsonLd,
  breadcrumbSchema,
  createMetadata,
  serviceSchema,
} from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";
import { CmsIcon } from "@/lib/cms-icons";
import { LuxuryButton } from "@/components/ui/luxury-button";
import { SectionHeading } from "@/components/ui/section-heading";

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { services } = await getCmsContent();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { services } = await getCmsContent();
  const service = services.find((item) => item.slug === slug);

  if (!service) {
    return createMetadata({
      title: "Leistung nicht gefunden | IBO Creative",
      description: "Diese Leistung wurde nicht gefunden.",
      path: `/leistungen/${slug}`,
    });
  }

  return createMetadata({
    title: service.seoTitle,
    description: service.seoDescription,
    path: `/leistungen/${service.slug}`,
    image: service.image,
  });
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const content = await getCmsContent();
  const { cities, services } = content;
  const service = services.find((item) => item.slug === slug);

  if (!service) notFound();

  const related = services.filter((item) => item.slug !== service.slug).slice(0, 3);

  return (
    <main className="site-main">
      <JsonLd data={serviceSchema(service.slug, content)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Startseite", path: "/" },
          { name: "Leistungen", path: "/leistungen" },
          { name: service.title, path: `/leistungen/${service.slug}` },
        ], content)}
      />

      <section className="page-hero">
        <div className="container detail-hero-grid">
          <div>
            <span className="eyebrow">{service.eyebrow}</span>
            <h1 className="display">{service.title}</h1>
            <p className="lede">{service.summary}</p>
            <div className="hero-actions">
              <LuxuryButton href="/kontakt" variant="primary">
                Projekt anfragen
              </LuxuryButton>
              <LuxuryButton href="/leistungen">Alle Leistungen</LuxuryButton>
            </div>
          </div>
          <div className="detail-media">
            <Image src={service.image} alt={service.title} fill priority sizes="(min-width: 900px) 46vw, 100vw" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container before-after">
          <div className="content-flow">
            <span className="icon-disc">
              <CmsIcon iconName={service.iconName} aria-hidden="true" />
            </span>
            <h2>Wie wir {service.title.toLowerCase()} planen.</h2>
            <p>
              Gute Ausführung beginnt vor dem ersten Arbeitsschritt. Wir prüfen
              Untergrund, Nutzung, Licht und Terminrahmen, damit Material und Ergebnis
              zusammenpassen.
            </p>
            <ul className="detail-list">
              {service.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="content-flow">
            <h2>Für Moers und die umliegenden Städte.</h2>
            <p>
              Wir arbeiten regional und stimmen Besichtigung, Beratung und Ausführung
              auf kurze Wege ab. Dadurch bleiben Termine realistisch und Rückfragen
              schnell geklärt.
            </p>
            <div className="city-grid">
              {cities.map((city) => (
                <Link className="city-card" href={`/einsatzgebiete/${city.slug}`} key={city.slug}>
                  <h3>{city.name}</h3>
                  <span className="service-link">
                    Einsatzgebiet <ArrowRight aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-band">
        <div className="container">
          <SectionHeading
            eyebrow="Verwandte Leistungen"
            title="Weitere Oberflächen aus einer Hand."
          />
          <div className="service-grid">
            {related.map((item) => (
              <Link className="service-card" href={`/leistungen/${item.slug}`} key={item.slug}>
                <span className="service-card-media" aria-hidden="true">
                  <Image src={item.image} alt="" fill sizes="(min-width: 900px) 33vw, 100vw" />
                  <span className="service-card-shade" />
                </span>
                <span className="service-card-content">
                  <span className="eyebrow">{item.eyebrow}</span>
                  <h2>{item.title}</h2>
                  <p>{item.short}</p>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
