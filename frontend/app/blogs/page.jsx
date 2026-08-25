import BlogList from "@/components/blogs/BlogList";
import Footer1 from "@/components/footers/Footer1";
import { getBlogs, getBlogTaxonomies } from "@/lib/blogs";

export const metadata = {
  title: "Blog | Curve & Comfort",
  description: "Furniture ideas, design inspiration, and buying guides from Curve & Comfort.",
  alternates: { canonical: "/blogs" },
};

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
