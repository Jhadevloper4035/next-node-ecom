/**
 * transformProducts.js
 *
 * Usage:
 *  node transformProducts.js ./data/products.json ./data/products.transformed.json
 *
 * What it does:
 *  - Reads your incoming JSON { products: [...] }
 *  - Transforms each product into your Mongoose schema shape (structure)
 *  - Keeps category/subcategory as strings (NOT ObjectIds) for now
 *  - Generates slug
 *  - Adds optionPricing: sizes/materials/foams/fabrics (3 fabrics)
 *  - priceDelta cycles: 10% / 5% / 20% of basePrice
 *  - Adds 1 image from product images array into each option item (cycled)
 *  - Writes transformed output JSON to a file
 */

const fs = require("fs");
const path = require("path");

// ---------- helpers ----------
function slugify(str = "") {
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Cycles through % deltas 10%, 5%, 20%
const PCTS = [0.1, 0.05, 0.2];

function buildOptions({ values, basePrice, images = [], startIndex = 0 }) {
  const opts = [];
  let imgIdx = startIndex;

  for (let i = 0; i < values.length; i++) {
    const label = String(values[i] ?? "").trim();
    if (!label) continue;

    const pct = PCTS[i % PCTS.length];
    const priceDelta = Math.round(basePrice * pct);

    const oneImage = images.length ? [images[imgIdx % images.length]] : [];
    imgIdx++;

    opts.push({
      value: slugify(label),
      label,
      priceDelta,
      priceOverride: null,
      images: oneImage,
      isActive: true,
    });
  }

  return { opts, nextImgIndex: imgIdx };
}

const FABRIC_VALUES = [
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

const SOFA_SIZE_VALUES = [
  { value: "2-seater-66-inch", label: '2 Seater (66")' },
  { value: "3-seater-86-inch", label: '3 Seater (86")', isDefault: true },
  { value: "3-seater-large-96-inch", label: '3 Seater Large (96")' },
  { value: "4-seater-106-inch", label: '4 Seater (106")' },
];

const BED_SIZE_VALUES = [
  { value: "queen", label: "Queen" },
  { value: "king", label: "King", isDefault: true },
  { value: "super-king", label: "Super King" },
];

const FOAM_DENSITY_VALUES = [
  { value: "28-very-soft", label: "28 - Very Soft" },
  { value: "32-medium-soft", label: "32 - Medium Soft", isDefault: true },
  { value: "40-hard", label: "40 - Hard" },
];

const FOAM_QUALITY_VALUES = [
  { value: "hr", label: "HR", isDefault: true },
  { value: "pu", label: "PU" },
  { value: "latex", label: "Latex" },
];

function normalizeOptionInput(input) {
  if (typeof input === "string") {
    return { value: slugify(input), label: input };
  }

  const label = String(input?.label || input?.value || "").trim();
  return {
    value: String(input?.value || slugify(label)).trim(),
    label,
    isDefault: Boolean(input?.isDefault),
  };
}

function groupOptions(values, images = []) {
  return values.map((value, index) => {
    const option = normalizeOptionInput(value);

    return {
      value: option.value,
      label: option.label,
      description: "",
      priceDelta: 0,
      priceOverride: null,
      images: images.length ? [images[index % images.length]] : [],
      swatch: {
        color: "",
        image: "",
      },
      isDefault: option.isDefault,
      isActive: true,
    };
  });
}

function optionPricingGroupOptions(options = []) {
  return options.map((option) => ({
    value: option.value,
    label: option.label,
    description: option.description || "",
    priceDelta: Number(option.priceDelta || 0),
    priceOverride:
      option.priceOverride === null || option.priceOverride === undefined
        ? null
        : Number(option.priceOverride),
    images: Array.isArray(option.images) ? option.images.filter(Boolean) : [],
    swatch: option.swatch || {
      color: "",
      image: "",
    },
    isDefault: Boolean(option.isDefault),
    isActive: option.isActive !== false,
  }));
}

function customizationGroup({ key, label, description, inputType = "buttons", displayOrder, options }) {
  return {
    key,
    label,
    description,
    inputType,
    isRequired: true,
    displayOrder,
    isActive: true,
    options,
  };
}

function buildCustomizationGroups({ category, images, materialOptions }) {
  if (category === "Sofas") {
    return [
      customizationGroup({
        key: "size",
        label: "Size",
        description: "Sofa sizes from the Curve & Comfort customization guide.",
        displayOrder: 0,
        options: groupOptions(SOFA_SIZE_VALUES, images),
      }),
      customizationGroup({
        key: "foam-density",
        label: "Foam Density",
        description: "Density options from the Curve & Comfort customization guide.",
        displayOrder: 1,
        options: groupOptions(FOAM_DENSITY_VALUES, images),
      }),
      customizationGroup({
        key: "foam-quality",
        label: "Foam Quality",
        description: "Foam material options from the Curve & Comfort customization guide.",
        displayOrder: 2,
        options: groupOptions(FOAM_QUALITY_VALUES, images),
      }),
      customizationGroup({
        key: "fabric-types",
        label: "Fabric Types",
        description: "Fabric options from the Curve & Comfort customization guide.",
        inputType: "swatches",
        displayOrder: 3,
        options: groupOptions(FABRIC_VALUES, images),
      }),
    ];
  }

  if (category === "Chairs & Ottomans") {
    return [
      customizationGroup({
        key: "foam-density",
        label: "Foam Density",
        description: "Density options from the Curve & Comfort customization guide.",
        displayOrder: 0,
        options: groupOptions(FOAM_DENSITY_VALUES, images),
      }),
      customizationGroup({
        key: "fabric-types",
        label: "Fabric Types",
        description: "Fabric options from the Curve & Comfort customization guide.",
        inputType: "swatches",
        displayOrder: 1,
        options: groupOptions(FABRIC_VALUES, images),
      }),
    ];
  }

  if (category === "Beds") {
    return [
      customizationGroup({
        key: "size",
        label: "Size",
        description: "Bed sizes from the Curve & Comfort customization guide.",
        displayOrder: 0,
        options: groupOptions(BED_SIZE_VALUES, images),
      }),
    ];
  }

  if (["Coffee Tables", "Console Tables", "Nester Tables", "Wall Decor"].includes(category)) {
    return [
      customizationGroup({
        key: "material",
        label: "Material",
        description: "Material options from the Curve & Comfort customization guide.",
        displayOrder: 0,
        options: optionPricingGroupOptions(materialOptions),
      }),
    ];
  }

  return [];
}

// ---------- main transform ----------
function transformOne(item) {
  const title = String(item?.title ?? "Untitled Product").trim();
  const basePrice = Number(item?.price ?? item?.basePrice ?? 0);

  const images = Array.isArray(item?.images) ? item.images.filter(Boolean) : [];

  // sizes
  const sourceSizes =
    Array.isArray(item?.attributes?.sizes) && item.attributes.sizes.length
      ? item.attributes.sizes
      : item?.attributes?.seatingCapacity
      ? [item.attributes.seatingCapacity]
      : ["2-seater", "3-seater", "4-seater"];

  // materials
  const baseMaterial = item?.attributes?.material ? [item.attributes.material] : [];
  const materialValues = baseMaterial.length
    ? [...new Set([...baseMaterial, "Engineered Wood", "Metal Frame"])]
    : ["Wood", "Engineered Wood", "Metal Frame"];

  // foams
  const foamValues = ["Soft Foam", "Medium Foam", "High Density Foam"];

  // ✅ fabrics (3 options)
  const fabricValues = ["Velvet", "Linen", "Leatherette"];

  // assign ONE product image per option item (cycled)
  let imgIndex = 0;

  const { opts: sizeOpts, nextImgIndex: imgAfterSizes } = buildOptions({
    values: sourceSizes,
    basePrice,
    images,
    startIndex: imgIndex,
  });

  const { opts: materialOpts, nextImgIndex: imgAfterMaterials } = buildOptions({
    values: materialValues,
    basePrice,
    images,
    startIndex: imgAfterSizes,
  });

  const { opts: foamOpts, nextImgIndex: imgAfterFoams } = buildOptions({
    values: foamValues,
    basePrice,
    images,
    startIndex: imgAfterMaterials,
  });

  const { opts: fabricOpts } = buildOptions({
    values: fabricValues,
    basePrice,
    images,
    startIndex: imgAfterFoams,
  });

  const category = item?.category || "Uncategorized";

  return {
    title,
    slug: slugify(title),
    description: String(item?.description ?? "No description provided.").trim(),

    basePrice,
    currency: "INR",

    stock: Number(item?.stock ?? 0),
    inStock: Number(item?.stock ?? 0) > 0,

    images: images.length ? images : ["https://example.com/fallback.jpg"],

    // keep as-is (strings for now)
    category,
    subcategories: Array.isArray(item?.subcategory) ? item.subcategory : [],

    optionPricing: {
      sizes: sizeOpts,
      materials: materialOpts,
      foams: foamOpts,
      fabrics: fabricOpts,
    },

    customizationGroups: buildCustomizationGroups({
      category,
      images,
      materialOptions: materialOpts,
    }),

    dimensions: item?.dimensions || undefined,
    weight: item?.weight || undefined,

    assemblyRequired: Boolean(item?.assemblyRequired ?? false),
    warranty: item?.warranty || "",

    careInstructions: Array.isArray(item?.careInstructions) ? item.careInstructions : [],

    tags: [
      item?.brand ? `brand:${item.brand}` : null,
      item?.attributes?.color ? `color:${item.attributes.color}` : null,
      item?.attributes?.roomType ? `room:${item.attributes.roomType}` : null,
      item?.attributes?.style ? `style:${item.attributes.style}` : null,
      item?.filters?.isOnSale ? "on-sale" : null,
      item?.filters?.isFeatured ? "featured" : null,
    ].filter(Boolean),

    rating: Number(item?.rating ?? 0),
    reviewsCount: Number(item?.reviewsCount ?? 0),

    isActive: true,
    isDeleted: false,
  };
}

// safer JSON read (gives clear error if JSON invalid)
function readJsonSafe(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, ""); // remove BOM
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("\n❌ JSON parse failed. Your input JSON is invalid (most likely trailing comma).");
    console.error("Error:", e.message);
    console.error("\n👉 Fix JSON and run again.\n");
    process.exit(1);
  }
}

// ---------- runner ----------
function run() {
  const inputFile = process.argv[2] || "./data/products.json";
  const outputFile = process.argv[3] || "./data/products.transformed.json";

  const inputAbs = path.resolve(process.cwd(), inputFile);
  const outAbs = path.resolve(process.cwd(), outputFile);

  if (!fs.existsSync(inputAbs)) {
    console.error(`❌ Input file not found: ${inputAbs}`);
    process.exit(1);
  }

  const parsed = readJsonSafe(inputAbs);

  const products = Array.isArray(parsed.products) ? parsed.products : [];
  if (!products.length) {
    console.error("❌ No products found at key: products[]");
    console.error('Your input must look like: { "products": [ ... ] }');
    process.exit(1);
  }

  const transformed = products.map(transformOne);

  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, JSON.stringify({ products: transformed }, null, 2), "utf-8");

  console.log(`✅ Transformed ${transformed.length} products`);
  console.log(`✅ Output written to: ${outAbs}`);
  console.log("\n🔎 Sample transformed product:\n", JSON.stringify(transformed[0], null, 2));
}

run();
