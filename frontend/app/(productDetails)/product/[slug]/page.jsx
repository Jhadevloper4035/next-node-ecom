import Footer1 from "@/components/footers/Footer1";
import ProductDetailsBySlug from "@/components/products/ProductDetailsBySlug";
import React from "react";

export default async function ProductPage({ params }) {
  const { slug } = await params;

  return (
    <>
      <ProductDetailsBySlug slug={slug} />
      <Footer1 hasPaddingBottom />
    </>
  );
}
