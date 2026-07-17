import Link from "next/link";
import type { CmsContent } from "@/lib/cms-types";

export function SiteFooter({ content }: { content: CmsContent }) {
  const { company, navItems, services, cities } = content;

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="content-flow">
            <Link href="/" className="logo-mark" aria-label="IBO Creative Startseite">
              <span className="logo-symbol">IBO</span>
              <span className="logo-word">
                <strong>IBO Creative</strong>
                <span>Maler & Bodenleger</span>
              </span>
            </Link>
            <p className="muted">
              Premium-Malerarbeiten, dekorative Wände und Bodenverlegung für Moers,
              Rheinberg, Duisburg und Rheinhausen.
            </p>
            <p className="muted">
              {company.address}
              <br />
              <a href={company.phoneHref}>{company.phone}</a>
              <br />
              <a href={company.emailHref}>{company.email}</a>
            </p>
          </div>

          <div className="footer-links">
            <strong>Navigation</strong>
            {navItems.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="footer-links">
            <strong>Leistungen</strong>
            {services.slice(0, 6).map((service) => (
              <Link href={`/leistungen/${service.slug}`} key={service.slug}>
                {service.title}
              </Link>
            ))}
          </div>

          <div className="footer-links">
            <strong>Region</strong>
            {cities.map((city) => (
              <Link href={`/einsatzgebiete/${city.slug}`} key={city.slug}>
                {city.name}
              </Link>
            ))}
            <Link href="/datenschutz">Datenschutz</Link>
            <Link href="/impressum">Impressum</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {company.name}. Alle Rechte vorbehalten.</span>
          <span>Handwerklich präzise. Visuell ruhig. Verbindlich geplant.</span>
        </div>
      </div>
    </footer>
  );
}
