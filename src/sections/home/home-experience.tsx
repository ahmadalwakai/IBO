"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  MapPinned,
  MousePointer2,
  Quote,
  Sparkles,
} from "lucide-react";
import type { CmsContent } from "@/lib/cms-types";
import { CmsIcon } from "@/lib/cms-icons";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { Reveal } from "@/components/motion/reveal";
import { LuxuryButton } from "@/components/ui/luxury-button";
import { SectionHeading } from "@/components/ui/section-heading";
import { ContactForm } from "@/components/contact-form";

export function HomeExperience({ content }: { content: CmsContent }) {
  const [afterWidth, setAfterWidth] = useState(58);
  const [openFaq, setOpenFaq] = useState(0);
  const {
    beforeAfter,
    cities,
    company,
    faqs,
    materials,
    processSteps,
    projects,
    services,
    settings: siteSettings,
    stats,
    testimonials,
    trustItems,
    whyChoose,
  } = content;
  const featuredServices = services.slice(0, 8);

  return (
    <main className="site-main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-bg" aria-hidden="true">
          <Image src={siteSettings.heroImage} alt="" fill priority sizes="100vw" />
        </div>
        <div className="hero-overlay" aria-hidden="true" />
        <motion.div
          className="hero-geometry"
          aria-hidden="true"
          animate={{ opacity: [0.55, 0.78, 0.55] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container hero-grid">
          <div className="hero-copy">
            <motion.span
              className="eyebrow"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              {company.tagline}
            </motion.span>
            <motion.h1
              id="hero-title"
              className="display"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            >
              Räume mit Haltung.{" "}
              <span className="accent-text">
                Oberflächen<span className="mobile-break" /> mit Ruhe.
              </span>
            </motion.h1>
            <motion.p
              className="lede"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.72 }}
            >
              IBO Creative gestaltet Wand- und Bodenflächen für Menschen, die klare
              Beratung, saubere Ausführung und ein hochwertiges Ergebnis erwarten.
            </motion.p>
            <motion.div
              className="hero-actions"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.65 }}
            >
              <LuxuryButton href="/kontakt" variant="primary">
                Kostenlose Besichtigung
              </LuxuryButton>
              <LuxuryButton href="/projekte">Projekte ansehen</LuxuryButton>
            </motion.div>
          </div>

          <div className="floating-trust">
            {trustItems.map((item, index) => (
                <motion.div
                  className="trust-chip"
                  key={item.title}
                  initial={false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.44 + index * 0.12, duration: 0.55 }}
                >
                  <CmsIcon iconName={item.iconName} aria-hidden="true" />
                  <span>
                    <strong>{item.title}</strong>
                    {item.text}
                  </span>
                </motion.div>
            ))}
          </div>
        </div>

        <div className="scroll-indicator" aria-hidden="true">
          <span>Weiter</span>
          <span className="scroll-line" />
        </div>
      </section>

      <section className="section section-band" aria-labelledby="stats-title">
        <div className="container">
          <h2 id="stats-title" className="sr-only">
            Kennzahlen
          </h2>
          <div className="stats-strip">
            {stats.map((item) => (
              <Reveal className="stat-item" key={item.label}>
                <AnimatedCounter value={item.value} suffix={item.suffix} />
                <span>{item.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="leistungen">
        <div className="container">
          <SectionHeading
            eyebrow="Leistungen"
            title={
              <>
                Handwerkliche Präzision für <span className="accent-text">Wand und Boden.</span>
              </>
            }
            text="Vom ersten Farbton bis zur letzten Sockelleiste entsteht ein stimmiges Ergebnis aus Beratung, Material und sauberer Ausführung."
            action={{ label: "Alle Leistungen", href: "/leistungen" }}
            split
          />
          <div className="service-grid">
            {featuredServices.map((service, index) => (
                <Reveal delay={index * 0.04} key={service.slug}>
                  <Link className="service-card" href={`/leistungen/${service.slug}`}>
                    <span className="service-card-media" aria-hidden="true">
                      <Image
                        src={service.image}
                        alt=""
                        fill
                        sizes="(min-width: 1180px) 25vw, (min-width: 640px) 50vw, 100vw"
                      />
                      <span className="service-card-shade" />
                    </span>
                    <span className="service-card-content">
                      <span className="icon-disc">
                        <CmsIcon iconName={service.iconName} aria-hidden="true" />
                      </span>
                      <span className="eyebrow">{service.eyebrow}</span>
                      <h3>{service.title}</h3>
                      <p>{service.short}</p>
                      <span className="service-link">
                        Details <ArrowRight aria-hidden="true" />
                      </span>
                    </span>
                  </Link>
                </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-band">
        <div className="container">
          <SectionHeading
            eyebrow="Warum IBO Creative"
            title="Ruhige Abläufe. Saubere Flächen. Klare Entscheidungen."
            text="Premium wirkt nicht laut. Es zeigt sich in Vorbereitung, Kanten, Übergängen und der Art, wie ein Projekt geführt wird."
          />
          <div className="why-grid">
            {whyChoose.map((item, index) => (
                <Reveal className="why-item" delay={index * 0.05} key={item.title}>
                  <CmsIcon iconName={item.iconName} aria-hidden="true" />
                  <h3>{item.title}</h3>
                  <p className="muted">{item.text}</p>
                </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="projekte">
        <div className="container">
          <SectionHeading
            eyebrow="Projekte"
            title={
              <>
                Ausgewählte Arbeiten mit <span className="accent-text">sichtbarer Ruhe.</span>
              </>
            }
            text="Jedes Projekt ist anders. Die Linie bleibt gleich: präzise Untergründe, stimmige Materialien und ein Ergebnis, das lange hochwertig wirkt."
            action={{ label: "Galerie öffnen", href: "/galerie" }}
            split
          />
          <div className="project-grid">
            {projects.map((project, index) => (
              <Reveal delay={index * 0.05} key={project.title}>
                <Link className="project-card" href="/projekte">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(min-width: 900px) 50vw, 100vw"
                  />
                  <span className="project-card-shade" />
                  <span className="project-card-content">
                    <span className="eyebrow">{project.category}</span>
                    <h3>{project.title}</h3>
                    <p>{project.text}</p>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {siteSettings.beforeAfterEnabled ? (
        <section className="section section-band">
          <div className="container before-after">
            <Reveal>
              <div className="content-flow">
                <span className="eyebrow">Vorher / Nachher</span>
                <h2 className="headline">{beforeAfter.title}</h2>
                <p>{beforeAfter.text}</p>
                <label className="muted" htmlFor="comparison">
                  Ansicht steuern
                </label>
                <input
                  id="comparison"
                  className="comparison-range"
                  type="range"
                  min="18"
                  max="88"
                  value={afterWidth}
                  onChange={(event) => setAfterWidth(Number(event.target.value))}
                  aria-label="Vorher-Nachher-Regler"
                />
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div
                className="comparison-frame"
                style={{
                  "--after-width": `${afterWidth}%`,
                  "--after-image": `url("${beforeAfter.afterImage}")`,
                } as React.CSSProperties}
              >
                <div className="comparison-labels">
                  <span>{beforeAfter.beforeLabel}</span>
                  <span>{beforeAfter.afterLabel}</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Ablauf"
            title="Fünf Schritte bis zur sauberen Übergabe."
            text="Der Prozess bleibt übersichtlich, damit Termine, Material und Ergebnis kontrollierbar bleiben."
          />
          <div className="process-grid">
            {processSteps.map((step, index) => (
                <Reveal className="process-step" delay={index * 0.06} key={step.title}>
                  <span className="icon-disc">
                    <CmsIcon iconName={step.iconName} aria-hidden="true" />
                  </span>
                  <h3>{step.title}</h3>
                  <p className="muted">{step.text}</p>
                </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-band">
        <div className="container">
          <SectionHeading
            eyebrow="Materialien"
            title="Systeme, die zum Alltag passen."
            text="Wir empfehlen Materialien nach Nutzung, Licht, Untergrund und gewünschter Wirkung."
          />
          <div className="materials-grid">
            {materials.map((item, index) => (
              <Reveal className="material-pill" delay={index * 0.04} key={item}>
                <strong>{item}</strong>
                <Sparkles aria-hidden="true" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Einsatzgebiete"
            title="Lokal verwurzelt am Niederrhein."
            text="Kurze Wege, persönliche Beratung und realistische Planung für Moers und die umliegenden Städte."
            action={{ label: "Alle Städte", href: "/einsatzgebiete" }}
            split
          />
          <div className="city-grid four">
            {cities.map((city, index) => (
              <Reveal className="city-card" delay={index * 0.04} key={city.slug}>
                <MapPinned aria-hidden="true" />
                <h3>{city.name}</h3>
                <p className="muted">{city.intro}</p>
                <Link className="service-link" href={`/einsatzgebiete/${city.slug}`}>
                  Stadtseite <ArrowRight aria-hidden="true" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-band">
        <div className="container">
          <SectionHeading
            eyebrow="Kundenstimmen"
            title="Rückmeldungen aus echten Projekten."
          />
          <div className="testimonial-grid">
            {testimonials.map((testimonial, index) => (
              <Reveal className="testimonial-card" delay={index * 0.05} key={testimonial.name}>
                <Quote aria-hidden="true" />
                <blockquote>„{testimonial.quote}“</blockquote>
                <p>
                  <strong>{testimonial.name}</strong>
                  <br />
                  <span className="muted">{testimonial.context}</span>
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="FAQ" title="Antworten vor dem ersten Termin." />
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <Reveal className="faq-item" delay={index * 0.03} key={faq.question}>
                <button
                  className="faq-button"
                  type="button"
                  aria-expanded={openFaq === index}
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    aria-hidden="true"
                    style={{
                      transform: openFaq === index ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 180ms ease",
                    }}
                  />
                </button>
                {openFaq === index ? <div className="faq-panel">{faq.answer}</div> : null}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section cta-band">
        <div className="container cta-inner">
          <div className="content-flow">
            <span className="eyebrow">Projekt starten</span>
            <h2 className="headline">Lassen Sie uns aus Räumen eine klare Linie machen.</h2>
            <p className="lede">
              Beschreiben Sie kurz Ihr Vorhaben. Wir melden uns zur Terminabstimmung
              und prüfen die Details direkt vor Ort.
            </p>
          </div>
          <LuxuryButton href="/kontakt" variant="primary">
            Jetzt unverbindlich anfragen
          </LuxuryButton>
        </div>
      </section>

      <section className="section" id="kontakt">
        <div className="container contact-layout">
          <Reveal>
            <div className="content-flow">
              <span className="eyebrow">Kontakt</span>
              <h2 className="headline">Kostenlose Besichtigung vereinbaren.</h2>
              <p>
                Für eine belastbare Einschätzung sehen wir uns Untergrund, Raumwirkung
                und Details am liebsten persönlich an.
              </p>
              <div className="trust-row">
                <MousePointer2 aria-hidden="true" />
                <span className="muted">Antworten klar, Termine verbindlich, Ausführung sauber.</span>
              </div>
              <p>
                <a className="service-link" href={company.phoneHref}>
                  {company.phone} <ArrowRight aria-hidden="true" />
                </a>
                <br />
                <a className="service-link" href={company.emailHref}>
                  {company.email} <ArrowRight aria-hidden="true" />
                </a>
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="contact-panel">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
