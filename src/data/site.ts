import type { LucideIcon } from "lucide-react";
import {
  BugOff,
  Building2,
  Calculator,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Construction,
  Gem,
  Hammer,
  Layers3,
  MessageCircle,
  PaintRoller,
  Palette,
  PanelTop,
  Ruler,
  ScanLine,
  ShieldCheck,
  SprayCan,
  Wallpaper,
  WandSparkles,
} from "lucide-react";

export const company = {
  name: "IBO Creative",
  legalName: "IBO Creative Maler & Bodenleger",
  tagline: "Maler & Bodenleger aus Moers",
  address: "Kranichstraße 22, 47441 Moers",
  phone: "0176 - 832 925 75",
  phoneHref: "tel:+4917683292575",
  email: "info@ibo-creative.de",
  emailHref: "mailto:info@ibo-creative.de",
  url: "https://raumwerkpro.de",
  area: "Moers, Rheinberg, Duisburg und Rheinhausen",
  whatsapp: "+4917683292575",
};

export const siteSettings = {
  whatsappFloating: true,
  chatEnabled: true,
  quoteEnabled: true,
  chatGreeting: "Hallo! Wie können wir bei Ihrem Projekt helfen?",
  beforeAfterEnabled: true,
  heroImage: "/images/ibo-hero.png",
};

export const navItems = [
  { label: "Startseite", href: "/" },
  { label: "Leistungen", href: "/leistungen" },
  { label: "Über uns", href: "/ueber-uns" },
  { label: "Projekte", href: "/projekte" },
  { label: "Einsatzgebiete", href: "/einsatzgebiete" },
  { label: "Kontakt", href: "/kontakt" },
];

export type Service = {
  slug: string;
  title: string;
  eyebrow: string;
  short: string;
  summary: string;
  image: string;
  icon: LucideIcon;
  highlights: string[];
  seoTitle: string;
  seoDescription: string;
};

export const services: Service[] = [
  {
    slug: "malerarbeiten",
    title: "Malerarbeiten",
    eyebrow: "Innen & außen",
    short: "Präzise Anstriche für Räume, Fassaden und anspruchsvolle Details.",
    summary:
      "Wir planen und realisieren hochwertige Malerarbeiten mit sauberem Kantenschnitt, langlebigen Beschichtungen und einer ruhigen, strukturierten Ausführung.",
    image: "/images/service-painting.png",
    icon: PaintRoller,
    highlights: ["Innenanstriche", "Fassadenanstriche", "Spachtelarbeiten", "Farbberatung"],
    seoTitle: "Malerarbeiten in Moers | IBO Creative",
    seoDescription:
      "Hochwertige Malerarbeiten in Moers und Umgebung: Innenanstriche, Fassaden, Spachtelarbeiten und saubere Ausführung vom Fachbetrieb.",
  },
  {
    slug: "tapezierarbeiten",
    title: "Tapezierarbeiten",
    eyebrow: "Struktur & Muster",
    short: "Tapeten sauber verarbeitet, präzise ausgerichtet und stilsicher kombiniert.",
    summary:
      "Von Vliestapete bis Akzentwand: Wir sorgen für exakte Übergänge, saubere Untergründe und ein harmonisches Gesamtbild.",
    image: "/images/service-walls.png",
    icon: Wallpaper,
    highlights: ["Vliestapeten", "Mustertapeten", "Akzentwände", "Untergrundvorbereitung"],
    seoTitle: "Tapezierarbeiten in Moers | Tapeten vom Fachbetrieb",
    seoDescription:
      "Professionelle Tapezierarbeiten in Moers: Vliestapeten, Mustertapeten und Akzentwände mit sauberer Vorbereitung und präziser Ausführung.",
  },
  {
    slug: "dekorative-waende",
    title: "Dekorative Wände",
    eyebrow: "Oberflächen mit Tiefe",
    short: "Mineralische, matte oder strukturierte Wandflächen mit architektonischer Wirkung.",
    summary:
      "Dekorative Wandgestaltungen geben Räumen Charakter. Wir entwickeln Oberflächen, die hochwertig wirken und langfristig zum Objekt passen.",
    image: "/images/service-walls.png",
    icon: WandSparkles,
    highlights: ["Kalk- & Mineraloptik", "Strukturtechniken", "Akzentflächen", "Farbkonzepte"],
    seoTitle: "Dekorative Wände in Moers | Edle Wandgestaltung",
    seoDescription:
      "Dekorative Wandgestaltung in Moers: strukturierte Oberflächen, Akzentflächen und hochwertige Farbkonzepte für private und gewerbliche Räume.",
  },
  {
    slug: "bodenverlegung",
    title: "Bodenverlegung",
    eyebrow: "Ruhige Flächen",
    short: "Böden mit sauberem Aufbau, exakten Übergängen und langlebigem Finish.",
    summary:
      "Wir verlegen Böden so, dass sie optisch ruhig wirken und im Alltag belastbar bleiben: vom Untergrund bis zur Sockelleiste.",
    image: "/images/service-flooring.png",
    icon: Layers3,
    highlights: ["Untergrundprüfung", "Saubere Übergänge", "Sockelleisten", "Wohn- & Gewerbeflächen"],
    seoTitle: "Bodenverlegung in Moers | Vinyl, Laminat und PVC",
    seoDescription:
      "Bodenverlegung in Moers und Umgebung: Vinyl, Laminat, PVC, Untergrundvorbereitung, Übergänge und Sockelleisten aus einer Hand.",
  },
  {
    slug: "vinylboden",
    title: "Vinylboden",
    eyebrow: "Robust & elegant",
    short: "Pflegeleichte Vinylböden für moderne Wohn- und Geschäftsbereiche.",
    summary:
      "Vinylboden verbindet angenehme Haptik mit hoher Alltagstauglichkeit. Wir beraten zu Dekor, Aufbauhöhe und Nutzungsklasse.",
    image: "/images/service-flooring.png",
    icon: PanelTop,
    highlights: ["Designvinyl", "Klick- & Klebevinyl", "Feuchtraumgeeignet", "Nutzungsklassen"],
    seoTitle: "Vinylboden verlegen in Moers | IBO Creative",
    seoDescription:
      "Vinylboden in Moers fachgerecht verlegen lassen: Designvinyl, Klickvinyl, Klebevinyl und saubere Übergänge für langlebige Räume.",
  },
  {
    slug: "laminatboden",
    title: "Laminatboden",
    eyebrow: "Klarer Aufbau",
    short: "Laminat mit präzisem Zuschnitt, ruhigem Fugenbild und sauberer Kante.",
    summary:
      "Für Laminatböden achten wir auf Trittschall, Dehnfugen und ein stimmiges Fugenbild, damit die Fläche hochwertig wirkt.",
    image: "/images/service-flooring.png",
    icon: Ruler,
    highlights: ["Trittschall", "Exakter Zuschnitt", "Sockelleisten", "Übergangsprofile"],
    seoTitle: "Laminat verlegen in Moers | Sauber und präzise",
    seoDescription:
      "Laminatboden in Moers verlegen lassen: präziser Zuschnitt, Trittschall, Übergangsprofile und saubere Sockelleisten vom Fachbetrieb.",
  },
  {
    slug: "pvc-boden",
    title: "PVC-Boden",
    eyebrow: "Funktional & gepflegt",
    short: "Belastbare PVC-Flächen für Arbeitsbereiche, Mietobjekte und Nebenräume.",
    summary:
      "PVC-Böden sind wirtschaftlich, pflegeleicht und vielseitig. Wir sorgen für die passende Vorbereitung und saubere Nahtführung.",
    image: "/images/service-flooring.png",
    icon: Construction,
    highlights: ["Rollenware", "Nahtführung", "Gewerbeflächen", "Pflegeleichte Räume"],
    seoTitle: "PVC-Boden verlegen in Moers | Fachgerechte Ausführung",
    seoDescription:
      "PVC-Boden in Moers fachgerecht verlegen: robuste Bodenflächen für Wohnungen, Gewerbe, Nebenräume und Mietobjekte.",
  },
  {
    slug: "graffitientfernung",
    title: "Graffitientfernung",
    eyebrow: "Oberflächen retten",
    short: "Schonende Entfernung von Graffiti und Verschmutzungen auf Fassaden.",
    summary:
      "Wir entfernen Graffiti materialbewusst und bereiten Flächen so auf, dass Fassaden wieder gepflegt und repräsentativ wirken.",
    image: "/images/service-restoration.png",
    icon: SprayCan,
    highlights: ["Fassaden", "Mauerwerk", "Schutzbeschichtung", "Schnelle Termine"],
    seoTitle: "Graffitientfernung in Moers | Fassaden reinigen lassen",
    seoDescription:
      "Graffitientfernung in Moers und Umgebung: materialschonende Reinigung, Fassadenpflege und Schutzbeschichtungen vom Fachbetrieb.",
  },
  {
    slug: "schimmelbeseitigung",
    title: "Schimmelbeseitigung",
    eyebrow: "Sauber sanieren",
    short: "Schimmelstellen fachgerecht behandeln und Oberflächen dauerhaft erneuern.",
    summary:
      "Wir prüfen betroffene Bereiche, entfernen belastete Oberflächen und stellen Wandflächen mit geeigneten Systemen wieder her.",
    image: "/images/service-restoration.png",
    icon: BugOff,
    highlights: ["Analyse vor Ort", "Oberflächenbehandlung", "Sanierfarbe", "Vorbeugende Beratung"],
    seoTitle: "Schimmelbeseitigung in Moers | Saubere Sanierung",
    seoDescription:
      "Schimmelbeseitigung in Moers: betroffene Oberflächen behandeln, Wandflächen erneuern und vorbeugende Empfehlungen erhalten.",
  },
];

export const stats = [
  { label: "Jahre Erfahrung", value: 10, suffix: "+" },
  { label: "Abgeschlossene Projekte", value: 500, suffix: "+" },
  { label: "Zufriedene Kunden", value: 100, suffix: "%" },
  { label: "Städte im Fokus", value: 4, suffix: "" },
];

export const trustItems = [
  { title: "Termintreu", text: "Verlässliche Planung und klare Absprachen.", icon: CalendarCheck },
  { title: "Saubere Arbeit", text: "Schutz, Ordnung und präzise Details.", icon: ShieldCheck },
  { title: "Hochwertige Materialien", text: "Systeme passend zu Raum und Nutzung.", icon: Gem },
];

export const processSteps = [
  { title: "Besichtigung", text: "Wir prüfen Räume, Untergründe und Details vor Ort.", icon: CalendarCheck },
  { title: "Beratung", text: "Farben, Materialien und Aufwand werden klar abgestimmt.", icon: MessageCircle },
  { title: "Angebot", text: "Sie erhalten ein transparentes, verständliches Angebot.", icon: Calculator },
  { title: "Planung", text: "Termine, Schutzmaßnahmen und Ablauf werden vorbereitet.", icon: ClipboardCheck },
  { title: "Ausführung", text: "Saubere Umsetzung mit Kontrolle bis zum Finish.", icon: PaintRoller },
];

export const projects = [
  {
    title: "Wohnung Moers-Mitte",
    category: "Malerarbeiten",
    image: "/images/ibo-hero.png",
    text: "Ruhiges Farbkonzept, matte Oberflächen und neue Bodenwirkung.",
  },
  {
    title: "Praxisräume Duisburg",
    category: "Bodenverlegung",
    image: "/images/service-flooring.png",
    text: "Strapazierfähiger Boden mit klaren Übergängen und hygienischer Anmutung.",
  },
  {
    title: "Altbau Rheinberg",
    category: "Dekorative Wände",
    image: "/images/service-walls.png",
    text: "Strukturierte Akzentflächen mit warmem Licht und feiner Tiefe.",
  },
  {
    title: "Fassade Rheinhausen",
    category: "Graffitientfernung",
    image: "/images/service-restoration.png",
    text: "Schonende Reinigung und gepflegte Wiederherstellung der Außenwirkung.",
  },
];

export const beforeAfter = {
  title: "Ein Raum gewinnt, wenn die Oberfläche stimmt.",
  text: "Ziehen Sie den Regler und erleben Sie den Unterschied zwischen unruhiger Bestandsfläche und einem klar abgestimmten Finish.",
  beforeLabel: "Vorher",
  afterLabel: "Nachher",
  afterImage: "/images/ibo-hero.png",
};

export const materials = [
  "Matte Innenfarben",
  "Mineralische Oberflächen",
  "Designvinyl",
  "Laminat",
  "PVC-Beläge",
  "Schutzbeschichtungen",
];

export type City = {
  slug: string;
  name: string;
  title: string;
  intro: string;
  localFocus: string[];
  seoTitle: string;
  seoDescription: string;
};

export const cities: City[] = [
  {
    slug: "moers",
    name: "Moers",
    title: "Maler & Bodenleger in Moers",
    intro:
      "In Moers verbinden wir kurze Wege mit genauer Vor-Ort-Beratung. Ob Wohnung, Hausflur, Praxis oder Ladenfläche: Wir planen Oberflächen so, dass sie zum Gebäude und zur Nutzung passen.",
    localFocus: ["Innenanstriche in Wohnquartieren", "Bodenverlegung für Miet- und Eigentumswohnungen", "Schnelle Termine im Stadtgebiet"],
    seoTitle: "Maler und Bodenleger in Moers | IBO Creative",
    seoDescription:
      "IBO Creative ist Ihr Maler und Bodenleger in Moers für hochwertige Anstriche, Tapeten, dekorative Wände und Bodenverlegung.",
  },
  {
    slug: "rheinberg",
    name: "Rheinberg",
    title: "Maler & Bodenleger in Rheinberg",
    intro:
      "Für Rheinberg realisieren wir ruhige, langlebige Raumkonzepte in Bestandsgebäuden und modernen Objekten. Besonders wichtig sind saubere Vorbereitung, klare Terminplanung und ein Finish, das im Alltag funktioniert.",
    localFocus: ["Renovierungen in Einfamilienhäusern", "Dekorative Wandflächen", "Vinyl und Laminat für Wohnbereiche"],
    seoTitle: "Maler und Bodenleger in Rheinberg | IBO Creative",
    seoDescription:
      "Malerarbeiten und Bodenverlegung in Rheinberg: saubere Renovierung, hochwertige Materialien und persönliche Beratung von IBO Creative.",
  },
  {
    slug: "duisburg",
    name: "Duisburg",
    title: "Maler & Bodenleger in Duisburg",
    intro:
      "In Duisburg unterstützen wir private und gewerbliche Kunden mit belastbaren Lösungen für stark genutzte Räume. Von Praxisflächen bis Treppenhaus zählt eine Ausführung, die optisch überzeugt und robust bleibt.",
    localFocus: ["Gewerbliche Innenflächen", "Robuste Bodenbeläge", "Graffitientfernung und Fassadenpflege"],
    seoTitle: "Maler und Bodenleger in Duisburg | IBO Creative",
    seoDescription:
      "IBO Creative führt Malerarbeiten, Bodenverlegung und Graffitientfernung in Duisburg aus: zuverlässig, sauber und hochwertig.",
  },
  {
    slug: "rheinhausen",
    name: "Rheinhausen",
    title: "Maler & Bodenleger in Rheinhausen",
    intro:
      "Für Rheinhausen bieten wir sorgfältige Renovierungen mit persönlicher Abstimmung. Wir achten auf Untergründe, Nutzung und Details, damit Wand und Boden als Einheit wirken.",
    localFocus: ["Wohnungsrenovierungen", "Tapeten und Akzentwände", "PVC- und Vinylböden für pflegeleichte Räume"],
    seoTitle: "Maler und Bodenleger in Rheinhausen | IBO Creative",
    seoDescription:
      "Maler und Bodenleger in Rheinhausen: IBO Creative übernimmt Anstriche, Tapeten, Bodenbeläge und saubere Renovierungen.",
  },
];

export const testimonials = [
  {
    name: "Familie K.",
    context: "Wohnung in Moers",
    quote:
      "Die Abstimmung war klar, die Baustelle sauber und das Ergebnis wirkt deutlich hochwertiger als erwartet.",
  },
  {
    name: "Praxis R.",
    context: "Gewerbefläche in Duisburg",
    quote:
      "Termine wurden gehalten, die Böden liegen sauber und die Räume waren schnell wieder nutzbar.",
  },
  {
    name: "M. Schneider",
    context: "Haus in Rheinberg",
    quote:
      "Sehr angenehme Beratung, präzise Kanten und ein Farbkonzept, das wirklich zum Haus passt.",
  },
];

export const faqs = [
  {
    question: "Bieten Sie eine kostenlose Besichtigung an?",
    answer:
      "Ja. Für Projekte in Moers, Rheinberg, Duisburg und Rheinhausen vereinbaren wir eine persönliche Besichtigung und prüfen Umfang, Untergrund und Terminrahmen.",
  },
  {
    question: "Übernehmen Sie Malerarbeiten und Bodenverlegung zusammen?",
    answer:
      "Ja. Viele Projekte setzen wir aus einer Hand um, damit Wandflächen, Böden, Sockelleisten und Übergänge sauber aufeinander abgestimmt sind.",
  },
  {
    question: "Wie schnell erhalte ich ein Angebot?",
    answer:
      "Nach der Besichtigung erstellen wir ein transparentes Angebot. Bei klaren Anforderungen geht das in der Regel zügig.",
  },
  {
    question: "Arbeiten Sie auch für Gewerbekunden?",
    answer:
      "Ja. Wir betreuen Wohnungen, Häuser, Praxen, Ladenflächen, Büros und kleinere Objektflächen.",
  },
  {
    question: "Welche Bodenbeläge verlegen Sie?",
    answer:
      "Wir verlegen unter anderem Vinyl, Laminat und PVC. Entscheidend sind Nutzung, Untergrund, Aufbauhöhe und gewünschte Optik.",
  },
];

export const whyChoose = [
  { title: "Architektonische Ruhe", text: "Farben, Kanten und Böden werden als ein Raumkonzept gedacht.", icon: Building2 },
  { title: "Präzise Vorbereitung", text: "Untergründe, Schutz und Materialwahl entscheiden über das Ergebnis.", icon: ScanLine },
  { title: "Handwerk mit Haltung", text: "Wir arbeiten sauber, verbindlich und mit Blick für Details.", icon: Hammer },
  { title: "Beratung auf Augenhöhe", text: "Sie erhalten klare Empfehlungen statt unübersichtlicher Optionen.", icon: Palette },
];

export const checklist = [
  { text: "Kostenlose Besichtigung", icon: Check },
  { text: "Persönliche Beratung", icon: Check },
  { text: "Transparente Angebote", icon: Check },
  { text: "Saubere Übergabe", icon: Check },
];

export const galleryFilters = ["Alle", "Malerarbeiten", "Bodenverlegung", "Wandgestaltung", "Fassade"];
