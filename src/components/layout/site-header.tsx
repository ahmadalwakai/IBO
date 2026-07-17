"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Globe2,
  Languages,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  X,
} from "lucide-react";
import type { CmsCompany, CmsContent } from "@/lib/cms-types";
import { LuxuryButton } from "@/components/ui/luxury-button";

type SiteHeaderProps = {
  company: CmsCompany;
  navItems: CmsContent["navItems"];
};

export function SiteHeader({ company, navItems }: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(scrollTop > 18);
      setProgress(max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerStyle = useMemo(
    () => ({ "--progress": `${progress}%` }) as React.CSSProperties,
    [progress],
  );

  return (
    <header
      className={`site-header ${scrolled ? "scrolled" : ""}`.trim()}
      style={headerStyle}
    >
      <div className="top-strip">
        <div className="top-strip-inner">
          <div className="top-strip-group">
            <a className="contact-pill" href={`https://maps.google.com/?q=${encodeURIComponent(company.address)}`}>
              <MapPin aria-hidden="true" />
              {company.address}
            </a>
            <a className="contact-pill" href={company.phoneHref}>
              <Phone aria-hidden="true" />
              {company.phone}
            </a>
            <a className="contact-pill" href={company.emailHref}>
              <Mail aria-hidden="true" />
              {company.email}
            </a>
          </div>
          <div className="social-row" aria-label="Social Media">
            <a className="contact-pill" href={company.phoneHref} aria-label="WhatsApp anfragen">
              <MessageCircle aria-hidden="true" />
            </a>
            <a className="contact-pill" href="/galerie" aria-label="Galerie ansehen">
              <Camera aria-hidden="true" />
            </a>
            <a className="contact-pill" href="/kontakt" aria-label="Kontakt öffnen">
              <Globe2 aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className="header-inner">
        <Link href="/" className="logo-mark" aria-label="IBO Creative Startseite">
          <span className="logo-symbol">IBO</span>
          <span className="logo-word">
            <strong>IBO Creative</strong>
            <span>Maler & Bodenleger</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Hauptnavigation">
          {navItems.map((item) => (
            <Link
              aria-current={pathname === item.href ? "page" : undefined}
              className="nav-link"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <span className="language-switch" aria-label="Sprache">
            <Languages aria-hidden="true" />
            DE
          </span>
          <a className="contact-pill header-phone" href={company.phoneHref}>
            <Phone aria-hidden="true" />
            {company.phone}
          </a>
          <LuxuryButton className="header-cta" href="/kontakt" variant="primary">
            Kostenlos anfragen
          </LuxuryButton>
          <button
            className="menu-button"
            type="button"
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="mobile-panel" aria-label="Mobile Navigation">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <a href={company.phoneHref} onClick={() => setOpen(false)}>
            Direkt anrufen
          </a>
        </nav>
      ) : null}

      <span className="header-progress" aria-hidden="true" />
    </header>
  );
}
