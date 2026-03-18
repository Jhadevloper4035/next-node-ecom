"use client";
import ProductCard1 from "@/components/productCards/ProductCard1";
import React, { useEffect } from "react";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
} from "@/redux/productSlice";
import { getAllProducts } from "@/services/product/product.service";

export default function Products2({
  title = "Best Selling",
  parentClass = "",
  filter = null, // e.g. "featured", "best-seller", "new-arrival", or null for all
}) {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.product);

  useEffect(() => {
    const fetchProds = async () => {
      dispatch(fetchProductsStart());
      try {
        const response = await getAllProducts({ page: 1, limit: 10, sort: "newest" });
        dispatch(fetchProductsSuccess(response.data));
      } catch (error) {
        dispatch(fetchProductsFailure(error?.message || "Failed to fetch products"));
      }
    };
    fetchProds();
  }, [dispatch]);

  const filteredProducts = (() => {
    if (!products || products.length === 0) return [];
    if (!filter) return products; // no filter = show all
    return products.filter((p) => p.tags?.includes(filter));
  })();

  const mappedProducts = filteredProducts.map((p) => ({
    ...p,
    id: p._id,
    price: p.basePrice,
    imgSrc: p.images?.[0] || "/images/placeholder.jpg",
    imgHover: p.images?.[1] || p.images?.[0] || "/images/placeholder.jpg",
  }));

  return (
    <section className={parentClass}>
      <div className="container-full2 ">
        <div className="heading-section text-center wow fadeInUp">
          <h3 className="heading">{title}</h3>
          <p className="subheading text-secondary">
            Browse our Top Trending: the hottest picks loved by all.
          </p>
        </div>

        {loading ? (
          <div className="text-center w-100">Loading products...</div>
        ) : mappedProducts.length === 0 ? (
          <div className="text-center w-100">No products found.</div>
        ) : (
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
            pagination={{ clickable: true, el: ".spd4" }}
          >
            {mappedProducts.map((product, i) => (
              <SwiperSlide key={i} className="swiper-slide">
                <ProductCard1 product={product} />
              </SwiperSlide>
            ))}
            <div className="sw-pagination-latest spd4 sw-dots type-circle justify-content-center" />
          </Swiper>
        )}
      </div>
    </section>
  );
}