import Link from "next/link";
import React from "react";

export default function NotFoundContent() {
  return (
    <section
      className="flat-spacing"
      style={{
        minHeight: "calc(100vh - 180px)",
        display: "flex",
        alignItems: "center",
        background:
          "linear-gradient(180deg, #f7f4ef 0%, #ffffff 54%, #f4f0ea 100%)",
      }}
    >
      <div className="container">
        <div className="row align-items-center" style={{ rowGap: 36 }}>
          <div className="col-lg-6">
            <div
              style={{
                aspectRatio: "4 / 3",
                backgroundImage:
                  "linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.24)), url('/images/collection-banner/sofa.jpg')",
                backgroundPosition: "center",
                backgroundSize: "cover",
                borderRadius: 8,
                minHeight: 280,
              }}
              aria-hidden="true"
            />
          </div>
          <div className="col-lg-6">
            <p
              className="text-btn-uppercase"
              style={{ color: "#8f6a3d", marginBottom: 12 }}
            >
              Error 404
            </p>
            <h1
              className="heading"
              style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                lineHeight: 1,
                marginBottom: 18,
              }}
            >
              This page is not available
            </h1>
            <p
              className="body-text-1 text-secondary"
              style={{ maxWidth: 560, marginBottom: 28 }}
            >
              The link may be old, moved, or typed incorrectly. You can return
              home, browse products, or search for the furniture you had in
              mind.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link href="/" className="tf-btn btn-fill">
                <span className="text text-button">Back To Home</span>
              </Link>
              <Link href="/search-result" className="tf-btn btn-line">
                <span className="text text-button">Search Products</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
