

const categoryBackgrounds = {
  "beds": "url('/images/collection-banner/bed.jpg')",
  "sofas": "url('/images/collection-banner/sofa.jpg')",
  "tables": "url('/images/collection-banner/tables.jpg')",
  "chairs-and-ottomans": "url('/images/collection-banner/chair-ottons.jpg')",
  "chairs-ottomans": "url('/images/collection-banner/chair-ottons.jpg')",
  "wall-decor": "url('/images/collection-banner/decor.jpg')",
  "coffee-tables": "url('/images/collection-banner/coffee-table.jpg')",
  "console-tables": "url('/images/collection-banner/console-table.jpg')",
  "nester-tables": "url('/images/collection-banner/nester-table.jpg')",
  "kitchen": "url('https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1600&auto=format&fit=crop')",
  "wardrobe": "url('https://images.unsplash.com/photo-1558997519-83ea9252edf8?q=80&w=1600&auto=format&fit=crop')",
  "wardrobes": "url('https://images.unsplash.com/photo-1558997519-83ea9252edf8?q=80&w=1600&auto=format&fit=crop')",
  "furniture": "url('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=900&auto=format&fit=crop')",
  default: "url('/images/default.jpg')",
};









export const getCategoryImage = (category) => {
  if (!category) return categoryBackgrounds.default;
  const key = category.toLowerCase();
  return categoryBackgrounds[key] || categoryBackgrounds.default;
};
