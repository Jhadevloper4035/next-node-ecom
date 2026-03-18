"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import Link from "next/link";
import { Pagination } from "swiper/modules";
import LookbookProduct from "@/components/common/LookbookProduct";
import { useEffect } from "react";

// Default data matching the HTML source
const defaultSlides = [
  {
    id: 1,
    image: "/images/banner/banner-lb-furniture2.png",
    pins: [
      {
        position: "position3",
        product: {
          imgSrc: "/images/gallery/lookbook-sm2.jpg",
          title: "Ribbed cotton-blend top",
          price: 40000,
          href: "/product-detail",
        },
      },
      {
        position: "position4",
        product: {
          imgSrc: "/images/gallery/lookbook-sm3.jpg",
          title: "Copenhagen Beechwood Artisan",
          price: 60000,
          href: "/product-detail",
        },
      },
    ],
  },
  {
    id: 2,
    image: "/images/banner/banner-lb-furniture1.png",
    pins: [
      {
        position: "position3",
        product: {
          imgSrc: "/images/gallery/lookbook-sm2.jpg",
          title: "Ribbed cotton-blend top",
          price: 80000,
          href: "/product-detail",
        },
      },
      {
        position: "position4",
        product: {
          imgSrc: "/images/gallery/lookbook-sm3.jpg",
          title: "Copenhagen Beechwood Artisan",
          price: 60000,
          href: "/product-detail",
        },
      },
    ],
  },
];

export default function LookBook({ slides = defaultSlides, paginationEl = "spd20" }) {

  useEffect(() => {
    const updateDropdownClass = () => {
      const dropdowns = document.querySelectorAll(".dropdown-custom");
      dropdowns.forEach((dropdown) => {
        if (window.innerWidth <= 991) {
          dropdown.classList.add("dropup");
          dropdown.classList.remove("dropend");
        } else {
          dropdown.classList.add("dropend");
          dropdown.classList.remove("dropup");
        }
      });
    };

    updateDropdownClass();
    window.addEventListener("resize", updateDropdownClass);
    return () => window.removeEventListener("resize", updateDropdownClass);
  }, []);

  return (
    <section>
      <Swiper
        className="flat-sw-pagination swiper tf-sw-lookbook sw-lookbook-wrap"
        dir="ltr"
        spaceBetween={0}
        slidesPerView={1}
        modules={[Pagination]}
        pagination={{
          clickable: true,
          el: `.${paginationEl}`,
        }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} className="swiper-slide">
            <div className="banner-lookbook">
              <Image
                className="lazyload"
                src={slide.image}
                alt="banner"
                width={1920}
                height={600}
                priority={slide.id === 1} // only eagerly load first slide
              />

              {slide.pins.map((pin, pinIndex) => (
                <div key={pinIndex} className={`lookbook-item ${pin.position}`}>
                  <div className="dropdown dropup-center dropdown-custom">
                    <div
                      role="dialog"
                      className="tf-pin-btn"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <span />
                    </div>
                    <div className="dropdown-menu">
                      <LookbookProduct product={pin.product} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SwiperSlide>
        ))}

        <div
          className={`sw-pagination-lookbook sw-dots type-circle white-circle-line justify-content-center ${paginationEl}`}
        />
      </Swiper>
    </section>
  );
}