import type { MetadataRoute } from "next";
import { getCmsContent } from "@/lib/cms-store";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { company } = await getCmsContent();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${company.url}/sitemap.xml`,
  };
}
