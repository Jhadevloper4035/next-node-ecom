import Footer1 from "@/components/footers/Footer1";
import ProductDetailsBySlug from "@/components/products/ProductDetailsBySlug";
import { createSeoMetadata } from "@/lib/seo";
import { getProductBySlug } from "@/services/product/product.service";
import React from "react";

const plainText = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const firstImage = (product) => {
  const image = product?.images?.[0];
  return typeof image === "string" ? image : image?.url;
};

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const response = await getProductBySlug(slug);
    const product = response?.data;
    if (!product) return {};

    const productName = product.title || product.name || "Premium Furniture";
    const title = `${productName} | Curve & Comfort`;
    const description =
      plainText(product.shortDescription || product.description) ||
      `Shop ${productName} online at Curve & Comfort.`;
    const image = firstImage(product);

    return createSeoMetadata({
      seo: product.seo,
      title,
      description,
      canonical: `/product/${slug}`,
      image,
    });
  } catch {
    return createSeoMetadata({
      title: "Product",
      description: "Shop furniture at Curve & Comfort.",
      canonical: `/product/${slug}`,
    });
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params;

  return (
    <>
      <ProductDetailsBySlug slug={slug} />
      <Footer1 hasPaddingBottom />
    </>
  );
}
