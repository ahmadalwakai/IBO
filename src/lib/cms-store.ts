import "server-only";

import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { ChatMessage, CmsContent, QuoteLead } from "./cms-types";
import { readJsonFile, usesBlobJsonStorage, writeJsonFile } from "./json-storage";

const root = process.cwd();
const cmsDir = path.join(root, "cms");
const contentFile = path.join(cmsDir, "content.json");
const quotesFile = path.join(cmsDir, "quotes.json");
const messagesFile = path.join(cmsDir, "messages.json");
const siteDataFile = path.join(root, "src", "data", "site.ts");

const iconImports = [
  "BadgeCheck",
  "BugOff",
  "Building2",
  "Calculator",
  "CalendarCheck",
  "Check",
  "ClipboardCheck",
  "Construction",
  "Gem",
  "Hammer",
  "Layers3",
  "MessageCircle",
  "PaintRoller",
  "Palette",
  "PanelTop",
  "Ruler",
  "ScanLine",
  "ShieldCheck",
  "Sparkles",
  "SprayCan",
  "Wallpaper",
  "WandSparkles",
];

function asIdentifier(iconName: string) {
  return iconImports.includes(iconName) ? iconName : "Sparkles";
}

function print(value: unknown) {
  return JSON.stringify(value, null, 2).replace(/"__ICON__([A-Za-z0-9_]+)__"/g, "$1");
}

function withIcons<T extends { iconName?: string }>(items: T[]) {
  return items.map(({ iconName, ...item }) => ({
    ...item,
    icon: `__ICON__${asIdentifier(iconName ?? "Sparkles")}__`,
  }));
}

function renderSiteData(content: CmsContent) {
  return `import type { LucideIcon } from "lucide-react";
import {
  ${iconImports.join(",\n  ")},
} from "lucide-react";

export const company = ${print(content.company)};

export const siteSettings = ${print(content.settings)};

export const navItems = ${print(content.navItems)};

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

export const services: Service[] = ${print(withIcons(content.services))};

export const stats = ${print(content.stats)};

export const trustItems = ${print(withIcons(content.trustItems))};

export const processSteps = ${print(withIcons(content.processSteps))};

export const projects = ${print(content.projects)};

export const beforeAfter = ${print(content.beforeAfter)};

export const materials = ${print(content.materials)};

export type City = {
  slug: string;
  name: string;
  title: string;
  intro: string;
  localFocus: string[];
  seoTitle: string;
  seoDescription: string;
};

export const cities: City[] = ${print(content.cities)};

export const testimonials = ${print(content.testimonials)};

export const faqs = ${print(content.faqs)};

export const whyChoose = ${print(withIcons(content.whyChoose))};

export const checklist = ${print(withIcons(content.checklist))};

export const galleryFilters = ${print(content.galleryFilters)};
`;
}

export async function getCmsContent() {
  return readJsonFile<CmsContent>(contentFile);
}

export async function saveCmsContent(content: CmsContent) {
  await writeJsonFile(contentFile, content);
  if (!usesBlobJsonStorage()) {
    await writeFile(siteDataFile, renderSiteData(content), "utf8");
  }
  return content;
}

export async function getQuotes() {
  return readJsonFile<{ quotes: QuoteLead[] }>(quotesFile);
}

export async function saveQuotes(quotes: QuoteLead[]) {
  return writeJsonFile(quotesFile, { quotes });
}

export async function getMessages() {
  return readJsonFile<{ messages: ChatMessage[] }>(messagesFile);
}

export async function saveMessages(messages: ChatMessage[]) {
  return writeJsonFile(messagesFile, { messages });
}

export function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
