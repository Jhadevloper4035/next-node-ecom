import React from "react";
import Pagination from "../common/Pagination";
import Link from "next/link";
import Image from "next/image";
export default function BlogGrid({ posts }) {
  return (
    <div className="main-content-page">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="tf-grid-layout md-col-3">
              {posts.map((blog, index) => (
                <div className="wg-blog style-1 hover-image" key={index}>
                  <div className="image">
                    <Image
                      className="lazyload"
                      data-src={blog.image}
                      alt={blog.title}
                      src={blog.image}
                      width={615}
                      height={461}
                    />
                  </div>
                  <div className="content">
                    <div className="meta">
                      <div className="meta-item gap-8">
                        <div className="icon">
                          <i className="icon-calendar" />
                        </div>
                        <p className="text-caption-1">{new Date(blog.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="meta-item gap-8">
                        <div className="icon">
                          <i className="icon-user" />
                        </div>
                        <p className="text-caption-1">
                          by{" "}
                          <a className="link" href="#">
                            {blog.author}
                          </a>
                        </p>
                      </div>
                    </div>
                    <div>
                      <h6 className="title fw-5">
                        <Link className="link" href={`/blog-detail/${blog.url}`}>
                          {blog.title}
                        </Link>
                      </h6>
                      <div className="body-text">{blog.meta_description || blog.text}</div>
                    </div>
                  </div>
                </div>
              ))}
              <ul className="wg-pagination justify-content-center">
                <Pagination />
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
