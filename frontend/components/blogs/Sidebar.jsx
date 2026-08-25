import Image from "next/image";
import Link from "next/link";
import { getBlogExcerpt } from "@/lib/blogs";

export default function Sidebar({ posts = [], taxonomies }) {
  const categories = taxonomies?.category?.length ? taxonomies.category.map((item) => item.name) : [...new Set(posts.map((post) => post.category).filter(Boolean))];
  const tags = taxonomies?.tag?.length ? taxonomies.tag.map((item) => item.name) : [...new Set(posts.flatMap((post) => post.tags || []))];

  return (
    <aside className="sidebar maxw-360">
      {posts.length > 0 && (
        <div className="sidebar-item sidebar-relatest-post">
          <h5 className="sidebar-heading">Latest Posts</h5>
          {posts.slice(0, 5).map((post, index) => (
            <div key={post._id || post.url} className={`relatest-post-item ${index ? "style-row" : ""} hover-image`}>
              <div className="image">
                <Image className="lazyload" alt={post.title} src={post.image} width={540} height={360} />
              </div>
              <div className="content">
                <div className="meta"><div className="meta-item gap-8"><i className="icon-calendar" /><p className="text-caption-1">{new Date(post.created_at).toLocaleDateString()}</p></div></div>
                <h6 className="title fw-5"><Link className="link" href={`/blogs/${post.url}`}>{getBlogExcerpt(post, 8)}</Link></h6>
              </div>
            </div>
          ))}
        </div>
      )}
      {categories.length > 0 && (
        <div className="sidebar-item sidebar-categories">
          <h5 className="sidebar-heading">Categories</h5>
          <ul>{categories.map((category) => <li key={category}><Link className="text-button link" href={`/blogs?category=${encodeURIComponent(category)}`}>{category}</Link></li>)}</ul>
        </div>
      )}
      {tags.length > 0 && (
        <div className="sidebar-item sidebar-tag">
          <h5 className="sidebar-heading">Popular Tags</h5>
          <ul className="list-tags">{tags.map((tag) => <li key={tag}><Link href={`/blogs?tag=${encodeURIComponent(tag)}`} className="text-caption-1 link">{tag}</Link></li>)}</ul>
        </div>
      )}
    </aside>
  );
}
