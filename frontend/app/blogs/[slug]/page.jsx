import BlogDetail1 from "@/components/blogs/BlogDetail1";
import RelatedBlogs from "@/components/blogs/RelatedBlogs";
import Footer1 from "@/components/footers/Footer1";
import { getBlog, getBlogs, getBlogTaxonomies } from "@/lib/blogs";
import { createSeoMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import React from "react";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) return {};
  return createSeoMetadata({
    seo: blog.seo,
    title: blog.meta_title || blog.title,
    description: blog.meta_description || "Read the latest ideas from Curve & Comfort.",
    canonical: `/blogs/${blog.url}`,
    image: blog.image,
    type: "article",
  });
}

export default async function BlogDetailsPage1({ params }) {
  const { slug } = await params;
  const [blog, posts, taxonomies] = await Promise.all([getBlog(slug), getBlogs(), getBlogTaxonomies()]);
  if (!blog) notFound();
  return (
    <>
      {/* <Topbar6 bgColor="bg-main" /> */}
      <BlogDetail1 blog={blog} posts={posts} taxonomies={taxonomies} />
      <RelatedBlogs posts={posts} currentUrl={blog.url} />
      <Footer1 />
    </>
  );
}
