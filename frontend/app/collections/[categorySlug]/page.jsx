import CategoryPage, { generateMetadata } from "@/app/(products)/shop-collection/[categorySlug]/page";

const productSlugs = {
  chairs: "chairs-ottomans",
};

export { generateMetadata };

export default async function CollectionsCategoryPage({ params }) {
  const { categorySlug } = await params;

  return CategoryPage({
    params: Promise.resolve({
      categorySlug: productSlugs[categorySlug] || categorySlug,
    }),
  });
}
