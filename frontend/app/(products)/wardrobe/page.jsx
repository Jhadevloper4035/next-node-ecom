import CategoryPage, { generateMetadata as categoryMetadata } from "@/app/(products)/shop-collection/[categorySlug]/page";

export function generateMetadata() {
  return categoryMetadata({ params: Promise.resolve({ categorySlug: "wardrobe" }) });
}

export default function WardrobePage() {
  return CategoryPage({ params: Promise.resolve({ categorySlug: "wardrobe" }) });
}
