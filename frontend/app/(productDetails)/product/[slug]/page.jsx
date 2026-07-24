import Footer1 from "@/components/footers/Footer1";
import ProductDetailsBySlug from "@/components/products/ProductDetailsBySlug";
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

    const title = product.title || product.name || "Premium Furniture";
    const description =
      plainText(product.shortDescription || product.description) ||
      `Shop ${title} online at Curve & Comfort.`;
    const image = firstImage(product);

    return {
      title,
      description,
      alternates: {
        canonical: `/product/${slug}`,
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: `/product/${slug}`,
        images: image ? [{ url: image, alt: title }] : undefined,
      },
    };
  } catch {
    return {
      title: "Product",
      alternates: {
        canonical: `/product/${slug}`,
      },
    };
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
