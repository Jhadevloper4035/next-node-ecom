export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/checkout", "/my-account", "/shopping-cart"],
    },
    sitemap: "https://curve-comfort.com/sitemap.xml",
  };
}
