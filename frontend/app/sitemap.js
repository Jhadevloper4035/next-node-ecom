const siteUrl = "https://curve-comfort.com";

const routes = [
  "/",
  "/all-products",
  "/about-us",
  "/contact",
  "/blog-default",
  "/FAQs",
  "/privacy-policy",
  "/term-of-use",
  "/refund-policy",
  "/collections/sofas",
  "/collections/beds",
  "/collections/chairs-and-ottomans",
  "/collections/coffee-tables",
  "/collections/console-tables",
  "/collections/nester-tables",
  "/collections/wall-decor",
  "/collections/kitchen",
  "/collections/wardrobe",
];

export default function sitemap() {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));
}
