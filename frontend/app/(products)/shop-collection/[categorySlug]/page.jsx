import Footer1 from "@/components/footers/Footer1";
import CategoryProducts from "@/components/products/CategoryProducts";
import Link from "next/link";
import React from "react";

export default async function CategoryPage({ params }) {
  const { categorySlug } = await params;

  // Format titles for display
  const categoryTitle = categorySlug.replace(/-/g, " ");

  return (
    <>
      <div
        className="page-title"
        style={{ backgroundImage: "url(/images/section/page-title.jpg)" }}
      >
        <div className="container-full">
          <div className="row">
            <div className="col-12">
              <h3 className="heading text-center text-capitalize">{categoryTitle}</h3>
              <ul className="breadcrumbs d-flex align-items-center justify-content-center">
                <li>
                  <Link className="link" href={`/`}>
                    Homepage
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

      <CategoryProducts 
        categorySlug={categorySlug} 
      />
      
      <Footer1 />
    </>
  );
}
