import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { cities, company, services } = await getCmsContent();
  const now = new Date();
  const staticRoutes = [
    "/",
    "/leistungen",
    "/projekte",
    "/galerie",
    "/einsatzgebiete",
    "/ueber-uns",
    "/kundenstimmen",
    "/faq",
    "/kontakt",
    "/datenschutz",
    "/impressum",
  ];

  const serviceRoutes = services.map((service) => `/leistungen/${service.slug}`);
  const cityRoutes = cities.map((city) => `/einsatzgebiete/${city.slug}`);

  return [...staticRoutes, ...serviceRoutes, ...cityRoutes].map((route) => ({
    url: absoluteUrl(route, company.url),
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.includes("/leistungen") ? 0.85 : 0.7,
  }));
}
