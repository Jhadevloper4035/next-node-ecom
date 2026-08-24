"use client";
import React, { useEffect, useMemo, useState } from "react";
import ProductCard1 from "../productCards/ProductCard1";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllProducts } from "@/services/product/product.service";
import { mapProductsForCards } from "@/utlis/productMapper";
import { useToast } from "@/components/common/ToastContext";

export default function SearchProducts() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [visibleCount, setVisibleCount] = useState(12);
  const [price, setPrice] = useState([0, 100000]);
  const [availability, setAvailability] = useState("all");

  const trimmedQuery = query.trim();
  const filteredProducts = useMemo(() => products.filter((product) => {
    if (product.price < price[0] || product.price > price[1]) return false;
    if (availability === "all") return true;
    return availability === "in" ? product.inStock : !product.inStock;
  }), [availability, price, products]);
  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  useEffect(() => {
    const syncQueryFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get("q") || "");
    };

    syncQueryFromUrl();
    window.addEventListener("popstate", syncQueryFromUrl);

    return () => window.removeEventListener("popstate", syncQueryFromUrl);
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);

      try {
        const response = await getAllProducts(
          {
            page: 1,
            limit: 60,
            sort: trimmedQuery ? "rating" : "newest",
            ...(trimmedQuery ? { q: trimmedQuery } : {}),
          },
          { silent: true, signal: controller.signal },
        );

        if (isCurrent) {
          const mapped = mapProductsForCards(response?.data || []);
          const prices = mapped.map((product) => product.price).filter(Number.isFinite);
          setProducts(mapped);
          setPrice(prices.length ? [Math.min(...prices), Math.max(...prices)] : [0, 100000]);
          setAvailability("all");
          setVisibleCount(12);
        }
      } catch (err) {
        if (isCurrent) {
          setProducts([]);
          toast(err?.message || "Unable to load products.", "error");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    }, trimmedQuery ? 250 : 0);

    return () => {
      isCurrent = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [trimmedQuery, toast]);

  const updateSearchUrl = (value) => {
    const nextQuery = value.trim();
    const href = nextQuery
      ? `/search-result?q=${encodeURIComponent(nextQuery)}`
      : "/search-result";
    router.push(href);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateSearchUrl(query);
  };

  const handleQuickSearch = (value) => {
    setQuery(value);
    updateSearchUrl(value);
  };

  const resetFilters = () => {
    const prices = products.map((product) => product.price).filter(Number.isFinite);
    setPrice(prices.length ? [Math.min(...prices), Math.max(...prices)] : [0, 100000]);
    setAvailability("all");
  };

  return (
    <>
      {/* search */}
      <section className="flat-spacing page-search-inner">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-6">
              <form
                className="form-search"
                onSubmit={handleSubmit}
              >
                <fieldset className="text">
                  <input
                    type="text"
                    placeholder="Search sofa, bed, coffee table, wall decor..."
                    className=""
                    name="text"
                    tabIndex={0}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    aria-required="true"
                  />
                </fieldset>
                <button className="" type="submit">
                  <svg
                    className="icon"
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                      stroke="#181818"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21.35 21.0004L17 16.6504"
                      stroke="#181818"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>
              <div className="tf-col-quicklink">
                <span className="title">Quick link:</span>
                {["Sofa", "Bed", "Coffee Table", "Wall Decor"].map((term, index) => (
                  <React.Fragment key={term}>
                    <Link
                      className="link"
                      href={`/search-result?q=${encodeURIComponent(term)}`}
                      onClick={(event) => {
                        event.preventDefault();
                        handleQuickSearch(term);
                      }}
                    >
                      {term}
                    </Link>
                    {index < 3 ? ", " : ""}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* /search */}

      <section className="flat-spacing pt-0">
        <div className="container">
          <div className="heading-section text-center wow fadeInUp">
            <h3 className="heading">
              {trimmedQuery ? `Results for "${trimmedQuery}"` : "Latest Products"}
            </h3>
          </div>
          {!loading && products.length > 0 && (
            <div className="d-xl-none mb-3">
              <button type="button" className="tf-btn-filter" data-bs-toggle="offcanvas" data-bs-target="#searchFilterShop" aria-controls="searchFilterShop">
                <span className="icon icon-filter" />
                <span className="text">Filters</span>
              </button>
            </div>
          )}

          {loading ? (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ minHeight: "300px" }}
            >
              <div className="tf-loading loading"></div>
            </div>
          ) : visibleProducts.length ? (
            <>
              <div className="tf-grid-layout tf-col-2 lg-col-3 xl-col-4">
                {visibleProducts.map((product) => (
                  <ProductCard1 key={product.id || product.slug} product={product} />
                ))}
              </div>
              {hasMore && (
                <div className="wd-load view-more-button text-center mt-5">
                  <button
                    type="button"
                    className="tf-btn btn-reset btn-loadmore"
                    onClick={() => setVisibleCount((count) => count + 12)}
                  >
                    <span className="text text-btn text-btn-uppercase">
                      Load more
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              No products found. Try sofa, bed, chair, table, or wall decor.
            </div>
          )}
        </div>
      </section>
      <div className="offcanvas offcanvas-start canvas-filter d-xl-none" tabIndex="-1" id="searchFilterShop">
        <div className="canvas-wrapper">
          <div className="canvas-header">
            <h5>Filters</h5>
            <button type="button" className="icon-close icon-close-popup" data-bs-dismiss="offcanvas" aria-label="Close filters" />
          </div>
          <div className="canvas-body">
            <div className="widget-facet facet-price">
              <h6 className="facet-title">Price</h6>
              <div className="d-flex gap-2">
                <input className="form-control" type="number" min="0" value={price[0]} onChange={(event) => setPrice([Number(event.target.value), price[1]])} aria-label="Minimum price" />
                <input className="form-control" type="number" min="0" value={price[1]} onChange={(event) => setPrice([price[0], Number(event.target.value)])} aria-label="Maximum price" />
              </div>
            </div>
            <div className="widget-facet facet-fieldset">
              <h6 className="facet-title">Availability</h6>
              <div className="box-fieldset-item">
                {[["all", "All"], ["in", "In stock"], ["out", "Made to order"]].map(([value, label]) => (
                  <fieldset className="fieldset-item" onClick={() => setAvailability(value)} key={value}>
                    <input type="radio" name="search-availability" className="tf-check" readOnly checked={availability === value} />
                    <label>{label}</label>
                  </fieldset>
                ))}
              </div>
            </div>
          </div>
          <div className="canvas-bottom">
            <button type="button" onClick={resetFilters} className="tf-btn btn-reset">Reset filters</button>
          </div>
        </div>
      </div>
    </>
  );
}
