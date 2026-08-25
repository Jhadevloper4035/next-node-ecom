import { getCategorySitemap, getPageSeoSitemap, getProductSitemap } from "@/lib/catalog";
import { getBlogSitemap } from "@/lib/blogs";

const siteUrl = "https://curve-comfort.com";

export default async function sitemap() {
  const [pages, categories, products, blogs] = await Promise.all([
    getPageSeoSitemap(),
    getCategorySitemap(),
    getProductSitemap(),
    getBlogSitemap(),
  ]);
  const categoryById = new Map(categories.map((category) => [String(category._id), category]));
  const categoryRoutes = categories.flatMap((category) => {
    if (!category.parent) return [{ path: `/collections/${category.slug}`, updatedAt: category.updatedAt }];
    const parent = categoryById.get(String(category.parent));
    return parent && !parent.parent
      ? [{ path: `/collections/${parent.slug}/${category.slug}`, updatedAt: category.updatedAt }]
      : [];
  });
  const dynamicRoutes = [
    ...categoryRoutes,
    ...products.map((product) => ({ path: `/product/${product.slug}`, updatedAt: product.updatedAt })),
    ...blogs.map((blog) => ({ path: `/blogs/${blog.url}`, updatedAt: blog.updated_at })),
  ];
  const seen = new Set();

  return [...pages.map((page) => ({ url: page.canonicalUrl, updatedAt: page.updatedAt, priority: page.priority })), ...dynamicRoutes]
    .filter(({ path, url }) => {
      const key = url || path;
      return key && !seen.has(key) && seen.add(key);
    })
    .map(({ path, url, updatedAt, priority }) => ({
      url: url || `${siteUrl}${path}`,
      lastModified: updatedAt || new Date(),
      ...(typeof priority === "number" ? { priority } : {}),
    }));
}
