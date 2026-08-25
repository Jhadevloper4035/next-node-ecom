import React from "react";
import Sidebar from "./Sidebar";
import Pagination from "../common/Pagination";
import Link from "next/link";
import Image from "next/image";
import { getBlogExcerpt } from "@/lib/blogs";

export default function BlogList({ posts = [], taxonomies }) {
  return (
    <div className="main-content-page">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mb-lg-30">
            {posts.length === 0 && <p>No blogs have been published yet.</p>}
            {posts.slice(0, 5).map((post) => (
              <div key={post._id || post.url} className="wg-blog style-row hover-image mb_40">
                <div className="image">
                  <Image
                    className="lazyload"
                    alt=""
                    src={post.image}
                    width={600}
                    height={399}
                  />
                </div>
                <div className="content">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-10">
                    <div className="meta">
                      <div className="meta-item gap-8">
                        <div className="icon">
                          <i className="icon-calendar" />
                        </div>
                          <p className="text-caption-1">{new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="meta-item gap-8">
                        <div className="icon">
                          <i className="icon-user" />
                        </div>
                        <p className="text-caption-1">
                          by{" "}
                          <a className="link" href="#">
                            {post.author}
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                  <h5 className="title">
                    <Link className="link" href={`/blogs/${post.url}`}>
                      {post.title}
                    </Link>
                  </h5>
                  {post.category && <p className="text-caption-1">{post.category}</p>}
                  <p>{getBlogExcerpt(post)}</p>
                  <Link
                    href={`/blogs/${post.url}`}
                    className="link text-button bot-button"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            ))}
            <ul className="wg-pagination">
              <Pagination />
            </ul>
          </div>
          <div className="col-lg-4">
            <Sidebar posts={posts} taxonomies={taxonomies} />
          </div>
        </div>
      </div>
    </div>
  );
}
