import BlogList from "@/components/blogs/BlogList";
import Footer1 from "@/components/footers/Footer1";
import { getBlogs, getBlogTaxonomies } from "@/lib/blogs";
import { getPageSeoMetadata } from "@/lib/page-seo";

export const generateMetadata = () => getPageSeoMetadata("blogs", {
  title: "Furniture Ideas and Buying Guides | Curve & Comfort Blog",
  description: "Explore furniture ideas, home design inspiration, and practical buying guides from Curve & Comfort.",
  canonical: "/blogs",
});

export default async function BlogsPage({ searchParams }) {
  const filters = (await searchParams) || {};
  const [posts, taxonomies] = await Promise.all([
    getBlogs({ category: filters.category, tag: filters.tag }),
    getBlogTaxonomies(),
  ]);

  return <>
    <div className="page-title" style={{ backgroundImage: "url(/images/section/page-title.jpg)" }}>
      <div className="container-full"><div className="row"><div className="col-12"><h1 className="heading text-center">Blog</h1></div></div></div>
    </div>
    <BlogList posts={posts} taxonomies={taxonomies} />
    <Footer1 />
  </>;
}
