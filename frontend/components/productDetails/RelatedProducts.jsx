"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import ProductCard1 from "../productCards/ProductCard1";
import { getProductsByCategory, getProductsByCategoryAndSubcategory } from "@/services/product/product.service";

export default function RelatedProducts({ currentProductId, categorySlug, subcategorySlug }) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRelatedProds = async () => {
      if (!categorySlug) return;
      setLoading(true);
      try {
        let response;
        if (categorySlug && subcategorySlug) {
          response = await getProductsByCategoryAndSubcategory(
            categorySlug,
            subcategorySlug,
            { limit: 10 }
          );
        } else if (categorySlug) {
          response = await getProductsByCategory(categorySlug, { limit: 10 });
        }

        if (response && response.data) {
          const rawProducts = Array.isArray(response.data) ? response.data : (response.data.data || []);
          
          // Exclude current product and map to what ProductCard1 expects
          const filtered = rawProducts
            .filter((p) => String(p._id || p.id) !== String(currentProductId))
            .map((p) => ({
              ...p,
              id: p._id || p.id,
              price: p.basePrice || p.price,
              imgSrc: p.images?.[0] || "/images/placeholder.jpg",
              imgHover: p.images?.[1] || p.images?.[0] || "/images/placeholder.jpg",
            }));
          setRelatedProducts(filtered);
        }
      } catch (error) {
        console.error("Failed to fetch related products:", error);
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
          <li className="nav-tab-item" role="presentation">
            <a href="#ralatedProducts" className="active" data-bs-toggle="tab">
               Related Products
            </a>
          </li>
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
                <div className="text-center py-5">No related products found.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
