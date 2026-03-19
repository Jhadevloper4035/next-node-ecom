const categoryBackgrounds = {
  "beds": "url('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=900&auto=format&fit=crop')",
  "sofas": "url('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=900&auto=format&fit=crop')",
  "tables": "url('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=900&auto=format&fit=crop')",
  "chairs-and-ottomans": "url('/images/collections/ottoman.jpg')",
  "chairs-ottomans": "url('/images/collections/ottoman.jpg')",
  "wall-decor": "url('/images/collections/book.jpg')",
  "coffee-tables": "url('/images/collections/tables.jpg')",
  "console-tables": "url('/images/collections/tables.jpg')",
  "nester-tables": "url('/images/collections/tables.jpg')",
  "furniture": "url('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=900&auto=format&fit=crop')",

  default: "url('/images/default.jpg')",
};
export const getCategoryImage = (category) => {
  if (!category) return categoryBackgrounds.default;
  const key = category.toLowerCase();
  return categoryBackgrounds[key] || categoryBackgrounds.default;
};
