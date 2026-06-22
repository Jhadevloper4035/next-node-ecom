"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import ProductCard1 from "../productCards/ProductCard1";
import { getProductsByCategory, getProductsByCategoryAndSubcategory } from "@/services/product/product.service";
import { mapProductsForCards } from "@/utlis/productMapper";

export default function RelatedProducts({ currentProductId, categorySlug, subcategorySlug }) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRelatedProds = async () => {
      if (!categorySlug) return;
      setLoading(true);
      try {
        let rawProducts = [];
        if (categorySlug && subcategorySlug) {
          const response = await getProductsByCategoryAndSubcategory(
            categorySlug,
            subcategorySlug,
            { limit: 10 }
          );
          rawProducts = response?.data || [];
        }

        if (rawProducts.length <= 1 && categorySlug) {
          const response = await getProductsByCategory(categorySlug, { limit: 10 });
          rawProducts = response?.data || [];
        }

        const filtered = mapProductsForCards(rawProducts).filter(
          (p) => String(p.id) !== String(currentProductId)
        );
        setRelatedProducts(filtered);
      } catch (error) {
        console.error("Failed to fetch related products:", error);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRelatedProds();
  }, [currentProductId, categorySlug, subcategorySlug]);

  return (
    <section className="flat-spacing">
      <div className="container flat-animate-tab">
        <ul
          className="tab-product justify-content-sm-center wow fadeInUp"
          data-wow-delay="0s"
          role="tablist"
        >
          {relatedProducts.length > 0 && <li className="nav-tab-item" role="presentation">
            <a href="#ralatedProducts" className="active" data-bs-toggle="tab">
               Related Products
            </a>
          </li>}
        </ul>
        <div className="tab-content">
          <div
            className="tab-pane active show"
            id="ralatedProducts"
            role="tabpanel"
          >
            {loading ? (
              <div className="text-center py-5">Loading related products...</div>
            ) : relatedProducts.length > 0 ? (
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
                  el: ".spd4",
                }}
              >
                {relatedProducts.map((product, i) => (
                  <SwiperSlide key={i} className="swiper-slide">
                    <ProductCard1 product={product} />
                  </SwiperSlide>
                ))}

                <div className="sw-pagination-latest spd4  sw-dots type-circle justify-content-center" />
              </Swiper>
            ) : (
                null
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
