const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "products.json");
const outputPath = path.join(__dirname, "products-export.xls");

const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const products = Array.isArray(input) ? input : input.products;

if (!Array.isArray(products)) {
  throw new Error("Expected products.json to contain { products: [] }");
}

const maxImages = Math.max(0, ...products.map((product) => (product.images || []).length));
const imageColumns = Array.from({ length: maxImages }, (_, index) => ({
  key: `image_${index + 1}`,
  label: `Image ${index + 1}`,
  value: (product) => product.images?.[index] || "",
}));

const join = (value) => (Array.isArray(value) ? value.filter(Boolean).join(", ") : value || "");

const columns = [
  { key: "id", label: "ID", value: (product) => product.id, type: "Number" },
  { key: "title", label: "Title", value: (product) => product.title },
  { key: "description", label: "Description", value: (product) => product.description },
  { key: "price", label: "Price", value: (product) => product.price, type: "Number" },
  { key: "oldPrice", label: "Old Price", value: (product) => product.oldPrice, type: "Number" },
  { key: "stock", label: "Stock", value: (product) => product.stock, type: "Number" },
  { key: "category", label: "Category", value: (product) => product.category },
  { key: "subcategory", label: "Subcategories", value: (product) => join(product.subcategory) },
  { key: "brand", label: "Brand", value: (product) => product.brand },
  { key: "color", label: "Color", value: (product) => product.attributes?.color },
  { key: "roomType", label: "Room Type", value: (product) => product.attributes?.roomType },
  { key: "style", label: "Style", value: (product) => product.attributes?.style },
  { key: "sizes", label: "Attribute Sizes", value: (product) => join(product.attributes?.sizes) },
  { key: "material", label: "Material", value: (product) => product.attributes?.material },
  { key: "rating", label: "Rating", value: (product) => product.rating, type: "Number" },
  { key: "reviewsCount", label: "Reviews Count", value: (product) => product.reviewsCount, type: "Number" },
  { key: "filterBrands", label: "Filter Brands", value: (product) => join(product.filters?.brands) },
  { key: "filterColors", label: "Filter Colors", value: (product) => join(product.filters?.colors) },
  { key: "filterSizes", label: "Filter Sizes", value: (product) => join(product.filters?.sizes) },
  { key: "isOnSale", label: "Is On Sale", value: (product) => product.filters?.isOnSale },
  { key: "isFeatured", label: "Is Featured", value: (product) => product.filters?.isFeatured },
  ...imageColumns,
  { key: "warranty", label: "Warranty", value: (product) => product.warranty },
  { key: "careInstructions", label: "Care Instructions", value: (product) => join(product.careInstructions) },
];

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const cell = (value, type = "String", styleId = "") => {
  if ((value === undefined || value === null || value === "") && type === "Number") {
    return "<Cell><Data ss:Type=\"String\"></Data></Cell>";
  }

  const dataType = type === "Number" && Number.isFinite(Number(value)) ? "Number" : "String";
  const cellStyle = styleId ? ` ss:StyleID="${styleId}"` : "";

  return `<Cell${cellStyle}><Data ss:Type="${dataType}">${escapeXml(value)}</Data></Cell>`;
};

const rows = [
  `<Row>${columns.map((column) => cell(column.label, "String", "Header")).join("")}</Row>`,
  ...products.map((product) =>
    `<Row>${columns.map((column) => cell(column.value(product), column.type)).join("")}</Row>`
  ),
];

const columnWidths = columns
  .map((column) => {
    const wide = ["description", "warranty", "careInstructions"].includes(column.key);
    const image = column.key.startsWith("image_");
    const width = wide ? 260 : image ? 220 : 130;
    return `<Column ss:Width="${width}"/>`;
  })
  .join("");

const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#D9EAF7" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Products">
  <Table>
   ${columnWidths}
   ${rows.join("\n   ")}
  </Table>
 </Worksheet>
</Workbook>
`;

fs.writeFileSync(outputPath, workbook, "utf8");
console.log(`Exported ${products.length} products to ${outputPath}`);
