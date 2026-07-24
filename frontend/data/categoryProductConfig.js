const FABRIC_OPTIONS = [
  "Suede",
  "Velvet",
  "Boucle",
  "Fur",
  "Jute",
  "Linen",
  "Printed",
  "Textured",
  "Leatherette",
  "Choose Later",
];

const FOAM_DENSITY_OPTIONS = [
  { value: "28-very-soft", label: "28 - Very Soft" },
  { value: "32-medium-soft", label: "32 - Medium Soft" },
  { value: "40-hard", label: "40 - Hard" },
];

const fabricGroup = {
  key: "fabric-types",
  label: "Fabric Types",
  inputType: "buttons",
  source: "optionPricing.fabrics",
  options: FABRIC_OPTIONS.map((label) => ({
    value: slugify(label),
    label,
  })),
};

const foamDensityGroup = {
  key: "foam-density",
  label: "Foam Density",
  inputType: "buttons",
  source: "optionPricing.foams",
  options: FOAM_DENSITY_OPTIONS,
};

const CATEGORY_PRODUCT_CONFIG = {
  sofas: {
    label: "Sofas",
    gridColumns: 3,
    filters: ["price", "availability", "color", "size", "fabric-types", "foam-density"],
    customizationGroups: [
      {
        key: "size",
        label: "Size",
        inputType: "buttons",
        source: "optionPricing.sizes",
        options: [
          { value: "2-seater-66-inch", label: "2 Seater (66\")" },
          { value: "3-seater-86-inch", label: "3 Seater (86\")" },
          { value: "3-seater-large-96-inch", label: "3 Seater Large (96\")" },
          { value: "4-seater-106-inch", label: "4 Seater (106\")" },
        ],
      },
      foamDensityGroup,
      {
        key: "material",
        label: "Material",
        inputType: "buttons",
        source: "optionPricing.materials",
      },
      fabricGroup,
    ],
  },
  beds: {
    label: "Beds",
    gridColumns: 3,
    filters: ["price", "availability", "size"],
    customizationGroups: [
      {
        key: "size",
        label: "Size",
        inputType: "buttons",
        source: "optionPricing.sizes",
        options: ["Queen", "King", "Super King"].map((label) => ({
          value: slugify(label),
          label,
        })),
      },
    ],
  },
  "chairs-and-ottomans": {
    label: "Chairs & Ottomans",
    gridColumns: 3,
    filters: ["price", "availability", "color", "fabric-types", "foam-density"],
    customizationGroups: [foamDensityGroup, fabricGroup],
  },
  "chairs-ottomans": {
    label: "Chairs & Ottomans",
    gridColumns: 3,
    filters: ["price", "availability", "color", "fabric-types", "foam-density"],
    customizationGroups: [foamDensityGroup, fabricGroup],
  },
  "coffee-tables": {
    label: "Coffee Tables",
    gridColumns: 3,
    filters: ["price", "availability", "material"],
    customizationGroups: [
      {
        key: "material",
        label: "Material",
        inputType: "buttons",
        source: "optionPricing.materials",
      },
    ],
  },
  "console-tables": {
    label: "Console Tables",
    gridColumns: 3,
    filters: ["price", "availability", "material"],
    customizationGroups: [
      {
        key: "material",
        label: "Material",
        inputType: "buttons",
        source: "optionPricing.materials",
      },
    ],
  },
  "nester-tables": {
    label: "Nester Tables",
    gridColumns: 3,
    filters: ["price", "availability", "material"],
    customizationGroups: [
      {
        key: "material",
        label: "Material",
        inputType: "buttons",
        source: "optionPricing.materials",
      },
    ],
  },
  "wall-decor": {
    label: "Wall Decor",
    gridColumns: 3,
    filters: ["price", "availability", "material"],
    customizationGroups: [
      {
        key: "material",
        label: "Material",
        inputType: "buttons",
        source: "optionPricing.materials",
      },
    ],
  },
  kitchen: {
    label: "Kitchen",
    gridColumns: 3,
    filters: ["price", "availability", "material"],
    customizationGroups: [
      {
        key: "material",
        label: "Material",
        inputType: "buttons",
        source: "optionPricing.materials",
      },
    ],
  },
  wardrobe: {
    label: "Wardrobe",
    gridColumns: 3,
    filters: ["price", "availability", "material"],
    customizationGroups: [
      {
        key: "material",
        label: "Material",
        inputType: "buttons",
        source: "optionPricing.materials",
      },
    ],
  },
  wardrobes: {
    label: "Wardrobes",
    gridColumns: 3,
    filters: ["price", "availability", "material"],
    customizationGroups: [
      {
        key: "material",
        label: "Material",
        inputType: "buttons",
        source: "optionPricing.materials",
      },
    ],
  },
};

const DEFAULT_CATEGORY_CONFIG = {
  label: "Products",
  gridColumns: 3,
  filters: ["price", "availability", "color", "size", "material"],
  customizationGroups: [
    { key: "size", label: "Size", inputType: "buttons", source: "optionPricing.sizes" },
    { key: "material", label: "Material", inputType: "buttons", source: "optionPricing.materials" },
    { key: "foam-density", label: "Foam", inputType: "buttons", source: "optionPricing.foams" },
    { key: "fabric-types", label: "Fabric", inputType: "buttons", source: "optionPricing.fabrics" },
  ],
};

export function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCategoryProductConfig(categorySlug) {
  return CATEGORY_PRODUCT_CONFIG[slugify(categorySlug)] || DEFAULT_CATEGORY_CONFIG;
}

const normalizeOption = (option, index = 0) => {
  const label = option?.label || option?.value || `Option ${index + 1}`;
  return {
    id: option?._id || `${slugify(option?.value || label)}-${index}`,
    value: option?.value || slugify(label),
    label,
    description: option?.description || "",
    priceDelta: Number(option?.priceDelta || 0),
    priceOverride:
      option?.priceOverride === null || option?.priceOverride === undefined
        ? null
        : Number(option.priceOverride),
    images: Array.isArray(option?.images)
      ? option.images.filter(Boolean)
      : option?.image
        ? [option.image]
        : [],
    swatch: option?.swatch || null,
    isDefault: Boolean(option?.isDefault),
    isActive: option?.isActive !== false,
  };
};

const sourceOptions = (product, source) => {
  if (!source) return [];
  if (source === "optionPricing.sizes") return product?.optionPricing?.sizes || [];
  if (source === "optionPricing.materials") return product?.optionPricing?.materials || [];
  if (source === "optionPricing.foams") return product?.optionPricing?.foams || [];
  if (source === "optionPricing.fabrics") return product?.optionPricing?.fabrics || [];
  return [];
};

const normalizeGroup = (group, product) => {
  const sourcedOptions = group.source ? sourceOptions(product, group.source) : [];
  const rawOptions = sourcedOptions.length ? sourcedOptions : group.options;
  const options = (rawOptions || []).map(normalizeOption).filter((option) => option.isActive);

  return {
    ...group,
    key: slugify(group.key),
    label: group.label || group.key,
    inputType: group.inputType || "buttons",
    options,
  };
};

export function buildProductCustomizationGroups(product = {}) {
  const categorySlug =
    product.category?.slug ||
    product.categorySlug ||
    product.category?.name ||
    product.category ||
    "";
  const config = getCategoryProductConfig(categorySlug);
  const hasOptionPricing = Object.values(product.optionPricing || {}).some(
    (options) => Array.isArray(options) && options.length,
  );

  if (!hasOptionPricing && Array.isArray(product.customizationGroups) && product.customizationGroups.length) {
    return product.customizationGroups
      .map((group) => normalizeGroup(group, product))
      .filter((group) => group.options.length);
  }

  return config.customizationGroups
    .map((group) => normalizeGroup(group, product))
    .filter((group) => group.options.length);
}

export function productHasOptionValue(product, optionValue) {
  const target = slugify(optionValue);
  const groups = buildProductCustomizationGroups(product);

  return groups.some((group) =>
    group.options.some((option) => slugify(option.value) === target || slugify(option.label) === target),
  );
}

export function tagValue(product, prefix) {
  const tag = (product.tags || []).find(
    (item) => typeof item === "string" && item.toLowerCase().startsWith(`${prefix}:`),
  );
  return tag ? tag.split(":").slice(1).join(":").trim() : "";
}
