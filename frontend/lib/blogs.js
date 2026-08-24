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
    const response = await fetch(`${apiBaseUrl}/v1/blogs${path}`, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function getBlogs({ category, tag } = {}) {
  const params = new URLSearchParams({ limit: "100" });
  if (category) params.set("category", category);
  if (tag) params.set("tag", tag);
  return (await request(`?${params}`))?.data || [];
}

export async function getBlog(url) {
  return (await request(`/${encodeURIComponent(url)}`))?.data || null;
}

export function getBlogExcerpt(blog, words = 18) {
  const text = (blog.meta_description || blog.text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.split(" ").slice(0, words).join(" ");
}
