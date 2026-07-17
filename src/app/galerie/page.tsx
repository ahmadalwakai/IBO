import Image from "next/image";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = createMetadata({
  title: "Galerie | IBO Creative",
  description:
    "Galerie von IBO Creative mit hochwertigen Wandflächen, Böden, dekorativen Oberflächen und Fassadenarbeiten.",
  path: "/galerie",
});

export default async function GalleryPage() {
  const { projects } = await getCmsContent();
  const images = projects.concat(projects).slice(0, 8);

  return (
    <main className="site-main">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Galerie</span>
          <h1 className="display">Details, die leise wirken.</h1>
          <p className="lede">
            Wandflächen, Böden und Übergänge entfalten ihre Qualität oft aus der Nähe.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Masonry" title="Visuelle Referenzen." />
          <div className="masonry-grid">
            {images.map((project, index) => (
              <figure className="gallery-item" key={`${project.title}-${index}`}>
                <Image src={project.image} alt={project.title} fill sizes="(min-width: 900px) 33vw, 100vw" />
                <figcaption>{project.category}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
