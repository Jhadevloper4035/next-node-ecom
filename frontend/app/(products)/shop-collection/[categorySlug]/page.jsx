import Footer1 from "@/components/footers/Footer1";
import CategoryProducts from "@/components/products/CategoryProducts";
import { getCategoryImage } from "@/data/categoryData";
import { getCategoryBySlug } from "@/lib/catalog";
import { createSeoMetadata } from "@/lib/seo";
import Link from "next/link";
import React from "react";

const titleize = (value = "") =>
  value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export async function generateMetadata({ params }) {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  const title = category?.name || titleize(categorySlug);

  return createSeoMetadata({
    seo: category?.seo,
    title: `${title} | Curve & Comfort`,
    description: category?.description || `Shop ${title} furniture at Curve & Comfort.`,
    canonical: `/collections/${categorySlug}`,
    image: category?.images?.[0]?.url,
  });
}

export default async function CategoryPage({ params }) {
  const { categorySlug } = await params;
  const categoryTitle = categorySlug.replace(/-/g, " ");
  const backgroundImage = getCategoryImage(categorySlug);

  return (
    <>
      <div className="page-title" style={{ backgroundImage }}>
        <div className="container-full">
          <div className="row">
            <div className="col-12">
              <h1 className="heading text-center text-capitalize">{categoryTitle}</h1>
              <ul className="breadcrumbs d-flex align-items-center justify-content-center">
                <li>
                  <Link className="link" href="/">
                    Home
                  </Link>
                </li>
                <li>
                  <i className="icon-arrRight" />
                </li>
                <li className="text-capitalize">{categoryTitle}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <CategoryProducts categorySlug={categorySlug} />
      <Footer1 />
    </>
  );
}
