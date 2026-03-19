"use client";
import React from "react";
import Link from "next/link";
import { allProducts } from "@/data/products";
import { usePathname } from "next/navigation";
export default function Breadcumb({ product }) {
  const pathname = usePathname();
  return (
    <div className="tf-breadcrumb">
      <div className="container">
        <div className="tf-breadcrumb-wrap">
          <div className="tf-breadcrumb-list">
            <Link href={`/`} className="text text-caption-1">
              Home
            </Link>

            {product?.category && (
              <>
                <i className="icon icon-arrRight" />
                <Link 
                  href={`/shop-collection/${product.category.slug}`} 
                  className="text text-caption-1 text-capitalize"
                >
                  {product.category.name}
                </Link>
              </>
            )}

            <i className="icon icon-arrRight" />
            <span className="text text-caption-1">{product?.title}</span>
          </div>
          <div className="tf-breadcrumb-prev-next">
            <button
              onClick={() => window.history.back()}
              className="tf-breadcrumb-back btn-reset"
            >
              <i className="icon icon-squares-four" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
