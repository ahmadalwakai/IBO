import { HomeExperience } from "@/sections/home/home-experience";
import { JsonLd, faqSchema, reviewSchema } from "@/lib/seo";
import { getCmsContent } from "@/lib/cms-store";

export default async function Home() {
  const content = await getCmsContent();

  return (
    <>
      <JsonLd data={faqSchema(content)} />
      <JsonLd data={reviewSchema(content)} />
      <HomeExperience content={content} />
    </>
  );
}
