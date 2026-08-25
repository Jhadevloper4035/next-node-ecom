import { getPageSeo } from "@/lib/catalog";
import { createSeoMetadata } from "@/lib/seo";

export async function getPageSeoMetadata(pageSlug, fallback) {
  return createSeoMetadata({ ...fallback, seo: await getPageSeo(pageSlug) });
}
