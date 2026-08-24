"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import ProductSearchSuggestions from "@/components/search/ProductSearchSuggestions";
import useProductSearch from "@/hooks/useProductSearch";
import { fallbackHeaderCategories } from "@/data/headerCategories";

const fixedHeaderCategories = [
  { slug: "kitchen", name: "Kitchen" },
  { slug: "wardrobe", name: "Wardrobe" },
];

export default function MobileMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const { categories, loading } = useSelector((state) => state.category);
  const {
    canSearch,
    hasError: suggestionsError,
    isLoading: suggestionsLoading,
    normalizedQuery: trimmedSearchQuery,
    products: suggestions,
  } = useProductSearch(searchQuery);

  const closeMobileMenu = () => {
    const bootstrap = require("bootstrap");
    const mobileMenu = document.getElementById("mobileMenu");
    bootstrap.Offcanvas.getInstance(mobileMenu)?.hide();
  };

  const resetSearch = () => {
    setSearchQuery("");
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const query = trimmedSearchQuery;
    if (!query) return;

    closeMobileMenu();
    resetSearch();
    router.push(`/search-result?q=${encodeURIComponent(query)}`);
  };

  const handleSuggestionClick = () => {
    closeMobileMenu();
    resetSearch();
  };

  const apiCategories = categories || [];
  const apiCategoriesBySlug = new Map(apiCategories.map((category) => [category.slug, category]));
  const fallbackSlugs = new Set(fallbackHeaderCategories.map((category) => category.slug));
  const fixedSlugs = new Set(fixedHeaderCategories.map((category) => category.slug));
  const mobileCategories = [
    ...fixedHeaderCategories.map((category) => ({
      ...apiCategoriesBySlug.get(category.slug),
      ...category,
    })),
    ...fallbackHeaderCategories.map((category) => ({
      ...category,
      ...apiCategoriesBySlug.get(category.slug),
    })),
    ...apiCategories.filter(
      (category) => !fallbackSlugs.has(category.slug) && !fixedSlugs.has(category.slug)
    ),
  ];

  return (
    <div className="offcanvas offcanvas-start canvas-mb" id="mobileMenu">
      <span
        className="icon-close icon-close-popup"
        data-bs-dismiss="offcanvas"
        aria-label="Close"
      />
      <div className="mb-canvas-content">
        <div className="mb-body">
          <div className="mb-content-top">
            <form className="form-search" onSubmit={handleSearch}>
              <fieldset className="text">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className=""
                  name="q"
                  tabIndex={0}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-controls="mobile-search-suggestions"
                  aria-expanded={canSearch}
                  aria-required="true"
                  required
                />
              </fieldset>
              <button className="" type="submit">
                <svg
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                    stroke="#181818"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20.9984 20.9999L16.6484 16.6499"
                    stroke="#181818"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
            {canSearch && (
              <ProductSearchSuggestions
                id="mobile-search-suggestions"
                query={trimmedSearchQuery}
                products={suggestions}
                isLoading={suggestionsLoading}
                hasError={suggestionsError}
                onSelectProduct={handleSuggestionClick}
                onViewAll={handleSearch}
              />
            )}
            <ul className="nav-ul-mb" id="wrapper-menu-navigation">
              {loading ? (
                <li className="nav-mb-item">
                  <span className="mb-menu-link">Loading Categories...</span>
                </li>
              ) : null}
              {!loading &&
                mobileCategories.map((category, index) => (
                  category.children?.length > 0 ? (
                    <li key={category._id || category.slug} className="nav-mb-item">
                      <a
                        href={`#dropdown-category-${index}`}
                        className={`collapsed mb-menu-link ${
                          pathname.includes(category.slug) ? "active" : ""
                        }`}
                        data-bs-toggle="collapse"
                        aria-expanded="false"
                        aria-controls={`dropdown-category-${index}`}
                      >
                        <span>{category.name}</span>
                        <span className="btn-open-sub" />
                      </a>
                      <div id={`dropdown-category-${index}`} className="collapse">
                        <ul className="sub-nav-menu">
                          {category.children.map((child) => (
                            <li key={child._id}>
                              <Link
                                href={`/collections/${category.slug}/${child.slug}`}
                                className={`sub-nav-link ${
                                  pathname.includes(child.slug) ? "active" : ""
                                }`}
                                onClick={closeMobileMenu}
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ) : (
                    <li key={category._id || category.slug} className="nav-mb-item">
                      <Link
                        href={`/collections/${category.slug}`}
                        className={`mb-menu-link ${
                          pathname.includes(`/collections/${category.slug}`) ? "active" : ""
                        }`}
                        onClick={closeMobileMenu}
                      >
                        <span>{category.name}</span>
                      </Link>
                    </li>
                  )
                ))}
            </ul>
          </div>
          <div className="mb-other-content">
            <div className="group-icon">
              <Link href={`/wish-list`} className="site-nav-icon">
                <svg
                  className="icon"
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20.8401 4.60987C20.3294 4.09888 19.7229 3.69352 19.0555 3.41696C18.388 3.14039 17.6726 2.99805 16.9501 2.99805C16.2276 2.99805 15.5122 3.14039 14.8448 3.41696C14.1773 3.69352 13.5709 4.09888 13.0601 4.60987L12.0001 5.66987L10.9401 4.60987C9.90843 3.57818 8.50915 2.99858 7.05012 2.99858C5.59109 2.99858 4.19181 3.57818 3.16012 4.60987C2.12843 5.64156 1.54883 7.04084 1.54883 8.49987C1.54883 9.95891 2.12843 11.3582 3.16012 12.3899L4.22012 13.4499L12.0001 21.2299L19.7801 13.4499L20.8401 12.3899C21.3511 11.8791 21.7565 11.2727 22.033 10.6052C22.3096 9.93777 22.4519 9.22236 22.4519 8.49987C22.4519 7.77738 22.3096 7.06198 22.033 6.39452C21.7565 5.72706 21.3511 5.12063 20.8401 4.60987V4.60987Z"
                    stroke="#181818"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Wishlist
              </Link>
              <Link href={`/login`} className="site-nav-icon">
                <svg
                  className="icon"
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                    stroke="#181818"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                    stroke="#181818"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Login
              </Link>
            </div>
            <div className="mb-notice">
              <Link href={`/contact`} className="text-need">
                Need Help?
              </Link>
            </div>
            <div className="mb-contact">
              <p className="text-caption-1">Curve &amp; Comfort Customer Support</p>
              <Link
                href={`/contact`}
                className="tf-btn-default text-btn-uppercase"
              >
                CONTACT US
                <i className="icon-arrowUpRight" />
              </Link>
            </div>
            <ul className="mb-info">
              <li>
                <i className="icon icon-mail" />
                <a href="mailto:info@curve-comfort.com">info@curve-comfort.com</a>
              </li>
              <li>
                <i className="icon icon-phone" />
                <a href="tel:+919289166363">+91 92891 66363</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mb-bottom">
          {/* <div className="bottom-bar-language">
            <div className="tf-currencies">
              <CurrencySelect />
            </div>
            <div className="tf-languages">
              <LanguageSelect parentClassName="image-select center style-default type-languages" />
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
