import Footer1 from "@/components/footers/Footer1";
import Topbar6 from "@/components/headers/Topbar6";
import Products8 from "@/components/products/Products8";
import { getCategoryImage } from "@/data/categoryData";
import Link from "next/link";
import React from "react";

export default async function ShopDefaultListPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const category = resolvedSearchParams?.category;
  
  // Get the background image based on the category
  const backgroundImage = getCategoryImage(category);
  // Capitalize the first letter for display
  const categoryDisplayTitle = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <>
      {/* <Topbar6 bgColor="bg-main" />
       */}
      <div
        className="page-title"
        style={{ backgroundImage }}
      >
        <div className="container-full">
          <div className="row">
            <div className="col-12">
              <h3 className="heading text-center">{categoryDisplayTitle}</h3>
              <ul className="breadcrumbs d-flex align-items-center justify-content-center">
                <li>
                  <Link className="link" href={`/`}>
                    Home
                  </Link>
                </li>
                <li>
                  <i className="icon-arrRight" />
                </li>
                <li>{categoryDisplayTitle}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Products8 />
      <Footer1 />
    </>
  );
}
