"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import Link from "next/link";
import { Pagination, Autoplay } from "swiper/modules";

export default function ShopGram({ parentClass = "" }) {

  const insta = [{ id: 1, imgSrc: "/images/insta/1.png", price: 4999, delay: ".1s", title: "Modern Coffee Table", }, { id: 2, imgSrc: "/images/insta/2.png", price: 7999, delay: ".2s", title: "Comfort Lounge Chair", }, { id: 3, imgSrc: "/images/insta/3.png", price: 12999, delay: ".3s", title: "Wooden Bed Frame", }, { id: 4, imgSrc: "/images/insta/4.png", price: 5999, delay: ".4s", title: "Stylish Console Table", }, { id: 5, imgSrc: "/images/insta/5.png", price: 3999, delay: ".5s", title: "Minimal Nesting Tables", }, { id: 6, imgSrc: "/images/insta/6.png", price: 21999, delay: ".6s", title: "Luxury Fabric Sofa", }, { id: 7, imgSrc: "/images/insta/7.png", price: 2999, delay: ".7s", title: "Decor Wall Frame Set", }, { id: 8, imgSrc: "/images/insta/8.png", price: 6999, delay: ".8s", title: "Ottoman Seating Stool", }, { id: 9, imgSrc: "/images/insta/9.png", price: 8999, delay: ".9s", title: "Modern Study Table", }, { id: 10, imgSrc: "/images/insta/10.png", price: 14999, delay: "1s", title: "Premium Storage Cabinet", },];


  return (
    
    <section className={parentClass}>
      <div className=" container-full2 ">
        <div className="heading-section text-center">
          <h3 className="heading wow fadeInUp">Shop Instagram</h3>
          <p className="subheading text-secondary wow fadeInUp">
            Elevate your home with stylish furniture!
          </p>
        </div>

        <Swiper
          dir="ltr"
          className="swiper tf-sw-shop-gallery"
          spaceBetween={10}
          loop={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}

          breakpoints={{
            1200: { slidesPerView: 5 },
            768: { slidesPerView: 3 },
            0: { slidesPerView: 2 },
          }}

          modules={[Pagination, Autoplay]}

          pagination={{
            clickable: true,
            el: ".spb222",
          }}
        >
          {insta.map((item, i) => (
            <SwiperSlide key={i}>
              <div
                className="gallery-item hover-overlay hover-img wow fadeInUp"
                data-wow-delay={item.delay}
              >
                <div className="img-style">
                  <Image
                    className="img-hover"
                    alt={item.title}
                    src={item.imgSrc}
                    width={640}
                    height={640}
                  />
                </div>

                {/* <Link
                  href={`/product-detail/${item.id}`}
                  className="box-icon hover-tooltip"
                >
                  <span className="icon icon-eye" />
                  <span className="tooltip">View Product</span>
                </Link> */}
              </div>
            </SwiperSlide>
          ))}

          {/* Pagination Dots */}
          <div className="sw-pagination-gallery sw-dots type-circle justify-content-center spb222"></div>
        </Swiper>
      </div>
    </section>
  );
}