const asText = (value) => (typeof value === "string" ? value.trim() : "");

const imageUrl = (value) => {
  if (typeof value === "string") return value;
  return value?.url || "";
};

const keywords = (value) => (Array.isArray(value) ? value : asText(value).split(","))
  .map((item) => asText(item))
  .filter(Boolean);

export const createSeoMetadata = ({
  seo = {},
  title,
  description,
  canonical,
  image,
  type = "website",
}) => {
  const resolvedTitle = asText(seo?.title) || title;
  const resolvedDescription = asText(seo?.description) || description;
  const resolvedCanonical = asText(seo?.canonicalUrl) || canonical;
  const resolvedImage = imageUrl(seo?.ogImage) || imageUrl(image);
  const resolvedKeywords = keywords(seo?.keywords);
  const openGraphType = asText(seo?.ogType) === "article" || type === "article" ? "article" : "website";

  return {
    title: { absolute: resolvedTitle },
    description: resolvedDescription,
    ...(resolvedKeywords.length ? { keywords: resolvedKeywords } : {}),
    ...(asText(seo?.robots) ? { robots: seo.robots } : {}),
    alternates: { canonical: resolvedCanonical },
    openGraph: {
      title: asText(seo?.ogTitle) || resolvedTitle,
      description: asText(seo?.ogDescription) || resolvedDescription,
      url: resolvedCanonical,
      type: openGraphType,
      ...(resolvedImage ? { images: [{ url: resolvedImage, alt: resolvedTitle }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: asText(seo?.twitterTitle) || resolvedTitle,
      description: asText(seo?.twitterDescription) || resolvedDescription,
      ...(imageUrl(seo?.twitterImage) || resolvedImage
        ? { images: [imageUrl(seo?.twitterImage) || resolvedImage] }
        : {}),
    },
  };
};
