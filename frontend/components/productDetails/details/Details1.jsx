"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Slider1 from "../sliders/Slider1";
import QuantitySelect from "../QuantitySelect";
import { useAppState } from "@/context/useAppState";
import ProductStikyBottom from "../ProductStikyBottom";
import { buildProductCustomizationGroups } from "@/data/categoryProductConfig";
import styles from "../ProductOptions.module.css";

const optionPrice = (option) =>
  option?.priceOverride !== null && option?.priceOverride !== undefined
    ? Number(option.priceOverride || 0)
    : Number(option?.priceDelta || 0);

const optionIsOverride = (option) =>
  option?.priceOverride !== null && option?.priceOverride !== undefined;

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatCategoryLabel = (product) => {
  const label =
    product?.category?.name ||
    product?.category?.slug ||
    product?.category ||
    "Product";

  return String(label)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const singularCategoryLabel = (label) => {
  if (/chairs/i.test(label)) return "Chair";
  if (/tables/i.test(label)) return label.replace(/s$/i, "");
  if (/sofas/i.test(label)) return "Sofa";
  if (/beds/i.test(label)) return "Bed";
  return label.replace(/s$/i, "");
};

const hasVisualOptions = (group) =>
  ["images", "swatches"].includes(group.inputType) ||
  group.options.some(
    (option) => option.images?.[0] || option.swatch?.image || option.swatch?.color,
  );

const firstColorTag = (product) =>
  (product?.tags || [])
    .find((tag) => typeof tag === "string" && tag.toLowerCase().startsWith("color:"))
    ?.split(":")
    .slice(1)
    .join(":")
    .trim() || "";

const getDefaultSelections = (groups) =>
  Object.fromEntries(
    groups.map((group) => {
      const defaultOption =
        group.options.find((option) => option.isDefault) || group.options[0];
      return [group.key, defaultOption?.value || ""];
    }),
  );

export default function Details1({ product }) {
  const [activeColor, setActiveColor] = useState("gray");
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const customizationGroups = useMemo(
    () => buildProductCustomizationGroups(product),
    [product],
  );
  const [selections, setSelections] = useState(() =>
    getDefaultSelections(customizationGroups),
  );

  const {
    addProductToCart,
    isAddedToCartProducts,
    addToWishlist,
    isAddedtoWishlist,
    isAddedtoCompareItem,
    addToCompareItem,
    cartProducts,
    updateQuantity,
  } = useAppState();

  useEffect(() => {
    const color = firstColorTag(product);
    if (color) {
      setActiveColor(color);
    } else if (product?.colors?.[0]) {
      const firstColor = product.colors[0];
      setActiveColor(
        typeof firstColor === "string"
          ? firstColor
          : firstColor.color || firstColor.bgColor?.replace("bg-", "") || "",
      );
    } else {
      setActiveColor("");
    }
  }, [product]);

  useEffect(() => {
    setSelections(getDefaultSelections(customizationGroups));
    setSpecialInstructions("");
    setQuantity(1);
  }, [product?.id, customizationGroups]);

  const selectedGroups = customizationGroups
    .map((group) => ({
      ...group,
      selected: group.options.find((option) => option.value === selections[group.key]),
    }))
    .filter((group) => group.selected);

  let totalPrice = Number(product?.price ?? product?.basePrice ?? 0);
  selectedGroups.forEach((group) => {
    const selectedPrice = optionPrice(group.selected);
    if (optionIsOverride(group.selected)) {
      totalPrice = selectedPrice;
    } else {
      totalPrice += selectedPrice;
    }
  });

  const selectedOptions = [
    ...selectedGroups.map((group) => ({
      key: group.key,
      label: group.label,
      value: group.selected.label,
    })),
    activeColor ? { key: "color", label: "Color", value: activeColor } : null,
  ].filter(Boolean);

  const cartItemId = [
    product?.id,
    ...selectedOptions.map((option) => `${option.key}:${option.value}`),
  ]
    .filter(Boolean)
    .join("__");
  const cartItem = cartProducts.find((item) => String(item.id) === String(cartItemId));
  const quantityValue = cartItem ? cartItem.quantity : quantity;
  const categoryLabel = formatCategoryLabel(product);
  const customizeLabel = singularCategoryLabel(categoryLabel);

  const updateSelection = (key, value) => {
    setSelections((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const configuredProduct = {
    ...product,
    id: cartItemId || product.id,
    productId: product.id,
    price: totalPrice,
    selectedOptions,
    specialInstructions: specialInstructions.trim(),
  };

  const addConfiguredProduct = () => {
    addProductToCart(configuredProduct.id, quantity, true, configuredProduct);
  };

  const renderGroup = (group) => {
    const selectedOption = group.options.find(
      (option) => option.value === selections[group.key],
    );
    const isSize = group.key === "size";
    const isVisual = hasVisualOptions(group);
    const isRadio = group.key.includes("foam") || group.key.includes("density");

    return (
      <div className={styles.customGroup} key={group.key}>
        <div className={styles.customLabelRow}>
          <div>
            <div className={styles.customLabel}>{group.label}</div>
            {group.description && (
              <p className={styles.customHint}>{group.description}</p>
            )}
          </div>
          {selectedOption && (
            <span className={styles.selectedPill}>{selectedOption.label}</span>
          )}
        </div>

        {(isSize || group.inputType === "select") && (
          <select
            className={styles.selectControl}
            value={selections[group.key] || ""}
            onChange={(event) => updateSelection(group.key, event.target.value)}
          >
            {group.options.map((option) => (
              <option value={option.value} key={option.id || option.value}>
                {option.label}
                {optionPrice(option) > 0 ? ` (${formatPrice(optionPrice(option))})` : ""}
              </option>
            ))}
          </select>
        )}

        {!isSize && group.inputType !== "select" && isVisual && (
          <div className={styles.visualGrid}>
            {group.options.map((option) => {
              const selected = selections[group.key] === option.value;
              const image = option.images?.[0] || option.swatch?.image;
              return (
                <button
                  type="button"
                  className={`${styles.visualChoice} ${
                    selected ? styles.selectedChoice : ""
                  }`}
                  onClick={() => updateSelection(group.key, option.value)}
                  aria-pressed={selected}
                  key={option.id || option.value}
                >
                  <span className={styles.visualThumb}>
                    {image ? (
                      <Image src={image} alt="" fill sizes="74px" />
                    ) : (
                      <i
                        style={{
                          backgroundColor: option.swatch?.color || "#eeeae3",
                        }}
                      />
                    )}
                  </span>
                  <span>{option.label}</span>
                  {optionPrice(option) > 0 && <small>{formatPrice(optionPrice(option))}</small>}
                </button>
              );
            })}
          </div>
        )}

        {!isSize && group.inputType !== "select" && !isVisual && (
          <div className={isRadio ? styles.radioGrid : styles.choiceGrid}>
            {group.options.map((option) => {
              const selected = selections[group.key] === option.value;
              return (
                <button
                  type="button"
                  className={`${isRadio ? styles.radioChoice : styles.textChoice} ${
                    selected ? styles.selectedChoice : ""
                  }`}
                  onClick={() => updateSelection(group.key, option.value)}
                  aria-pressed={selected}
                  key={option.id || option.value}
                >
                  {isRadio && <i />}
                  <span>{option.label}</span>
                  {optionPrice(option) > 0 && <small>{formatPrice(optionPrice(option))}</small>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="flat-spacing">
      <div className="tf-main-product section-image-zoom">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="tf-product-media-wrap sticky-top">
                <Slider1
                  setActiveColor={setActiveColor}
                  activeColor={activeColor}
                  firstItem={product.imgSrc}
                  slideItems={product.slideItems}
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="tf-product-info-wrap position-relative mw-100p-hidden">
                <div className="tf-zoom-main" />
                <div className="tf-product-info-list other-image-zoom">
                  <div className="tf-product-info-heading">
                    <div className="tf-product-info-name">
                      <div className="text text-btn-uppercase">{categoryLabel}</div>
                      <h1 className="name">{product.title}</h1>
                      <div className="sub">
                        <div className="tf-product-info-rate">
                          <div className="list-star">
                            {[...Array(5)].map((_, i) => (
                              <i
                                key={i}
                                className={`icon icon-star ${
                                  i < Math.floor(product.rating || 5) ? "" : "text-secondary"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text text-caption-1">
                            {product.rating && <span className="fw-6 me-1">{product.rating}</span>}
                            ({product.reviewsCount || 0} reviews)
                          </div>
                        </div>
                        <div className="tf-product-info-sold">
                          <i className="icon icon-lightning" />
                          <div className="text text-caption-1">In Stock: {product.stock}</div>
                        </div>
                      </div>
                    </div>
                    <div className="tf-product-info-desc">
                      <div className="tf-product-info-price">
                        <h5 className="price-on-sale font-2">{formatPrice(totalPrice)}</h5>
                      </div>
                      {product.description && <p>{product.description}</p>}
                      <div className="tf-product-info-liveview">
                        <i className="icon icon-eye" />
                        <p className="text-caption-1">
                          <span className="liveview-count">21</span> people are viewing this right now
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`tf-product-info-choose-option ${styles.customPanel}`}>
                    <div className={styles.panelTitle}>
                      <h6>Customise your {customizeLabel}</h6>
                      <span>{selectedOptions.length} selected</span>
                    </div>

                    {customizationGroups.map(renderGroup)}

                    <hr/>

                    <label className={styles.instructions}>
                      <span>Special instructions, if any</span>
                      <textarea
                        rows="2"
                        value={specialInstructions}
                        onChange={(event) => setSpecialInstructions(event.target.value)}
                        placeholder="Tell us anything we should know about your order"
                      />
                    </label>

                    <div className={styles.cartRow}>
                      <QuantitySelect
                        quantity={quantityValue}
                        setQuantity={(qty) => {
                          if (cartItem) {
                            updateQuantity(cartItemId, qty);
                          } else {
                            setQuantity(qty);
                          }
                        }}
                      />

                      <button
                        type="button"
                        className={styles.addButton}
                        onClick={addConfiguredProduct}
                      >
                        <span>
                          {isAddedToCartProducts(cartItemId) ? "Add Another" : "Add To Cart"}
                        </span>
                        <strong>{formatPrice(totalPrice * quantityValue)}</strong>
                      </button>
                    </div>

                    <div className={`tf-product-info-by-btn mb_10 ${styles.iconActions}`}>
                      <a
                        href="#compare"
                        data-bs-toggle="offcanvas"
                        aria-controls="compare"
                        onClick={() => addToCompareItem(product.id, product)}
                        className="box-icon hover-tooltip compare btn-icon-action"
                      >
                        <span className="icon icon-gitDiff" />
                        <span className="tooltip text-caption-2">
                          {isAddedtoCompareItem(product.id) ? "Already compared" : "Compare"}
                        </span>
                      </a>
                      <a
                        onClick={() => addToWishlist(product.id, configuredProduct)}
                        className="box-icon hover-tooltip text-caption-2 wishlist btn-icon-action"
                      >
                        <span className="icon icon-heart" />
                        <span className="tooltip text-caption-2">
                          {isAddedtoWishlist(product.id) ? "Already Wishlisted" : "Wishlist"}
                        </span>
                      </a>
                    </div>

                    <div className="tf-product-info-help">
                      <div className="tf-product-info-extra-link">
                        <a
                          href="#delivery_return"
                          data-bs-toggle="modal"
                          className="tf-product-extra-icon"
                        >
                          <div className="icon">
                            <i className="icon-shipping" />
                          </div>
                          <p className="text-caption-1">Delivery &amp; Return</p>
                        </a>
                        <a
                          href="#ask_question"
                          data-bs-toggle="modal"
                          className="tf-product-extra-icon"
                        >
                          <div className="icon">
                            <i className="icon-question" />
                          </div>
                          <p className="text-caption-1">Ask A Question</p>
                        </a>
                        <a
                          href="#share_social"
                          data-bs-toggle="modal"
                          className="tf-product-extra-icon"
                        >
                          <div className="icon">
                            <i className="icon-share" />
                          </div>
                          <p className="text-caption-1">Share</p>
                        </a>
                      </div>
                      <div className="tf-product-info-time">
                        <div className="icon">
                          <i className="icon-timer" />
                        </div>
                        <p className="text-caption-1">
                          Estimated Delivery:&nbsp;&nbsp;<span>Shown at checkout</span>
                        </p>
                      </div>
                      <div className="tf-product-info-return">
                        <div className="icon">
                          <i className="icon-arrowClockwise" />
                        </div>
                        <p className="text-caption-1">
                          Returns subject to <span>inspection and approval</span>.
                        </p>
                      </div>
                    </div>

                    <ul className="tf-product-info-sku">
                      <li>
                        <p className="text-caption-1">SKU:</p>
                        <p className="text-caption-1 text-1">
                          {(product.id || "").toString().slice(-8).toUpperCase()}
                        </p>
                      </li>
                      <li>
                        <p className="text-caption-1">Vendor:</p>
                        <p className="text-caption-1 text-1">Curve &amp; Comfort</p>
                      </li>
                      <li>
                        <p className="text-caption-1">Available:</p>
                        <p className="text-caption-1 text-1">
                          {product.stock > 0 ? "In Stock" : "Out of Stock"}
                        </p>
                      </li>
                      <li>
                        <p className="text-caption-1">Categories:</p>
                        <p className="text-caption-1">
                          {product.category && (
                            <a
                              href={`/collections/${product.category.slug}`}
                              className="text-1 link text-capitalize"
                            >
                              {product.category.name}
                            </a>
                          )}
                          {product.subcategories?.map((sub, i) => (
                            <React.Fragment key={sub._id || i}>
                              ,{" "}
                              <a
                                href={`/collections/${product.category?.slug}/${sub.slug}`}
                                className="text-1 link text-capitalize"
                              >
                                {sub.name}
                              </a>
                            </React.Fragment>
                          ))}
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ProductStikyBottom product={{ ...product, price: totalPrice }} />
    </section>
  );
}
