import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";

export const metadata: Metadata = createMetadata({
  title: "Datenschutz | IBO Creative",
  description: "Datenschutzhinweise von IBO Creative.",
  path: "/datenschutz",
});

export default async function PrivacyPage() {
  const { company } = await getCmsContent();

  return (
    <main className="site-main">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Datenschutz</span>
          <h1 className="display">Datenschutzhinweise.</h1>
          <p className="lede">
            Informationen zum Umgang mit personenbezogenen Daten auf dieser Website.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container legal-content">
          <h2>Verantwortlicher</h2>
          <p>
            {company.legalName}
            <br />
            {company.address}
            <br />
            {company.email}
          </p>
          <h2>Kontaktaufnahme</h2>
          <p>
            Wenn Sie uns per Telefon, E-Mail oder Formular kontaktieren, verarbeiten wir
            Ihre Angaben zur Bearbeitung der Anfrage und für mögliche Anschlussfragen.
          </p>
          <h2>Serverdaten</h2>
          <p>
            Beim Besuch der Website können technisch notwendige Zugriffsdaten verarbeitet
            werden, um die Seite sicher und stabil auszuliefern.
          </p>
          <h2>Ihre Rechte</h2>
          <p>
            Sie haben im Rahmen der gesetzlichen Vorgaben Rechte auf Auskunft,
            Berichtigung, Löschung, Einschränkung und Widerspruch.
          </p>
        </div>
      </section>
    </main>
  );
}
