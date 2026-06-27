const Category = require("../models/category.model");

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeSearchInput = (value = "") =>
  String(value)
    .trim()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ");

const expandSearchTerms = (query = "") => {
  const normalized = normalizeSearchInput(query);
  if (!normalized) return [];

  const lower = normalized.toLowerCase();
  const terms = new Set([normalized, lower]);
  const tokens = lower.split(" ").filter((token) => token.length > 1);
  const broadTokens = new Set([
    "and",
    "decor",
    "decoration",
    "for",
    "furniture",
    "room",
    "seater",
    "size",
    "table",
    "the",
    "with",
  ]);

  tokens.forEach((token) => {
    if (tokens.length === 1 || !broadTokens.has(token)) {
      terms.add(token);
    }
  });

  const synonymGroups = [
    ["sofa", "couch", "settee"],
    ["loveseat", "love seat", "2 seater", "two seater", "2-seater"],
    ["3 seater", "three seater", "3-seater"],
    ["4 seater", "four seater", "4-seater"],
    ["coffee table", "center table", "centre table"],
    ["console table", "console"],
    ["nesting table", "nester table", "nested table"],
    ["armchair", "arm chair"],
    ["lounge chair", "lounger"],
    ["wall decor", "wall decoration", "home decor"],
    ["bedroom", "bed room"],
    ["king bed", "king size bed"],
    ["queen bed", "queen size bed"],
    ["single bed", "one person bed"],
    ["double bed", "full bed"],
  ];

  synonymGroups.forEach((group) => {
    if (group.some((term) => lower.includes(term))) {
      group.forEach((term) => terms.add(term));
    }
  });

  return [...terms].filter(Boolean).slice(0, 18);
};

const searchableProductFields = (regex) => [
  { title: regex },
  { slug: regex },
  { description: regex },
  { warranty: regex },
  { careInstructions: regex },
  { tags: regex },
  { "optionPricing.fabrics.value": regex },
  { "optionPricing.fabrics.label": regex },
  { "optionPricing.foams.value": regex },
  { "optionPricing.foams.label": regex },
  { "optionPricing.materials.value": regex },
  { "optionPricing.materials.label": regex },
  { "customizationGroups.key": regex },
  { "customizationGroups.label": regex },
  { "customizationGroups.options.value": regex },
  { "customizationGroups.options.label": regex },
];

const normalizeSearchText = (value = "") =>
  normalizeSearchInput(value).toLowerCase();

const optionPricingText = (optionPricing = {}) =>
  ["sizes", "fabrics", "foams", "materials"]
    .flatMap((key) => optionPricing?.[key] || [])
    .flatMap((option) => [option?.value, option?.label])
    .filter(Boolean)
    .join(" ");

const customizationText = (groups = []) =>
  groups
    .flatMap((group) => [
      group?.key,
      group?.label,
      ...(group?.options || []).flatMap((option) => [option?.value, option?.label]),
    ])
    .filter(Boolean)
    .join(" ");

const populatedCategoryText = (product = {}) =>
  [
    product.category?.name,
    product.category?.slug,
    ...(product.subcategories || []).flatMap((category) => [
      category?.name,
      category?.slug,
    ]),
  ]
    .filter(Boolean)
    .join(" ");

const scoreText = (text, phrase, terms, phraseWeight, termWeight) => {
  const normalizedText = normalizeSearchText(text);
  if (!normalizedText) return 0;

  let score = 0;
  if (phrase && normalizedText.includes(phrase)) score += phraseWeight;

  terms.forEach((term) => {
    if (normalizedText.includes(normalizeSearchText(term))) {
      score += termWeight;
    }
  });

  return score;
};

const scoreProductSearch = (product, query) => {
  const phrase = normalizeSearchText(query);
  const terms = expandSearchTerms(query);

  let score = 0;
  score += scoreText(product.title, phrase, terms, 220, 34);
  score += scoreText(populatedCategoryText(product), phrase, terms, 180, 30);
  score += scoreText(product.slug, phrase, terms, 120, 18);
  score += scoreText(product.tags?.join(" "), phrase, terms, 100, 14);
  score += scoreText(product.description, phrase, terms, 80, 10);
  score += scoreText(product.careInstructions?.join(" "), phrase, terms, 25, 3);
  score += scoreText(product.warranty, phrase, terms, 20, 2);
  score += scoreText(optionPricingText(product.optionPricing), phrase, terms, 16, 1);
  score += scoreText(customizationText(product.customizationGroups), phrase, terms, 16, 1);

  if (phrase && normalizeSearchText(product.title).startsWith(phrase)) {
    score += 80;
  }

  return score;
};

const buildSearchFilter = async (query) => {
  const terms = expandSearchTerms(query);
  if (!terms.length) return null;

  const regexes = terms.map((term) => new RegExp(escapeRegex(term), "i"));
  const categoryMatches = await Category.find({
    isDeleted: false,
    isActive: true,
    $or: regexes.flatMap((regex) => [
      { name: regex },
      { slug: regex },
      { path: regex },
      { description: regex },
      { "seo.keywords": regex },
    ]),
  }).select("_id");

  const categoryIds = categoryMatches.map((category) => category._id);
  const conditions = regexes.flatMap(searchableProductFields);

  if (categoryIds.length) {
    conditions.push({ category: { $in: categoryIds } });
    conditions.push({ subcategories: { $in: categoryIds } });
  }

  return { $or: conditions };
};

module.exports = {
  buildSearchFilter,
  expandSearchTerms,
  scoreProductSearch,
};
