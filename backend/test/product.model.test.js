const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Product = require("../src/models/product.model");

const productData = (customizationGroups) => ({
  title: "Custom Sky Haven Sofa",
  slug: "custom-sky-haven-sofa",
  description: "A configurable sofa used to validate product customization.",
  basePrice: 68999,
  images: ["https://example.com/sofa.jpg"],
  category: new mongoose.Types.ObjectId(),
  customizationGroups,
});

test("accepts dynamic category-specific customization groups", async () => {
  const product = new Product(productData([
    {
      key: "Foam-Density",
      label: "Foam Density",
      displayOrder: 1,
      options: [
        { value: "28", label: "Very Soft", isDefault: true },
        { value: "32", label: "Medium Soft", priceDelta: 1500 },
        { value: "40", label: "Hard", priceOverride: 73999 },
      ],
    },
    {
      key: "fabric-type",
      label: "Fabric Type",
      inputType: "swatches",
      options: [
        { value: "suede", label: "Suede", swatch: { color: "#c7b299" } },
        { value: "boucle", label: "Boucle", images: ["https://example.com/boucle.jpg"] },
      ],
    },
  ]));

  await product.validate();

  assert.equal(product.customizationGroups[0].key, "foam-density");
  assert.equal(product.customizationGroups[0].options[1].priceDelta, 1500);
  assert.equal(product.customizationGroups[1].options[0].swatch.color, "#c7b299");
});

test("rejects duplicate group keys", async () => {
  const product = new Product(productData([
    { key: "size", label: "Size", options: [{ value: "queen", label: "Queen" }] },
    { key: "SIZE", label: "Bed Size", options: [{ value: "king", label: "King" }] },
  ]));

  await assert.rejects(product.validate(), /Customization group keys must be unique/);
});

test("rejects duplicate option values and multiple defaults", async () => {
  const duplicateValues = new Product(productData([
    {
      key: "foam-quality",
      label: "Foam Quality",
      options: [
        { value: "hr", label: "HR" },
        { value: "HR", label: "High Resilience" },
      ],
    },
  ]));
  await assert.rejects(duplicateValues.validate(), /Option values must be unique/);

  const multipleDefaults = new Product(productData([
    {
      key: "size",
      label: "Size",
      options: [
        { value: "queen", label: "Queen", isDefault: true },
        { value: "king", label: "King", isDefault: true },
      ],
    },
  ]));
  await assert.rejects(multipleDefaults.validate(), /only one default option/);
});

test("rejects customization groups without options", async () => {
  const product = new Product(productData([
    { key: "size", label: "Size", options: [] },
  ]));

  await assert.rejects(product.validate(), /must contain at least one option/);
});
