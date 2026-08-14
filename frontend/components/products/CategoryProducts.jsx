"use client";

import React, { useEffect, useMemo, useState } from "react";
import ProductCard1 from "@/components/productCards/ProductCard1";
import {
  buildProductCustomizationGroups,
  getCategoryProductConfig,
  productHasOptionValue,
  tagValue,
} from "@/data/categoryProductConfig";
import {
  getProductsByCategory,
  getProductsByCategoryAndSubcategory,
} from "@/services/product/product.service";
import { mapProductsForCards } from "@/utlis/productMapper";
import { useToast } from "@/components/common/ToastContext";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price Low To High", value: "price_asc" },
  { label: "Price High To Low", value: "price_desc" },
  { label: "Title A To Z", value: "title_asc" },
];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const uniqueValues = (values) =>
  [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];

const productGroupOptions = (products, key) =>
  uniqueValues(
    products.flatMap((product) =>
      buildProductCustomizationGroups(product)
        .filter((group) => group.key === key)
        .flatMap((group) => group.options.map((option) => option.label)),
    ),
  );

const optionFilterLabels = {
  "foam-density": "Foam Density",
  "fabric-types": "Fabric",
  material: "Material",
  size: "Size",
};
const emptyPlannedCategories = new Set(["kitchen", "wardrobe", "wardrobes"]);

export default function CategoryProducts({ categorySlug, subcategorySlug }) {
  const config = useMemo(
    () => getCategoryProductConfig(categorySlug),
    [categorySlug],
  );
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [price, setPrice] = useState([0, 100000]);
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selectedFilters, setSelectedFilters] = useState({});

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = subcategorySlug
          ? await getProductsByCategoryAndSubcategory(categorySlug, subcategorySlug, {
              page: 1,
              limit: 100,
            })
          : await getProductsByCategory(categorySlug, {
              page: 1,
              limit: 100,
            });

        if (!cancelled) {
          const mapped = mapProductsForCards(response.data || []);
          setProducts(mapped);
          const prices = mapped.map((product) => product.price).filter(Number.isFinite);
          if (prices.length) setPrice([Math.min(...prices), Math.max(...prices)]);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err?.message || String(err);
          if (!(emptyPlannedCategories.has(categorySlug) && message === "Category not found")) {
            toast(message || "Failed to fetch products", "error");
          }
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (categorySlug) fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [categorySlug, subcategorySlug, toast]);

  useEffect(() => {
    setSelectedFilters({});
    setAvailability("all");
    setSort("newest");
  }, [categorySlug, subcategorySlug]);

  const filterOptions = useMemo(() => {
    const entries = {};
    const activeFilters = config.filters || [];

    if (activeFilters.includes("color")) {
      entries.color = uniqueValues(products.map((product) => tagValue(product, "color")));
    }

    ["size", "material", "foam-density", "fabric-types"].forEach((key) => {
      if (activeFilters.includes(key)) {
        entries[key] = productGroupOptions(products, key);
      }
    });

    return entries;
  }, [config.filters, products]);

  const toggleFilter = (key, value) => {
    setSelectedFilters((current) => ({
      ...current,
      [key]: current[key] === value ? "" : value,
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({});
    setAvailability("all");
    const prices = products.map((product) => product.price).filter(Number.isFinite);
    setPrice(prices.length ? [Math.min(...prices), Math.max(...prices)] : [0, 100000]);
  };

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      if (availability !== "all") {
        const isInStock = product.inStock ?? Number(product.stock || 0) > 0;
        if (availability === "in" && !isInStock) return false;
        if (availability === "out" && isInStock) return false;
      }

      if (product.price < price[0] || product.price > price[1]) return false;

      return Object.entries(selectedFilters).every(([key, value]) => {
        if (!value) return true;
        if (key === "color") return tagValue(product, "color") === value;
        return productHasOptionValue(product, value);
      });
    });

    if (sort === "price_asc") return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "price_desc") return [...filtered].sort((a, b) => b.price - a.price);
    if (sort === "title_asc") return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  }, [availability, price, products, selectedFilters, sort]);

  const activeFilterKeys = config.filters || [];
  const showPrice = activeFilterKeys.includes("price");
  const showAvailability = activeFilterKeys.includes("availability");

  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="tf-shop-control">
          <div className="tf-control-filter">
            <button type="button" className="tf-btn-filter" onClick={clearFilters}>
              <span className="icon icon-filter" />
              <span className="text">Reset Filters</span>
            </button>
          </div>
          <p className="text-caption-1 mb-0">
            {loading ? "Loading products" : `${filteredProducts.length} products`}
          </p>
          <div className="tf-control-sorting">
            <p className="d-none d-lg-block text-caption-1">Sort by:</p>
            <select
              className="tf-select"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row">
          <aside className="col-xl-3 mb-4 mb-xl-0">
            <div className="canvas-body p-0">
              {showPrice && (
                <div className="widget-facet facet-price">
                  <h6 className="facet-title">Price</h6>
                  <div className="d-flex gap-2">
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={price[0]}
                      onChange={(event) => setPrice([Number(event.target.value), price[1]])}
                      aria-label="Minimum price"
                    />
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={price[1]}
                      onChange={(event) => setPrice([price[0], Number(event.target.value)])}
                      aria-label="Maximum price"
                    />
                  </div>
                  <p className="text-caption-1 mt-2 mb-0">
                    {formatPrice(price[0])} - {formatPrice(price[1])}
                  </p>
                </div>
              )}

              {showAvailability && (
                <div className="widget-facet facet-fieldset">
                  <h6 className="facet-title">Availability</h6>
                  <div className="box-fieldset-item">
                    {[
                      ["all", "All"],
                      ["in", "In stock"],
                      ["out", "Made to order"],
                    ].map(([value, label]) => (
                      <fieldset
                        className="fieldset-item"
                        onClick={() => setAvailability(value)}
                        key={value}
                      >
                        <input
                          type="radio"
                          className="tf-check"
                          readOnly
                          checked={availability === value}
                        />
                        <label>{label}</label>
                      </fieldset>
                    ))}
                  </div>
                </div>
              )}

              {Object.entries(filterOptions).map(([key, options]) =>
                options.length ? (
                  <div className="widget-facet facet-fieldset" key={key}>
                    <h6 className="facet-title">{optionFilterLabels[key] || key}</h6>
                    <div className="box-fieldset-item">
                      {options.map((option) => (
                        <fieldset
                          className="fieldset-item"
                          onClick={() => toggleFilter(key, option)}
                          key={option}
                        >
                          <input
                            type="checkbox"
                            className="tf-check"
                            readOnly
                            checked={selectedFilters[key] === option}
                          />
                          <label>{option}</label>
                        </fieldset>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          </aside>

          <div className="col-xl-9">
            {loading ? (
              <div className="text-center w-100 py-5">
                <div className="load-more-btn btn-infinite-scroll tf-loading loading mx-auto" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={`tf-grid-layout tf-col-2 lg-col-3 xl-col-${config.gridColumns || 3}`}>
                {filteredProducts.map((product) => (
                  <ProductCard1 key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center w-100 py-5">
                No products found for this selection.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
