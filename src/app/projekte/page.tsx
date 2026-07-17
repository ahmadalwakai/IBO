import Image from "next/image";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = createMetadata({
  title: "Projekte | IBO Creative",
  description:
    "Ausgewählte Projekte von IBO Creative: Malerarbeiten, Bodenverlegung, dekorative Wände und Fassadenpflege.",
  path: "/projekte",
});

export default async function ProjectsPage() {
  const { galleryFilters, projects } = await getCmsContent();

  return (
    <main className="site-main">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Projekte</span>
          <h1 className="display">Arbeiten mit ruhiger Wirkung.</h1>
          <p className="lede">
            Ein Einblick in Oberflächen, Böden und Räume, die durch präzise
            Ausführung sichtbar gewinnen.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Auswahl" title="Projektgalerie." />
          <div className="filter-row" aria-label="Kategorien">
            {galleryFilters.map((filter) => (
              <span className="filter-pill" key={filter}>
                {filter}
              </span>
            ))}
          </div>
          <div className="project-grid">
            {projects.concat(projects.slice(1, 3)).map((project, index) => (
              <article className="project-card" key={`${project.title}-${index}`}>
                <Image src={project.image} alt={project.title} fill sizes="(min-width: 900px) 50vw, 100vw" />
                <span className="project-card-shade" />
                <span className="project-card-content">
                  <span className="eyebrow">{project.category}</span>
                  <h2>{project.title}</h2>
                  <p>{project.text}</p>
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
