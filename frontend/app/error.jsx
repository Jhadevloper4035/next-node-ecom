"use client";

import Link from "next/link";
import React, { useEffect } from "react";

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

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
                  "linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.28)), url('/images/collection-banner/bed.jpg')",
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
              Something went wrong
            </p>
            <h1
              className="heading"
              style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                lineHeight: 1,
                marginBottom: 18,
              }}
            >
              We could not load this page
            </h1>
            <p
              className="body-text-1 text-secondary"
              style={{ maxWidth: 560, marginBottom: 28 }}
            >
              Please try again. If it still does not work, return home and
              continue browsing Curve &amp; Comfort.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button type="button" className="tf-btn btn-fill" onClick={reset}>
                <span className="text text-button">Try Again</span>
              </button>
              <Link href="/" className="tf-btn btn-line">
                <span className="text text-button">Back To Home</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
