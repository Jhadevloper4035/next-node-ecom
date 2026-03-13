"use client";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { products } from "@/data/products";
import { Swiper, SwiperSlide } from "swiper/react";
import ProductCard1 from "../productCards/ProductCard1";
import {
  blogLinks,
  demoItems,
  otherPageLinks,
  otherShopMenus,
  productFeatures,
  productLinks,
  productStyles,
  shopFeatures,
  shopLayout,
  swatchLinks,
} from "@/data/menu";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategoriesStart, fetchCategoriesSuccess, fetchCategoriesFailure } from "@/redux/categorySlice";
import { getAllCategories } from "@/services/category/category.service";

export default function Nav() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector((state) => state.category);

  useEffect(() => {
    const fetchCats = async () => {
        dispatch(fetchCategoriesStart());
        try {
            const response = await getAllCategories();
            dispatch(fetchCategoriesSuccess(response.data));
        } catch (error) {
            dispatch(fetchCategoriesFailure(error?.message || "Failed to fetch categories"));
        }
    };
    fetchCats();
  }, [dispatch]);

  const isCategoryActive = (category) => {
    if (pathname.includes(`/shop-collection/${category.slug}`)) return true;
    return category.children?.some((child) =>
      pathname.includes(`/shop-collection/${child.slug}`)
    );
  };
  return (
    <>
      {" "}
      <li
        className={`menu-item ${
          [...demoItems].some(
            (elm) => elm.href.split("/")[1] == pathname.split("/")[1],
          )
            ? "active"
            : ""
        } `}
      >
        {/* <a href="/" className="item-link">
          Home
          <i className="icon icon-arrow-down" />
        </a> */}
        {/* <div className="sub-menu mega-menu">
          <div className="container">
            <div className="row-demo">
              {demoItems.slice(0, 12).map((item, index) => (
                <div
                  className={`demo-item ${
                    pathname.split("/")[1] === item.href.split("/")[1]
                      ? "active"
                      : ""
                  }`}
                  key={item.href}
                >
                  <Link href={item.href}>
                    <div className="demo-image position-relative">
                      <Image
                        className="lazyload"
                        data-src={item.src}
                        alt={item.alt}
                        src={item.src}
                        width={273}
                        height={300}
                      />
                      {item.label.length > 0 && (
                        <div className="demo-label">
                          {item.label.map((label, labelIndex) => (
                            <span
                              key={labelIndex}
                              className={`demo-${label.toLowerCase()}`}
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="demo-name">{item.name}</span>
                  </Link>
                </div>
              ))}
            </div>
            <div className="text-center view-all-demo">
              <a href="#modalDemo" data-bs-toggle="modal" className="tf-btn">
                <span className="text">View All Demos</span>
              </a>
            </div>
          </div>
        </div> */}
      </li>
      {loading ? (
        <li className="menu-item">
          <a href="#" className="item-link">Loading...</a>
        </li>
      ) : error ? (
        <li className="menu-item">
          {/* <a href="#" className="item-link text-danger">Error loading categories</a> */}
          console.log(error);
        </li>
      ) : (
        categories?.map((category) => (
          <li
            key={category._id}
            className={`menu-item ${
              isCategoryActive(category) ? "active" : ""
            } ${category.children?.length > 0 ? "position-relative" : ""}`}
          >
            <Link
              href={`/shop-collection/${category.slug}`}
              className="item-link"
            >
              {category.name}
              {category.children?.length > 0 && (
                <i className="icon icon-arrow-down" />
              )}
            </Link>
            {category.children?.length > 0 && (
              <div className="sub-menu submenu-default">
                <ul className="menu-list">
                  {category.children.map((child) => (
                    <li
                      key={child._id}
                      className={`menu-item-li ${
                        pathname.includes(child.slug) ? "active" : ""
                      }`}
                    >
                      <Link
                        href={`/shop-collection/${category.slug}/${child.slug}`}
                        className="menu-link-text"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))
      )}
      {/* <li
        className={`menu-item position-relative ${
          [...blogLinks].some(
            (elm) => elm.href.split("/")[1] == pathname.split("/")[1],
          )
            ? "active"
            : ""
        } `}
      >
        <a href="#" className="item-link">
          Blog
          <i className="icon icon-arrow-down" />
        </a>
        <div className="sub-menu submenu-default">
          <ul className="menu-list">
            {blogLinks.map((link, index) => (
              <li
                key={index}
                className={`menu-item-li ${
                  pathname.split("/")[1] == link.href.split("/")[1]
                    ? "active"
                    : ""
                } `}
              >
                <Link href={link.href} className="menu-link-text">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </li> */}
      <li
        className={`menu-item position-relative ${
          [...otherPageLinks].some(
            (elm) => elm.href.split("/")[1] == pathname.split("/")[1],
          )
            ? "active"
            : ""
        } `}
      >
        <a href="#" className="item-link">
          Pages
          <i className="icon icon-arrow-down" />
        </a>
        <div className="sub-menu submenu-default">
          <ul className="menu-list">
            {otherPageLinks.map((link, index) => (
              <li
                key={index}
                className={`menu-item-li ${
                  pathname.split("/")[1] == link.href.split("/")[1]
                    ? "active"
                    : ""
                } `}
              >
                <Link href={link.href} className="menu-link-text">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </li>
      {/* <li className="menu-item">
        <a
          href="https://www.templatemonster.com/free-interior-Women-wordpress-themes/"
          className="item-link"
        >
          Buy Theme
        </a>
      </li> */}
    </>
  );
}
