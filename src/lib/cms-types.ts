export type IconName =
  | "BadgeCheck"
  | "BugOff"
  | "Building2"
  | "Calculator"
  | "CalendarCheck"
  | "Check"
  | "ClipboardCheck"
  | "Construction"
  | "Gem"
  | "Hammer"
  | "Layers3"
  | "MessageCircle"
  | "PaintRoller"
  | "Palette"
  | "PanelTop"
  | "Ruler"
  | "ScanLine"
  | "ShieldCheck"
  | "Sparkles"
  | "SprayCan"
  | "Wallpaper"
  | "WandSparkles";

export type CmsIconItem = {
  iconName: IconName | string;
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

export type CmsContent = {
  company: CmsCompany;
  settings: {
    whatsappFloating: boolean;
    chatEnabled: boolean;
    quoteEnabled: boolean;
    chatGreeting: string;
    beforeAfterEnabled: boolean;
    heroImage: string;
  };
  navItems: { label: string; href: string }[];
  services: Array<{
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
  }>;
  stats: { label: string; value: number; suffix: string }[];
  trustItems: Array<{ title: string; text: string; iconName: string }>;
  processSteps: Array<{ title: string; text: string; iconName: string }>;
  projects: Array<{ title: string; category: string; image: string; text: string }>;
  beforeAfter: {
    title: string;
    text: string;
    beforeLabel: string;
    afterLabel: string;
    afterImage: string;
  };
  materials: string[];
  cities: Array<{
    slug: string;
    name: string;
    title: string;
    intro: string;
    localFocus: string[];
    seoTitle: string;
    seoDescription: string;
  }>;
  testimonials: Array<{ name: string; context: string; quote: string }>;
  faqs: Array<{ question: string; answer: string }>;
  whyChoose: Array<{ title: string; text: string; iconName: string }>;
  checklist: Array<{ text: string; iconName: string }>;
  galleryFilters: string[];
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

export type ChatMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "done";
  createdAt: string;
  replies?: ChatReply[];
};

export type ChatReply = {
  id: string;
  author: "admin" | "visitor";
  message: string;
  createdAt: string;
};
