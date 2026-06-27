"use client";

import CategoryProducts from "@/components/products/CategoryProducts";

export default function SubcategoryProducts({ categorySlug, subcategorySlug }) {
  return (
    <CategoryProducts
      categorySlug={categorySlug}
      subcategorySlug={subcategorySlug}
    />
  );
}
