"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductStart, fetchProductSuccess, fetchProductFailure } from "@/redux/productSlice";
import { getProductBySlug } from "@/services/product/product.service";
import Details1 from "@/components/productDetails/details/Details1";
import Breadcumb from "@/components/productDetails/Breadcumb";
import Descriptions1 from "@/components/productDetails/descriptions/Descriptions1";
import RelatedProducts from "@/components/productDetails/RelatedProducts";

export default function ProductDetailsBySlug({ slug }) {
  const dispatch = useDispatch();
  const { selectedProduct, loading, error } = useSelector((state) => state.product);

  useEffect(() => {
    const fetchProd = async () => {
      dispatch(fetchProductStart());
      try {
        const response = await getProductBySlug(slug);
        dispatch(fetchProductSuccess(response.data));
      } catch (error) {
        dispatch(fetchProductFailure(error?.message || "Failed to fetch product details"));
      }
    };
    if (slug) {
      fetchProd();
    }
  }, [slug, dispatch]);

  if (loading) return <div className="text-center py-5">Loading product details...</div>;
  if (error) return <div className="text-center py-5 text-danger">{error}</div>;
  if (!selectedProduct) return <div className="text-center py-5">Product not found.</div>;

  const mappedProduct = {
    ...selectedProduct,
    id: selectedProduct._id,
    price: selectedProduct.basePrice,
    imgSrc: selectedProduct.images?.[0] || "/images/placeholder.jpg",
    imgHover: selectedProduct.images?.[1] || selectedProduct.images?.[0] || "/images/placeholder.jpg",
    title: selectedProduct.title,
    slideItems: selectedProduct.images?.map((img, index) => ({
      id: index + 1,
      src: img,
      alt: selectedProduct.title,
      width: 600,
      height: 800,
      color: "gray" // Default color
    })) || []
  };

  return (
    <>
      <Breadcumb product={mappedProduct} />
      <Details1 product={mappedProduct} />
      <Descriptions1 product={mappedProduct} />
      <RelatedProducts />
    </>
  );
}
