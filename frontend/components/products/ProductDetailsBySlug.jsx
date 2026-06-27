"use client";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductStart,
  fetchProductSuccess,
  fetchProductFailure,
} from "@/redux/productSlice";
import { getProductBySlug } from "@/services/product/product.service";
import Breadcumb from "@/components/productDetails/Breadcumb";
import Details1 from "@/components/productDetails/details/Details1";
import Descriptions1 from "@/components/productDetails/descriptions/Descriptions1";
import RelatedProducts from "@/components/productDetails/RelatedProducts";
import RecentProducts from "@/components/otherPages/RecentProducts";
import { mapProductForCard, saveRecentlyViewedProduct } from "@/utlis/productMapper";

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

  const mappedProduct = useMemo(() => {
    if (!selectedProduct) return null;

    const colors = (selectedProduct.tags || [])
      .filter(
        (tag) => typeof tag === "string" && tag.startsWith("color:"),
      )
      .map((tag) => tag.slice(6).trim())
      .filter(Boolean);

    return {
      ...mapProductForCard(selectedProduct),
      color: colors,
      slideItems:
        selectedProduct.images?.map((img, index) => ({
          id: index + 1,
          src: typeof img === "string" ? img : img.url,
          alt: selectedProduct.title,
          width: 900,
          height: 1100,
          color: colors[0] || "",
        })) || [],
    };
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct && mappedProduct) {
      saveRecentlyViewedProduct(mappedProduct);
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
      <Details1 key={mappedProduct.id} product={mappedProduct} />
      <Descriptions1 product={mappedProduct} />
      <RelatedProducts
        currentProductId={selectedProduct?._id}
        categorySlug={selectedProduct?.category?.slug}
        subcategorySlug={selectedProduct?.subcategories?.[0]?.slug}
      />
      <RecentProducts currentProductId={selectedProduct?._id} />
    </>
  );
}
