const configuredApiBaseUrl =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL;

const apiBaseUrl = (configuredApiBaseUrl?.startsWith("http")
  ? configuredApiBaseUrl
  : "http://localhost:5000/api")
  .replace(/\/+$/, "")
  .replace(/\/v1$/, "");

async function request(path) {
  try {
    const response = await fetch(`${apiBaseUrl}/v1${path}`, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function getCategoryBySlug(slug) {
  return (await request(`/categories/slug/${encodeURIComponent(slug)}`))?.data || null;
}

export async function getCategorySitemap() {
  return (await request("/categories/sitemap"))?.data || [];
}

export async function getProductSitemap() {
  return (await request("/product/sitemap"))?.data || [];
}

export async function getPageSeo(pageSlug) {
  return (await request(`/seo/${encodeURIComponent(pageSlug)}`))?.data || null;
}

export async function getPageSeoSitemap() {
  return (await request("/seo/sitemap"))?.data || [];
}
