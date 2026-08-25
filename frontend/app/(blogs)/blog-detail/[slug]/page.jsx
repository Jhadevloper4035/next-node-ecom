import { permanentRedirect } from "next/navigation";

export default async function LegacyBlogDetailPage({ params }) {
  const { slug } = await params;
  permanentRedirect(`/blogs/${slug}`);
}
