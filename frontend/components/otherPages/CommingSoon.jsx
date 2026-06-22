import Link from "next/link";
import React from "react";

const launchItems = [
  "Curated furniture collections",
  "Detailed product guidance",
  "Smooth ordering experience",
];

export default function CommingSoon() {
  return (
    <section
      className="flat-spacing"
      style={{
        minHeight: "calc(100vh - 180px)",
        display: "flex",
        alignItems: "center",
        backgroundImage:
          "linear-gradient(90deg, rgba(16, 20, 18, 0.82), rgba(16, 20, 18, 0.46)), url('/images/banner/discover-furniture2.jpg')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        color: "#fff",
      }}
    >
      <div className="container">
        <div style={{ maxWidth: 680 }}>
          <p
            className="text-btn-uppercase"
            style={{ color: "#d6b88d", marginBottom: 12 }}
          >
            Curve &amp; Comfort
          </p>
          <h1
            className="heading"
            style={{
              color: "#fff",
              fontSize: "clamp(42px, 7vw, 82px)",
              lineHeight: 1,
              marginBottom: 18,
            }}
          >
            Coming Soon
          </h1>
          <p
            className="body-text-1"
            style={{
              color: "rgba(255,255,255,0.86)",
              maxWidth: 560,
              marginBottom: 28,
            }}
          >
            We are preparing a calmer way to discover sofas, beds, tables,
            decor, and everyday comfort pieces for your home.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 34,
            }}
          >
            {launchItems.map((item) => (
              <span
                key={item}
                className="text-caption-1"
                style={{
                  border: "1px solid rgba(255,255,255,0.34)",
                  borderRadius: 4,
                  color: "#fff",
                  padding: "9px 12px",
                }}
              >
                {item}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href="/" className="tf-btn btn-fill">
              <span className="text text-button">Back To Home</span>
            </Link>
            <Link href="/contact" className="tf-btn btn-line">
              <span className="text text-button" style={{ color: "#fff" }}>
                Contact Us
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
