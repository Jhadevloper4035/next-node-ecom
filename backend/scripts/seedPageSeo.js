const mongoose = require("mongoose");
const { connectDB } = require("../src/config/db");
const SeoMeta = require("../src/models/seoFields.model");

const siteUrl = "https://curve-comfort.com";
const defaultImage = `${siteUrl}/images/logo/logo.png`;

const page = (pageName, pageSlug, path, title, description, keywords, priority) => {
  const canonicalUrl = `${siteUrl}${path}`;

  return {
    pageName,
    pageSlug,
    pageCategory: "static",
    title,
    description,
    keywords,
    author: "Curve & Comfort",
    robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    canonicalUrl,
    ogLocale: "en_US",
    ogType: "website",
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonicalUrl,
    ogSiteName: "Curve & Comfort",
    ogImage: { url: defaultImage, alt: "Curve & Comfort furniture" },
    twitterCard: "summary_large_image",
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: defaultImage,
    twitterSite: "@curve_comfort",
    priority,
    isActive: true,
  };
};

const pages = [
  page("Home", "home", "/", "Online Furniture Stores | Premium Furniture Online - Curve & Comfort", "Discover premium furniture online at Curve & Comfort. Shop high-end designer sofas, luxury chairs, and premium wooden furniture crafted for ultimate elegance.", "online furniture, premium furniture online, buy furniture online, online furniture stores, shop furniture online", 1),
  page("All Products", "all-products", "/all-products", "All Products | Premium Furniture Online | Curve & Comfort", "Browse premium furniture from Curve & Comfort, including sofas, beds, tables, chairs, wardrobes, kitchen furniture, and wall decor.", "furniture, sofas, beds, tables, chairs, wardrobes, wall decor", 0.9),
  page("About Us", "about-us", "/about-us", "About Curve & Comfort | Premium Furniture Store", "Learn about Curve & Comfort and our thoughtfully designed furniture for comfortable, beautiful homes.", "about Curve & Comfort, premium furniture store, furniture brand", 0.7),
  page("Contact", "contact", "/contact", "Contact Curve & Comfort | Furniture Support", "Contact Curve & Comfort for product questions, order support, and help choosing furniture for your home.", "contact Curve & Comfort, furniture support, customer service", 0.7),
  page("Blogs", "blogs", "/blogs", "Furniture Ideas and Buying Guides | Curve & Comfort Blog", "Explore furniture ideas, home design inspiration, and practical buying guides from Curve & Comfort.", "furniture blog, home design ideas, furniture buying guide", 0.8),
  page("FAQs", "faqs", "/FAQs", "Frequently Asked Questions | Curve & Comfort", "Find answers to common questions about Curve & Comfort products, orders, delivery, returns, and support.", "Curve & Comfort FAQs, furniture delivery, furniture returns", 0.6),
  page("Privacy Policy", "privacy-policy", "/privacy-policy", "Privacy Policy | Curve & Comfort", "Learn how Curve & Comfort collects, uses, and protects your personal information.", "privacy policy, Curve & Comfort privacy", 0.4),
  page("Terms of Use", "term-of-use", "/term-of-use", "Terms and Conditions | Curve & Comfort", "Read Curve & Comfort terms and conditions for orders, payments, shipping, returns, and website use.", "terms and conditions, Curve & Comfort terms", 0.4),
  page("Refund Policy", "refund-policy", "/refund-policy", "Refund and Return Policy | Curve & Comfort", "Review Curve & Comfort's refund and return policy, including cancellations and refund timelines.", "refund policy, return policy, Curve & Comfort returns", 0.4),
];

async function seedPageSeo() {
  await connectDB();

  try {
    const result = await SeoMeta.bulkWrite(pages.map((seo) => ({
      updateOne: {
        filter: { pageSlug: seo.pageSlug },
        update: { $setOnInsert: seo },
        upsert: true,
      },
    })));

    console.log(`Page SEO seed complete: ${result.upsertedCount} created, ${pages.length - result.upsertedCount} already existed.`);
  } finally {
    await mongoose.connection.close();
  }
}

seedPageSeo().catch((error) => {
  console.error("Page SEO seed failed:", error.message);
  process.exitCode = 1;
});
