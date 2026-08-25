import BlogDetail2 from "@/components/blogs/BlogDetail2";

import RelatedBlogs from "@/components/blogs/RelatedBlogs";

import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import { getBlog, getBlogs, getBlogTaxonomies } from "@/lib/blogs";
import { notFound } from "next/navigation";
import React from "react";

export default async function BlogDetailsPage2({ params }) {
  const { id } = await params;

  const [blog, posts, taxonomies] = await Promise.all([getBlog(id), getBlogs(), getBlogTaxonomies()]);
  if (!blog) notFound();
  return (
    <>
      {/* <Topbar6 bgColor="bg-main" /> */}
      <BlogDetail2 blog={blog} posts={posts} taxonomies={taxonomies} />
      <RelatedBlogs posts={posts} currentUrl={blog.url} />
      <Footer1 />
    </>
  );
}
