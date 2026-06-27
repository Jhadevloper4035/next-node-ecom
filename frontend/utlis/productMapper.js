const firstImage = (product, index = 0) => {
  const image = product?.images?.[index];
  if (!image) return "";
  return typeof image === "string" ? image : image.url || "";
};

const optionValues = (options = []) =>
  options
    .map((option) => option?.label || option?.value || option)
    .filter(Boolean);

const colorsFromTags = (tags = []) =>
  tags
    .filter((tag) => typeof tag === "string" && tag.startsWith("color:"))
    .map((tag) => tag.split(":").slice(1).join(":").trim())
    .filter(Boolean);

export const mapProductForCard = (product = {}) => {
  const id = product.id || product._id;
  const imgSrc = product.imgSrc || firstImage(product, 0) || "/images/placeholder.svg";
  const imgHover = product.imgHover || firstImage(product, 1) || imgSrc;
  const price = Number(product.price ?? product.basePrice ?? 0);
  const sizeOptions = product.optionPricing?.sizes || product.sizes || [];
  const filterBrands = product.filterBrands || (product.brand ? [product.brand] : []);

  return {
    ...product,
    id,
    price,
    imgSrc,
    imgHover,
    title: product.title || product.name || "Product",
    slug: product.slug,
    inStock: product.inStock ?? product.stock > 0,
    filterColor: product.filterColor || colorsFromTags(product.tags),
    filterSizes: product.filterSizes || optionValues(sizeOptions),
    filterBrands,
  };
};

export const mapProductsForCards = (products = []) => products.map(mapProductForCard);

export const loadRecentlyViewedProducts = () => {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem("recentlyVisitedProducts") || "[]");
    return Array.isArray(parsed) ? parsed.map(mapProductForCard) : [];
  } catch {
    return [];
  }
};

export const saveRecentlyViewedProduct = (product) => {
  if (typeof window === "undefined" || !product) return;

  const mapped = mapProductForCard(product);
  const recent = loadRecentlyViewedProducts();
  const filtered = recent.filter((item) => String(item.id) !== String(mapped.id));
  const updated = [mapped, ...filtered].slice(0, 10);

  localStorage.setItem("recentlyVisitedProducts", JSON.stringify(updated));
  window.dispatchEvent(new Event("recentlyVisitedUpdated"));
};
