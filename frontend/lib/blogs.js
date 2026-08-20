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
  const response = await fetch(`${apiBaseUrl}/v1/blogs${path}`, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

export async function getBlogs() {
  return (await request("?limit=100"))?.data || [];
}

export async function getBlog(url) {
  return (await request(`/${encodeURIComponent(url)}`))?.data || null;
}
