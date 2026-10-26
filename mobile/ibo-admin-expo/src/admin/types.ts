/* Shapes of the website CMS and admin API responses. */


export type CmsContent = {
  company: CmsCompany;
  settings: SiteSettings;
  navItems: NavItem[];
  services: ServiceItem[];
  stats: StatItem[];
  trustItems: IconTextItem[];
  processSteps: IconTextItem[];
  projects: ProjectCard[];
  beforeAfter: BeforeAfter;
  materials: string[];
  cities: CityItem[];
  testimonials: TestimonialItem[];
  faqs: FAQItem[];
  whyChoose: IconTextItem[];
  checklist: ChecklistItem[];
  galleryFilters: string[];
};

export type CmsCompany = {
  name: string;
  legalName: string;
  tagline: string;
  address: string;
  phone: string;
  phoneHref: string;
  email: string;
  emailHref: string;
  url: string;
  area: string;
  whatsapp: string;
};

export type SiteSettings = {
  whatsappFloating: boolean;
  chatEnabled: boolean;
  quoteEnabled: boolean;
  chatGreeting: string;
  beforeAfterEnabled: boolean;
  heroImage: string;
};

export type NavItem = { label: string; href: string };
export type StatItem = { label: string; value: number; suffix: string };
export type IconTextItem = { title: string; text: string; iconName: string };
export type CityItem = {
  slug: string;
  name: string;
  title: string;
  intro: string;
  localFocus: string[];
  seoTitle: string;
  seoDescription: string;
};
export type TestimonialItem = { name: string; context: string; quote: string };
export type FAQItem = { question: string; answer: string };
export type ChecklistItem = { text: string; iconName: string };

export type ServiceItem = {
  slug: string;
  title: string;
  eyebrow: string;
  short: string;
  summary: string;
  image: string;
  iconName: string;
  highlights: string[];
  seoTitle: string;
  seoDescription: string;
};

export type ProjectCard = {
  title: string;
  category: string;
  image: string;
  text: string;
};

export type BeforeAfter = {
  title: string;
  text: string;
  beforeLabel: string;
  afterLabel: string;
  afterImage: string;
};

export type QuoteLead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: "new" | "read" | "done";
  createdAt: string;
};

export type ChatReply = {
  id: string;
  author: "admin" | "visitor";
  message: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "done";
  createdAt: string;
  replies?: ChatReply[];
};

export type AdminInfo = {
  email: string;
  createdAt: string;
};

export type Language = "de" | "ar";
