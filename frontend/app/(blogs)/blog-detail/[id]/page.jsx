import BlogDetail1 from "@/components/blogs/BlogDetail1";
import RelatedBlogs from "@/components/blogs/RelatedBlogs";

import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import { getBlog } from "@/lib/blogs";
import { notFound } from "next/navigation";
import React from "react";

export async function generateMetadata({ params }) {
  const blog = await getBlog((await params).id);
  if (!blog) return {};
  const seo = blog.seo || {};
  return { title: seo.title || blog.meta_title || blog.title, description: seo.description || blog.meta_description, keywords: seo.keywords, alternates: seo.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined, openGraph: { title: seo.ogTitle || blog.title, description: seo.ogDescription || blog.meta_description, images: seo.ogImage?.url ? [seo.ogImage.url] : undefined } };
}

export default async function BlogDetailsPage1({ params }) {
  const { id } = await params;
  const blog = await getBlog(id);
  if (!blog) notFound();
  return (
    <>
      {/* <Topbar6 bgColor="bg-main" /> */}
      <BlogDetail1 blog={blog} />
      <RelatedBlogs />
      <Footer1 />
    </>
  );
}
