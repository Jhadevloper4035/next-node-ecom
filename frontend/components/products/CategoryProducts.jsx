"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsStart, fetchProductsSuccess, fetchProductsFailure } from "@/redux/productSlice";
import { getProductsByCategory } from "@/services/product/product.service";
import ProductCard1 from "@/components/productCards/ProductCard1";

export default function CategoryProducts({ categorySlug }) {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.product);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const fetchProds = async () => {
      dispatch(fetchProductsStart());
      try {
        const response = await getProductsByCategory(categorySlug, { page: currentPage, limit });
        dispatch(fetchProductsSuccess(response.data));
      } catch (error) {
        dispatch(fetchProductsFailure(error?.message || "Failed to fetch products"));
      }
    };
    if (categorySlug) {
      fetchProds();
    }
  }, [categorySlug, currentPage, dispatch]);

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
        {loading ? (
          <div className="text-center w-100 py-5">Loading...</div>
        ) : mappedProducts.length > 0 ? (
          mappedProducts.map((product, i) => (
            <ProductCard1 key={i} product={product} />
          ))
        ) : (
          <div className="text-center w-100 py-5">No products found for this category.</div>
        )}
      </div>
    </div>
  );
}
