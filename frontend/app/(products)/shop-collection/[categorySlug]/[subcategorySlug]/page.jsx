import Footer1 from "@/components/footers/Footer1";
import SubcategoryProducts from "@/components/products/SubcategoryProducts";
import { getCategoryImage } from "@/data/categoryData";
import { getCategoryBySlug } from "@/lib/catalog";
import { createSeoMetadata } from "@/lib/seo";
import Link from "next/link";
import React from "react";

const titleize = (value = "") =>
  value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export async function generateMetadata({ params }) {
  const { categorySlug, subcategorySlug } = await params;
  const [category, subcategory] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getCategoryBySlug(subcategorySlug),
  ]);
  const categoryTitle = category?.name || titleize(categorySlug);
  const subcategoryTitle = subcategory?.name || titleize(subcategorySlug);

  return createSeoMetadata({
    seo: subcategory?.seo,
    title: `${subcategoryTitle} | ${categoryTitle} | Curve & Comfort`,
    description: subcategory?.description || `Shop ${subcategoryTitle.toLowerCase()} in our ${categoryTitle.toLowerCase()} collection at Curve & Comfort.`,
    canonical: `/collections/${categorySlug}/${subcategorySlug}`,
    image: subcategory?.images?.[0]?.url || category?.images?.[0]?.url,
  });
}

export default async function SubcategoryPage({ params }) {
  const { categorySlug, subcategorySlug } = await params;
  const categoryTitle = titleize(categorySlug);
  const subcategoryTitle = titleize(subcategorySlug);
  const backgroundImage = getCategoryImage(categorySlug);

  return (
    <>
      <div className="page-title" style={{ backgroundImage }}>
        <div className="container-full">
          <div className="row">
            <div className="col-12">
              <h1 className="heading text-center text-capitalize">{subcategoryTitle}</h1>
              <ul className="breadcrumbs d-flex align-items-center justify-content-center">
                <li>
                  <Link className="link" href="/">
                    Home
                  </Link>
                </li>
                <li>
                  <i className="icon-arrRight" />
                </li>
                <li>
                  <Link className="link text-capitalize" href={`/collections/${categorySlug}`}>
                    {categoryTitle}
                  </Link>
                </li>
                <li>
                  <i className="icon-arrRight" />
                </li>
                <li className="text-capitalize">{subcategoryTitle}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <SubcategoryProducts categorySlug={categorySlug} subcategorySlug={subcategorySlug} />
      <Footer1 />
    </>
  );
}
