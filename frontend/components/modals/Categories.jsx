"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";

export default function Categories() {
  const { categories, loading, error } = useSelector((state) => state.category);

  return (
    <div
      className="offcanvas offcanvas-start canvas-filter canvas-categories"
      id="shopCategories"
    >
      <div className="canvas-wrapper">
        <div className="canvas-header">
          <span className="icon-left icon-filter" />
          <h5>Categories</h5>
          <span
            className="icon-close icon-close-popup"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="canvas-body">
          {loading && <div className="p-4 text-center">Loading categories...</div>}
          {error && <div className="p-4 text-center text-danger">Error loading categories</div>}

          {!loading && !error && categories?.map((category, index) => (
            <div className="wd-facet-categories" key={category._id || index}>
              <div
                role="dialog"
                className={`facet-title ${category.children?.length > 0 ? "collapsed" : ""}`}
                data-bs-target={category.children?.length > 0 ? `#category-menu-${index}` : undefined}
                data-bs-toggle={category.children?.length > 0 ? "collapse" : undefined}
                aria-expanded="false"
                aria-controls={category.children?.length > 0 ? `category-menu-${index}` : undefined}
              >
                {category.image ? (
                  <Image
                    className="avt"
                    alt={category.name || "avt"}
                    src={category.image}
                    width={48}
                    height={48}
                  />
                ) : (
                  <div className="avt bg-light d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, borderRadius: '50%' }}>
                    <i className="icon icon-laptop fs-4 text-secondary" />
                  </div>
                )}
                
                <span className="title">
                  {category.children?.length === 0 ? (
                    <Link href={`/shop-collection/${category.slug}`} className="text-decoration-none text-dark">
                      {category.name}
                    </Link>
                  ) : (
                    category.name
                  )}
                </span>
                
                {category.children?.length > 0 && <span className="icon icon-arrow-down" />}
              </div>
              
              {category.children?.length > 0 && (
                <div id={`category-menu-${index}`} className="collapse">
                  <ul className="facet-body">
                    <li>
                      <Link href={`/shop-collection/${category.slug}`} className="item link">
                        <span className="title-sub text-caption-1 text-secondary">
                          All {category.name}
                        </span>
                      </Link>
                    </li>
                    {category.children.map((child, childIndex) => (
                      <li key={child._id || childIndex}>
                        <Link href={`/shop-collection/${category.slug}/${child.slug}`} className="item link">
                           {child.image && (
                            <Image
                              className="avt"
                              alt={child.name || "avt"}
                              src={child.image}
                              width={48}
                              height={48}
                            />
                          )}
                          <span className="title-sub text-caption-1 text-secondary">
                            {child.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {!loading && !error && (!categories || categories.length === 0) && (
            <div className="p-4 text-center">No categories found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
