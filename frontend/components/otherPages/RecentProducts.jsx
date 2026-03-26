"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import ProductCard1 from "../productCards/ProductCard1";
import { Pagination } from "swiper/modules";

export default function RecentProducts() {
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    const loadRecent = () => {
      const stored = JSON.parse(
        localStorage.getItem("recentlyVisitedProducts") || "[]"
      );
      setRecentProducts(stored);
    };

    loadRecent();

    const handleStorage = (e) => {
      if (e.key === "recentlyVisitedProducts") loadRecent();
    };

    window.addEventListener("recentlyVisitedUpdated", loadRecent);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("recentlyVisitedUpdated", loadRecent);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  if (recentProducts.length === 0) return null;

  return (
    <section className="flat-spacing pt-0">
      <div className="container">
        <div className="heading-section text-center wow fadeInUp">
          <h4 className="heading">You may also like</h4>
        </div>
        <Swiper
          className="swiper tf-sw-latest"
          dir="ltr"
          spaceBetween={15}
          breakpoints={{
            0: { slidesPerView: 2, spaceBetween: 15 },

            768: { slidesPerView: 3, spaceBetween: 30 },
            1200: { slidesPerView: 4, spaceBetween: 30 },
          }}
          modules={[Pagination]}
          pagination={{
            clickable: true,
            el: ".spd79",
          }}
        >
          {recentProducts.map((product, i) => (
            <SwiperSlide key={product.id || i} className="swiper-slide">
              <ProductCard1 product={product} />
            </SwiperSlide>
          ))}

          <div className="sw-pagination-latest sw-dots type-circle justify-content-center spd79" />
        </Swiper>
      </div>
    </section>
  );
}
