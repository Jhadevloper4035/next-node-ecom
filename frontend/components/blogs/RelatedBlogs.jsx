"use client";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { getBlogExcerpt } from "@/lib/blogs";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
export default function RelatedBlogs({ posts = [], currentUrl }) {
  const related = posts.filter((post) => post.url !== currentUrl).slice(0, 5);
  if (related.length === 0) return null;
  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="heading-section text-center">
              <h3>Related Articles</h3>
              <p className="body-text-1">
                More ideas and inspiration from Curve & Comfort.
              </p>
            </div>
            <Swiper
              dir="ltr"
              className="swiper tf-sw-recent"
              slidesPerView={3} // Equivalent to data-preview={3}
              spaceBetween={15} // Equivalent to data-space={15}
              breakpoints={{
                0: {
                  slidesPerView: 1, // Equivalent to data-mobile={1}
                  spaceBetween: 15,
                },
                768: {
                  slidesPerView: 2, // Equivalent to data-tablet={2}
                  spaceBetween: 15,
                },
                1024: {
                  slidesPerView: 3, // Equivalent to data-preview={3}
                  spaceBetween: 30, // Equivalent to data-space-md and data-space-lg
                },
              }}
              pagination={{
                clickable: true, // Handles data-pagination, data-pagination-md, and data-pagination-lg
                el: ".spd123",
              }}
              modules={[Pagination]}
            >
              {related.map((post) => (
                <SwiperSlide key={post._id || post.url} className="swiper-slide">
                  <div className="wg-blog style-1 hover-image">
                    <div className="image">
                      <Image
                        className="lazyload"
                        alt=""
                        src={post.image}
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
                      <div>
                        <h6 className="title fw-5">
                          <Link className="link" href={`/blog-detail/${post.url}`}>
                            {post.title}
                          </Link>
                        </h6>
                        <div className="body-text">
                          {getBlogExcerpt(post)}
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}

              <div className="sw-pagination-recent sw-dots type-circle d-flex justify-content-center spd123" />
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
