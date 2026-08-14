"use client";
import React, { useEffect, useState } from "react";
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

  const trimmedQuery = query.trim();
  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

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
          setProducts(mapProductsForCards(response?.data || []));
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
    </>
  );
}
