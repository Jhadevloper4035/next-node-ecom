"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  appendProducts,
} from "@/redux/productSlice";
import { getProductsByCategoryAndSubcategory } from "@/services/product/product.service";
import ProductCard1 from "@/components/productCards/ProductCard1";
import { useRef } from "react";

export default function SubcategoryProducts({ categorySlug, subcategorySlug }) {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.product);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 4;
  const observerTarget = useRef(null);

  useEffect(() => {
    // Reset products when category or subcategory changes
    setCurrentPage(1);
    setHasMore(true);
  }, [categorySlug, subcategorySlug]);

  useEffect(() => {
    const fetchProds = async () => {
      dispatch(fetchProductsStart());
      try {
        const response = await getProductsByCategoryAndSubcategory(
          categorySlug,
          subcategorySlug,
          {
            page: currentPage,
            limit,
          },
          { silent: currentPage > 1 }
        );

        const newProducts = response.data || [];
        if (currentPage === 1) {
          dispatch(fetchProductsSuccess(newProducts));
        } else {
          dispatch(appendProducts(newProducts));
        }

        if (newProducts.length < limit) {
          setHasMore(false);
        }
      } catch (error) {
        dispatch(
          fetchProductsFailure(error?.message || "Failed to fetch products"),
        );
      }
    };

    if (categorySlug && subcategorySlug) {
      fetchProds();
    }
  }, [categorySlug, subcategorySlug, currentPage, dispatch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading]);

  const mappedProducts = (products || []).map((p) => ({
    ...p,
    id: p._id,
    price: p.basePrice,
    imgSrc: p.images?.[0] || "/images/placeholder.jpg",
    imgHover: p.images?.[1] || p.images?.[0] || "/images/placeholder.jpg",
  }));

  if (error) return <div className="text-center py-5 text-danger">{error}</div>;

  return (
    <div className="container py-5">
      <div className="tf-grid-layout tf-col-2 lg-col-3 xl-col-4">
        {mappedProducts.length > 0
          ? mappedProducts.map((product, i) => (
              <ProductCard1 key={i} product={product} />
            ))
          : !loading && (
              <div className="text-center w-100 py-5">
                No products found for this selection.
              </div>
            )}
      </div>

      {/* Scroll Target for Infinite Loading */}
      {hasMore && (
        <div
          ref={observerTarget}
          className="wd-load d-flex justify-content-center mt-5"
        >
          <div
            className={`load-more-btn btn-infinite-scroll tf-loading ${
              loading ? "loading" : ""
            } `}
          ></div>
        </div>
      )}

      {/* {!hasMore && mappedProducts.length > 0 && (
        <div className="text-center py-4 text-muted mt-5">
          No more products to show.
        </div>
      )} */}
    </div>
  );
}
