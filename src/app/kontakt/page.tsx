import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = createMetadata({
  title: "Kontakt | IBO Creative",
  description:
    "Kontaktieren Sie IBO Creative für eine kostenlose Besichtigung in Moers, Rheinberg, Duisburg oder Rheinhausen.",
  path: "/kontakt",
});

export default async function ContactPage() {
  const { company } = await getCmsContent();

  return (
    <main className="site-main">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Kontakt</span>
          <h1 className="display">Ihr Projekt beginnt mit einem klaren Gespräch.</h1>
          <p className="lede">
            Rufen Sie uns an oder senden Sie eine kurze Anfrage. Wir stimmen den
            passenden Termin für die Besichtigung ab.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container contact-layout">
          <div className="content-flow">
            <h2>Direkt erreichbar.</h2>
            <p className="muted">
              Für eine präzise Einschätzung nennen Sie bitte Ort, gewünschte Leistung
              und den ungefähren Umfang.
            </p>
            <a className="contact-pill" href={company.phoneHref}>
              <Phone aria-hidden="true" />
              {company.phone}
            </a>
            <a className="contact-pill" href={company.emailHref}>
              <Mail aria-hidden="true" />
              {company.email}
            </a>
            <span className="contact-pill">
              <MapPin aria-hidden="true" />
              {company.address}
            </span>
          </div>
          <div className="contact-panel">
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
