import Image from "next/image";
import Comments from "./Comments";
import CommentForm from "./CommentForm";
import Sidebar2 from "./Sidebar2";

export default function BlogDetail2({ blog }) {
  return (
    <section className="flat-spacing"><div className="container"><div className="row">
      <div className="col-lg-8 mb-lg-30"><div className="blog-detail-wrap page-single-2"><div className="inner">
        <div className="heading"><h3 className="fw-5">{blog.title}</h3><div className="meta"><div className="meta-item gap-8"><i className="icon-calendar" /><p className="body-text-1">{new Date(blog.created_at).toLocaleDateString()}</p></div><div className="meta-item gap-8"><i className="icon-user" /><p className="body-text-1">by {blog.author}</p></div></div></div>
        <div className="image"><Image className="lazyload" src={blog.image} alt={blog.title} width={1275} height={717} /></div>
        <div className="content">{blog.text.split("\n").filter(Boolean).map((paragraph, index) => <p className="body-text-1 mb_16" key={index}>{paragraph}</p>)}</div>
        <Comments /><CommentForm />
      </div></div></div>
      <div className="col-lg-4"><Sidebar2 /></div>
    </div></div></section>
  );
}
