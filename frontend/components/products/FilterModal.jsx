"use client";

import Link from "next/link";
import RangeSlider from "react-range-slider-input";

const slugify = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const unique = (values) =>
  [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];

export default function FilterModal({ allProps }) {
  const products = allProps.products || [];
  const prices = products.map((product) => product.price).filter(Number.isFinite);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 100000;
  const sliderMax = minPrice === maxPrice ? maxPrice + 1 : maxPrice;

  const categories = unique(
    products.map((product) => product.category?.name || product.category?.slug),
  ).map((name) => ({
    name,
    slug: slugify(name),
    count: products.filter(
      (product) =>
        (product.category?.name || product.category?.slug || "") === name,
    ).length,
  }));

  const sizes = unique(products.flatMap((product) => product.filterSizes || []));
  const colors = unique(products.flatMap((product) => product.filterColor || [])).map((name) => ({
    name,
    className: "",
  }));
  const brands = unique(products.flatMap((product) => product.filterBrands || [])).map((label) => ({
    label,
    count: products.filter((product) => product.filterBrands?.includes(label)).length,
  }));
  const availabilityOptions = [
    {
      label: "In stock",
      value: true,
      count: products.filter((product) => product.inStock).length,
    },
    {
      label: "Made to order",
      value: false,
      count: products.filter((product) => !product.inStock).length,
    },
  ];

  return (
    <div className="offcanvas offcanvas-start canvas-filter" id="filterShop">
      <div className="canvas-wrapper">
        <div className="canvas-header">
          <h5>Filters</h5>
          <span
            className="icon-close icon-close-popup"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="canvas-body">
          <div className="widget-facet facet-categories">
            <h6 className="facet-title">Product Categories</h6>
            <ul className="facet-content">
              {categories.map((category, index) => (
                <li key={index}>
                  <Link href={`/collections/${category.slug}`} className={`categories-item`}>
                    {category.name}{" "}
                    <span className="count-cate">({category.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="widget-facet facet-price">
            <h6 className="facet-title">Price</h6>

            <RangeSlider
              min={minPrice}
              max={sliderMax}
              value={allProps.price}
              onInput={(value) => allProps.setPrice(value)}
            />
            <div className="box-price-product mt-3">
              <div className="box-price-item">
                <span className="title-price">Min price</span>
                <div
                  className="price-val"
                  id="price-min-value"
                  data-currency="$"
                >
                  {allProps.price[0]}
                </div>
              </div>
              <div className="box-price-item">
                <span className="title-price">Max price</span>
                <div
                  className="price-val"
                  id="price-max-value"
                  data-currency="$"
                >
                  {allProps.price[1]}
                </div>
              </div>
            </div>
          </div>
          <div className="widget-facet facet-size">
            <h6 className="facet-title">Size</h6>
            <div className="facet-size-box size-box">
              {sizes.map((size, index) => (
                <span
                  key={index}
                  onClick={() => allProps.setSize(size)}
                  className={`size-item size-check ${
                    allProps.size === size ? "active" : ""
                  }`}
                >
                  {size}
                </span>
              ))}
              <span
                className={`size-item size-check free-size ${
                  allProps.size == "Free Size" ? "active" : ""
                } `}
                onClick={() => allProps.setSize("Free Size")}
              >
                Free Size
              </span>
            </div>
          </div>
          <div className="widget-facet facet-color">
            <h6 className="facet-title">Colors</h6>
            <div className="facet-color-box">
              {colors.map((color, index) => (
                <div
                  onClick={() => allProps.setColor(color)}
                  key={index}
                  className={`color-item color-check ${
                    color == allProps.color ? "active" : ""
                  }`}
                >
                  <span className={`color ${color.className}`} />
                  {color.name}
                </div>
              ))}
            </div>
          </div>
          <div className="widget-facet facet-fieldset">
            <h6 className="facet-title">Availability</h6>
            <div className="box-fieldset-item">
              {availabilityOptions.map((option, index) => (
                <fieldset
                  key={index}
                  className="fieldset-item"
                  onClick={() => allProps.setAvailability(option)}
                >
                  <input
                    type="radio"
                    name="availability"
                    className="tf-check"
                    readOnly
                    checked={allProps.availability === option}
                  />
                  <label>
                    {option.label}{" "}
                    <span className="count-stock">
                      (
                      {option.count}
                      )
                    </span>
                  </label>
                </fieldset>
              ))}
            </div>
          </div>
          <div className="widget-facet facet-fieldset">
            <h6 className="facet-title">Brands</h6>
            <div className="box-fieldset-item">
              {brands.map((brand, index) => (
                <fieldset
                  key={index}
                  className="fieldset-item"
                  onClick={() => allProps.setBrands(brand.label)}
                >
                  <input
                    type="checkbox"
                    name="brand"
                    className="tf-check"
                    readOnly
                    checked={allProps.brands.includes(brand.label)}
                  />
                  <label>
                    {brand.label}{" "}
                    <span className="count-brand">
                      (
                      {brand.count}
                      )
                    </span>
                  </label>
                </fieldset>
              ))}
            </div>
          </div>
        </div>
        <div className="canvas-bottom">
          <button
            id="reset-filter"
            onClick={allProps.clearFilter}
            className="tf-btn btn-reset"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
