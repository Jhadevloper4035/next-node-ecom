"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductStart,
  fetchProductSuccess,
  fetchProductFailure,
} from "@/redux/productSlice";
import { getProductBySlug } from "@/services/product/product.service";
import Details1 from "@/components/productDetails/details/Details1";
import Breadcumb from "@/components/productDetails/Breadcumb";
import Descriptions1 from "@/components/productDetails/descriptions/Descriptions1";
import RelatedProducts from "@/components/productDetails/RelatedProducts";

export default function ProductDetailsBySlug({ slug }) {
  const dispatch = useDispatch();
  const { selectedProduct, loading, error } = useSelector(
    (state) => state.product,
  );

  useEffect(() => {
    const fetchProd = async () => {
      dispatch(fetchProductStart());
      try {
        const response = await getProductBySlug(slug);
        dispatch(fetchProductSuccess(response.data));
      } catch (error) {
        dispatch(
          fetchProductFailure(
            error?.message || "Failed to fetch product details",
          ),
        );
      }
    };
    if (slug) {
      fetchProd();
    }
  }, [slug, dispatch]);

  const getColorsFromTags = (tags = []) => {
    return tags
      .filter((tag) => tag.startsWith("color:"))
      .map((tag) => tag.split(":")[1]);
  };

  const mappedProduct = selectedProduct
    ? {
        ...selectedProduct,
        id: selectedProduct._id,
        price: selectedProduct.basePrice,
        imgSrc: selectedProduct.images?.[0] || "/images/placeholder.jpg",
        imgHover:
          selectedProduct.images?.[1] ||
          selectedProduct.images?.[0] ||
          "/images/placeholder.jpg",
        title: selectedProduct.title,
        color: getColorsFromTags(selectedProduct.tags),
        slideItems:
          selectedProduct.images?.map((img, index) => ({
            id: index + 1,
            src: img,
            alt: selectedProduct.title,
            width: 600,
            height: 800,
            color: getColorsFromTags(selectedProduct.tags), // Default color
          })) || [],
      }
    : null;

  useEffect(() => {
    if (selectedProduct && mappedProduct) {
      const recentlyVisited = JSON.parse(
        localStorage.getItem("recentlyVisitedProducts") || "[]",
      );
      const filtered = recentlyVisited.filter((p) => p.id !== mappedProduct.id);
      const updated = [mappedProduct, ...filtered].slice(0, 10);
      localStorage.setItem("recentlyVisitedProducts", JSON.stringify(updated));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("recentlyVisitedUpdated"));
    }
  }, [selectedProduct, mappedProduct?.id]);

  if (loading)
    return <div className="text-center py-5">Loading product details...</div>;
  if (error) return <div className="text-center py-5 text-danger">{error}</div>;
  if (!selectedProduct)
    return <div className="text-center py-5">Product not found.</div>;

  return (
    <>
      <Breadcumb product={mappedProduct} />
      <Details1 product={mappedProduct} />
      <Descriptions1 product={mappedProduct} />
      <RelatedProducts
        currentProductId={selectedProduct?._id}
        categorySlug={selectedProduct?.category?.slug}
        subcategorySlug={selectedProduct?.subcategories?.[0]?.slug}
      />
    </>
  );
}
