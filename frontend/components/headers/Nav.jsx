"use client";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategoriesStart, fetchCategoriesSuccess, fetchCategoriesFailure } from "@/redux/categorySlice";
import { getAllCategories } from "@/services/category/category.service";
import { fallbackHeaderCategories } from "@/data/headerCategories";

const fixedProductCategories = [
  { slug: "kitchen", name: "Kitchen" },
  { slug: "wardrobe", name: "Wardrobe" },
];

export default function Nav() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.category);

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
    if (pathname.includes(`/collections/${category.slug}`)) return true;
    return category.children?.some((child) =>
      pathname.includes(`/collections/${category.slug}/${child.slug}`)
    );
  };

  const apiCategoriesBySlug = new Map((categories || []).map((category) => [category.slug, category]));
  const fallbackSlugs = new Set(fallbackHeaderCategories.map((category) => category.slug));
  const fixedSlugs = new Set(fixedProductCategories.map((category) => category.slug));
  const headerCategories = [
    ...fixedProductCategories.map((category) => ({
      ...apiCategoriesBySlug.get(category.slug),
      ...category,
    })),
    ...fallbackHeaderCategories.map((category) => ({
      ...category,
      ...apiCategoriesBySlug.get(category.slug),
    })),
    ...(categories || []).filter((category) => !fallbackSlugs.has(category.slug) && !fixedSlugs.has(category.slug)),
  ];

  return (
    <>
      {headerCategories.map((category) => {
        const hasSubmenu = category.children?.length > 0;

        return (
          <li
            key={category._id || category.slug}
            className={`menu-item ${isCategoryActive(category) ? "active" : ""
              } ${hasSubmenu ? "position-relative" : ""}`}
          >
            <Link
              href={`/collections/${category.slug}`}
              className="item-link"
            >
              {category.name}
              {(hasSubmenu || category.hasChildren) && (
                <i className="icon icon-arrow-down" />
              )}
            </Link>
            {hasSubmenu && (
              <div className="sub-menu submenu-default">
                <ul className="menu-list">
                  {category.children.map((child) => (
                    <li
                      key={child._id}
                      className={`menu-item-li ${pathname.includes(child.slug) ? "active" : ""
                        }`}
                    >
                      <Link
                        href={`/collections/${category.slug}/${child.slug}`}
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
        );
      })}
    </>
  );
}
