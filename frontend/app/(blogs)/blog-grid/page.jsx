import BlogGrid from "@/components/blogs/BlogGrid";

import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import Link from "next/link";
import React from "react";
import { getBlogs } from "@/lib/blogs";

export default async function BlogGridPage() {
  const posts = await getBlogs();
  return (
    <>
      {/* <Topbar6 bgColor="bg-main" /> */}
      <div
        className="page-title"
        style={{ backgroundImage: "url(/images/section/page-title.jpg)" }}
      >
        <div className="container-full">
          <div className="row">
            <div className="col-12">
              <h1 className="heading text-center">Blog Default</h1>
              <ul className="breadcrumbs d-flex align-items-center justify-content-center">
                <li>
                  <Link className="link" href={`/`}>
                    Home
                  </Link>
                </li>
                <li>
                  <i className="icon-arrRight" />
                </li>
                <li>
                  <a className="link" href="#">
                    Blog
                  </a>
                </li>
                <li>
                  <i className="icon-arrRight" />
                </li>
                <li>Blog Grid</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <BlogGrid posts={posts} />
      <Footer1 />
    </>
  );
}
