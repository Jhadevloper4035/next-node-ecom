"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useAppState } from "@/context/useAppState";
import { buildProductCustomizationGroups } from "@/data/categoryProductConfig";
import styles from "./ProductShowcase.module.css";

const formatLabel = (value = "") =>
  String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const optionPrice = (option) =>
  option?.priceOverride !== null && option?.priceOverride !== undefined
    ? option.priceOverride
    : option?.priceDelta || 0;

const isVisualGroup = (group) =>
  ["images", "swatches"].includes(group.inputType) ||
  group.options.some((option) => option.images?.[0] || option.swatch?.color || option.swatch?.image);

export default function ProductShowcase({ product }) {
  const optionGroups = useMemo(
    () => buildProductCustomizationGroups(product),
    [product],
  );

  const [selections, setSelections] = useState(() =>
    Object.fromEntries(
      optionGroups.map((group) => {
        const defaultOption =
          group.options.find((option) => option.isDefault) || group.options[0];
        return [group.key, defaultOption?.value || ""];
      }),
    ),
  );
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  const {
    addProductToCart,
    addToWishlist,
    isAddedtoWishlist,
    isAddedToCartProducts,
  } = useAppState();

  const selectedOptions = optionGroups
    .map((group) => ({
      ...group,
      selected: group.options.find(
        (option) => option.value === selections[group.key],
      ),
    }))
    .filter((group) => group.selected);

  let unitPrice = Number(product?.price ?? product?.basePrice ?? 0);
  selectedOptions.forEach((group) => {
    const selectedPrice = optionPrice(group.selected);
    if (group.selected.priceOverride !== null && group.selected.priceOverride !== undefined) {
      unitPrice = selectedPrice;
    } else {
      unitPrice += selectedPrice;
    }
  });

  const currency = product?.currency || "INR";
  const priceFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  const formatPrice = (value) => priceFormatter.format(Number(value || 0));

  const galleryItems = (product?.slideItems || [])
    .map((image, index) => ({
      id: image?.id || index + 1,
      src: image?.src,
      alt: image?.alt || `${product?.title || "Product"} image ${index + 1}`,
      width: image?.width || 900,
      height: image?.height || 1100,
    }))
    .filter((image) => image.src);
  if (galleryItems.length === 0 && product?.imgSrc) {
    galleryItems.push({
      id: 1,
      src: product.imgSrc,
      alt: product?.title || "Product image",
      width: 900,
      height: 1100,
    });
  }

  const cartItemId = [
    product?.id,
    ...selectedOptions.map((group) => `${group.key}:${group.selected.value}`),
  ]
    .filter(Boolean)
    .join("__");

  const configuredProduct = {
    ...product,
    id: cartItemId || product.id,
    productId: product.id,
    price: unitPrice,
    selectedOptions: [
      ...selectedOptions.map((group) => ({
        label: group.label,
        key: group.key,
        value: group.selected.label,
      })),
    ],
    specialInstructions: specialInstructions.trim(),
  };

  const addConfiguredProduct = () => {
    if (!product?.inStock && Number(product?.stock || 0) <= 0) return;
    addProductToCart(configuredProduct.id, quantity, true, configuredProduct);
  };

  const dimensions = product?.dimensions || {};
  const dimensionText = [dimensions.length, dimensions.width, dimensions.height]
    .filter((value) => value !== null && value !== undefined)
    .join(" × ");
  const hasDimensions = Boolean(dimensionText);
  const inStock = product?.inStock ?? Number(product?.stock || 0) > 0;

  return (
    <main className={styles.page}>
      <div className={`container ${styles.container}`}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          {product?.category?.slug ? (
            <Link href={`/shop-collection/${product.category.slug}`}>
              {product.category.name}
            </Link>
          ) : (
            <span>Products</span>
          )}
          <span>/</span>
          <span aria-current="page">{product.title}</span>
        </nav>

        <div className={styles.productLayout}>
          <section className={styles.gallery} aria-label="Product images">
            <div className={styles.galleryShell}>
              {galleryItems.length > 1 && (
                <Swiper
                  className={styles.thumbnailSwiper}
                  direction="vertical"
                  spaceBetween={10}
                  slidesPerView={Math.min(galleryItems.length, 6)}
                  watchSlidesProgress
                  onSwiper={setThumbsSwiper}
                  modules={[Thumbs]}
                  breakpoints={{
                    0: {
                      direction: "horizontal",
                      slidesPerView: Math.min(galleryItems.length, 5),
                    },
                    992: {
                      direction: "vertical",
                      slidesPerView: Math.min(galleryItems.length, 6),
                    },
                  }}
                >
                  {galleryItems.map((image, index) => (
                    <SwiperSlide key={`${image.src}-thumb-${index}`}>
                      <button
                        type="button"
                        className={styles.thumbnailButton}
                        aria-label={`Show ${product.title} image ${index + 1}`}
                      >
                        <Image
                          src={image.src}
                          alt=""
                          fill
                          sizes="84px"
                        />
                      </button>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}

              <div className={styles.mainGalleryWrap}>
                <Swiper
                  className={styles.mainSwiper}
                  spaceBetween={12}
                  slidesPerView={1}
                  navigation={{
                    nextEl: `.${styles.nextButton}`,
                    prevEl: `.${styles.prevButton}`,
                  }}
                  thumbs={{
                    swiper:
                      thumbsSwiper && !thumbsSwiper.destroyed
                        ? thumbsSwiper
                        : null,
                  }}
                  modules={[Navigation, Thumbs]}
                >
                  {galleryItems.map((image, index) => (
                    <SwiperSlide key={`${image.src}-main-${index}`}>
                      <a
                        className={styles.imageCard}
                        href={image.src}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${product.title} image ${index + 1}`}
                      >
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 991px) 92vw, 58vw"
                        />
                      </a>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {galleryItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      className={`${styles.galleryNavButton} ${styles.prevButton}`}
                      aria-label="Previous product image"
                    >
                      <span className="icon icon-arrLeft" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.galleryNavButton} ${styles.nextButton}`}
                      aria-label="Next product image"
                    >
                      <span className="icon icon-arrRight" />
                    </button>
                    <span className={styles.imageCount}>
                      <span className="icon icon-images" /> {galleryItems.length} images
                    </span>
                  </>
                )}
              </div>
            </div>
          </section>

          <aside className={styles.purchaseColumn}>
            <div className={styles.purchasePanel}>
              <div className={styles.eyebrowRow}>
                <span>{product?.category?.name || "Furniture"}</span>
                <span className={inStock ? styles.stock : styles.outOfStock}>
                  <i /> {inStock ? "In stock" : "Made to order"}
                </span>
              </div>

              <div className={styles.titleRow}>
                <div>
                  <h1>{product.title}</h1>
                  <div className={styles.ratingRow}>
                    <span className={styles.stars} aria-label={`${product.rating || 0} out of 5 stars`}>
                      {[0, 1, 2, 3, 4].map((star) => (
                        <span key={star} className={star < Math.round(product.rating || 0) ? styles.starFilled : ""}>★</span>
                      ))}
                    </span>
                    <span>{Number(product.rating || 0).toFixed(1)}</span>
                    <span className={styles.muted}>({product.reviewsCount || 0} reviews)</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`${styles.wishlist} ${
                    isAddedtoWishlist(product.id) ? styles.wishlistActive : ""
                  }`}
                  onClick={() => addToWishlist(product.id, configuredProduct)}
                  aria-label="Save product to wishlist"
                  aria-pressed={isAddedtoWishlist(product.id)}
                >
                  <span className="icon icon-heart" />
                </button>
              </div>

              <div className={styles.price}>{formatPrice(unitPrice)}</div>
              <p className={styles.taxNote}>Inclusive of all taxes</p>
              <p className={styles.intro}>{product.description}</p>

              <div className={styles.benefits}>
                <span><i className="icon icon-check" /> Crafted for comfort</span>
                <span><i className="icon icon-check" /> Quality checked</span>
              </div>

              {optionGroups.length > 0 && (
                <>
                  <div className={styles.divider} />

                  <div className={styles.customizeHeading}>
                    <strong>Customise your piece</strong>
                    <span>Selected options update the price</span>
                  </div>

                  {optionGroups.map((group) => {
                    const selectedOption = group.options.find(
                      (option) => option.value === selections[group.key],
                    );
                    const visual = isVisualGroup(group);

                    return (
                      <fieldset
                        className={
                          group.key === "size"
                            ? `${styles.optionGroup} ${styles.sizeGroup}`
                            : styles.formGroup
                        }
                        key={group.key}
                      >
                        <legend>
                          <span>{group.label}</span>
                          {selectedOption && <small>{formatLabel(selectedOption.label)}</small>}
                        </legend>

                        {group.description && <p className={styles.taxNote}>{group.description}</p>}

                        {group.key.includes("fabric") && (
                          <a className={styles.browseLink} href="/contact">
                            Browse fabrics or contact us for assistance
                          </a>
                        )}

                        {group.inputType === "select" ? (
                          <select
                            className={styles.selectInput}
                            value={selections[group.key] || ""}
                            onChange={(event) =>
                              setSelections((current) => ({
                                ...current,
                                [group.key]: event.target.value,
                              }))
                            }
                          >
                            {group.options.map((option) => (
                              <option value={option.value} key={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : visual ? (
                          <div className={styles.visualOptions}>
                            {group.options.map((option) => {
                              const isSelected = selections[group.key] === option.value;
                              const extraPrice = optionPrice(option);

                              return (
                                <button
                                  type="button"
                                  className={`${styles.visualOption} ${
                                    isSelected ? styles.visualSelected : ""
                                  }`}
                                  onClick={() =>
                                    setSelections((current) => ({
                                      ...current,
                                      [group.key]: option.value,
                                    }))
                                  }
                                  aria-pressed={isSelected}
                                  key={option.id}
                                >
                                  {(option.images?.[0] || option.swatch?.image) && (
                                    <span className={styles.optionVisual}>
                                      <Image
                                        src={option.images?.[0] || option.swatch.image}
                                        alt=""
                                        fill
                                        sizes="90px"
                                      />
                                    </span>
                                  )}
                                  {!option.images?.[0] && option.swatch?.color && (
                                    <span
                                      className={styles.swatchPreview}
                                      style={{ backgroundColor: option.swatch.color }}
                                    />
                                  )}
                                  <strong>{option.label}</strong>
                                  <small>
                                    {extraPrice > 0 ? `+${formatPrice(extraPrice)}` : "Included"}
                                  </small>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className={group.key === "size" ? styles.optionGrid : styles.radioList}>
                            {group.options.map((option) => {
                              const isSelected = selections[group.key] === option.value;
                              const extraPrice = optionPrice(option);

                              if (group.key === "size") {
                                return (
                                  <button
                                    type="button"
                                    className={`${styles.optionButton} ${
                                      isSelected ? styles.optionSelected : ""
                                    }`}
                                    onClick={() =>
                                      setSelections((current) => ({
                                        ...current,
                                        [group.key]: option.value,
                                      }))
                                    }
                                    aria-pressed={isSelected}
                                    key={option.id}
                                  >
                                    <span>{option.label}</span>
                                    {extraPrice > 0 && <small>+{formatPrice(extraPrice)}</small>}
                                  </button>
                                );
                              }

                              return (
                                <label className={styles.radioChoice} key={option.id}>
                                  <input
                                    type="radio"
                                    name={`${group.key}-${product.id}`}
                                    value={option.value}
                                    checked={isSelected}
                                    onChange={() =>
                                      setSelections((current) => ({
                                        ...current,
                                        [group.key]: option.value,
                                      }))
                                    }
                                  />
                                  <i />
                                  <span>{option.label}</span>
                                  <small>
                                    {extraPrice > 0 ? `+${formatPrice(extraPrice)}` : "Included"}
                                  </small>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </fieldset>
                    );
                  })}
                </>
              )}

              <label className={styles.instructions}>
                <span>Special instructions, if any</span>
                <textarea
                  rows="2"
                  value={specialInstructions}
                  onChange={(event) => setSpecialInstructions(event.target.value)}
                  placeholder="Tell us anything we should know about your order"
                />
              </label>

              <div className={styles.orderRow}>
                <div className={styles.quantity} aria-label="Quantity selector">
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => value + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={addConfiguredProduct}
                  disabled={!inStock}
                >
                  <span>
                    {inStock
                      ? isAddedToCartProducts(configuredProduct.id)
                        ? "Add Another"
                        : "Add To Cart"
                      : "Out of stock"}
                  </span>
                  {inStock && <strong>{formatPrice(unitPrice * quantity)}</strong>}
                </button>
              </div>

              <p className={styles.checkoutHint}>
                <span className="icon icon-lock" /> Secure checkout · No account required
              </p>

              <div className={styles.serviceList}>
                <div>
                  <span className="icon icon-truck" />
                  <p><strong>Delivery</strong><small>Calculated for your address at checkout</small></p>
                </div>
                <div>
                  <span className="icon icon-arrowClockwise" />
                  <p><strong>Easy support</strong><small>We’ll help with delivery or product concerns</small></p>
                </div>
                <div>
                  <span className="icon icon-shield-check" />
                  <p><strong>Warranty</strong><small>{product.warranty ? product.warranty.split(":")[0] : "Quality assurance included"}</small></p>
                </div>
              </div>

              <div className={styles.accordions}>
                <details open>
                  <summary>Product details</summary>
                  <div>
                    <dl>
                      <dt>SKU</dt><dd>{String(product.id || "").slice(-8).toUpperCase()}</dd>
                      {hasDimensions && <><dt>Dimensions</dt><dd>{dimensionText} {dimensions.unit || "cm"}</dd></>}
                      {product.weight?.value && <><dt>Weight</dt><dd>{product.weight.value} {product.weight.unit || "kg"}</dd></>}
                      <dt>Assembly</dt><dd>{product.assemblyRequired ? "Required" : "Not required"}</dd>
                    </dl>
                  </div>
                </details>
                {product.careInstructions?.length > 0 && (
                  <details>
                    <summary>Care instructions</summary>
                    <div>
                      <ul>{product.careInstructions.map((item) => <li key={item}>{item}</li>)}</ul>
                    </div>
                  </details>
                )}
                <details>
                  <summary>Shipping &amp; returns</summary>
                  <div>
                    Delivery timing and charges are shown at checkout. Returns are subject to inspection and approval.
                  </div>
                </details>
              </div>
            </div>
          </aside>
        </div>

       
      </div>

      <div className={styles.mobileOrderBar}>
        <div><small>Total</small><strong>{formatPrice(unitPrice * quantity)}</strong></div>
        <button type="button" onClick={addConfiguredProduct} disabled={!inStock}>
          {inStock ? "Add To Cart" : "Out of stock"}
        </button>
      </div>
    </main>
  );
}
