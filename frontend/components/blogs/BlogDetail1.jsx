import Image from "next/image";
import Link from "next/link";

export default function BlogDetail1({ blog }) {
  return (
    <div className="blog-detail-wrap">
      <div className="inner">
        <div className="heading">
          <h3 className="fw-5">{blog.title}</h3>
          <div className="meta justify-content-center">
            <div className="meta-item gap-8"><i className="icon-calendar" /><p className="body-text-1">{new Date(blog.created_at).toLocaleDateString()}</p></div>
            <div className="meta-item gap-8"><i className="icon-user" /><p className="body-text-1">by {blog.author}</p></div>
          </div>
        </div>
        <div className="image"><Image className="lazyload" src={blog.image} alt={blog.title} width={1275} height={717} /></div>
        <div className="content">
          <div className="body-text-1" dangerouslySetInnerHTML={{ __html: blog.text }} />
        </div>
        {(blog.category || blog.tags?.length > 0) && <div className="meta mt_24">
          {blog.category && <div className="meta-item gap-8"><span>Category:</span><Link className="link" href={`/blogs?category=${encodeURIComponent(blog.category)}`}>{blog.category}</Link></div>}
          {blog.tags?.map((tag) => <Link className="text-caption-1 link" key={tag} href={`/blogs?tag=${encodeURIComponent(tag)}`}>#{tag}</Link>)}
        </div>}
      </div>
    </div>
  );
}
