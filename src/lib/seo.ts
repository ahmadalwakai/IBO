import type { Metadata } from "next";
import { createElement } from "react";
import {
  cities as fallbackCities,
  company as fallbackCompany,
  faqs as fallbackFaqs,
  services as fallbackServices,
  testimonials as fallbackTestimonials,
} from "@/data/site";
import type { CmsContent } from "./cms-types";

export const baseUrl = fallbackCompany.url;

export function absoluteUrl(path = "/", base = baseUrl) {
  return new URL(path, base).toString();
}

export function createMetadata({
  title,
  description,
  path = "/",
  image = "/images/ibo-hero.png",
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
}): Metadata {
  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: fallbackCompany.name,
      locale: "de_DE",
      type: "website",
      images: [
        {
          url: absoluteUrl(image),
          width: 1600,
          height: 900,
          alt: `${fallbackCompany.name} - hochwertige Malerarbeiten und Bodenverlegung`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(image)],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function organizationSchema(content?: CmsContent) {
  const company = content?.company ?? fallbackCompany;
  const cities = content?.cities ?? fallbackCities;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: company.legalName,
    image: absoluteUrl(content?.settings.heroImage ?? "/images/ibo-hero.png", company.url),
    url: company.url,
    telephone: company.phone,
    email: company.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kranichstraße 22",
      postalCode: "47441",
      addressLocality: "Moers",
      addressCountry: "DE",
    },
    areaServed: cities.map((city) => city.name),
    priceRange: "$$",
    sameAs: [],
  };
}

export function serviceSchema(slug: string, content?: CmsContent) {
  const company = content?.company ?? fallbackCompany;
  const cities = content?.cities ?? fallbackCities;
  const services = content?.services ?? fallbackServices;
  const service = services.find((item) => item.slug === slug);
  if (!service) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.seoDescription,
    provider: {
      "@type": "LocalBusiness",
      name: company.legalName,
      telephone: company.phone,
      address: company.address,
    },
    areaServed: cities.map((city) => city.name),
    url: absoluteUrl(`/leistungen/${service.slug}`, company.url),
  };
}

export function faqSchema(content?: CmsContent) {
  const faqs = content?.faqs ?? fallbackFaqs;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function reviewSchema(content?: CmsContent) {
  const company = content?.company ?? fallbackCompany;
  const testimonials = content?.testimonials ?? fallbackTestimonials;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: company.legalName,
    url: company.url,
    telephone: company.phone,
    review: testimonials.map((testimonial, index) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: testimonial.name,
      },
      reviewBody: testimonial.quote,
      reviewRating: {
        "@type": "Rating",
        ratingValue: index === 1 ? "4.9" : "5",
        bestRating: "5",
      },
    })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      reviewCount: testimonials.length.toString(),
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[], content?: CmsContent) {
  const company = content?.company ?? fallbackCompany;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, company.url),
    })),
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  });
}
