"use client";
import Link from "next/link";

export default function BannerDiscover({
  tag = "Summer 2024 Collection",
  title = "Super Sale Up To 50%",
  subtitle = "Reserved for special occasions",
  buttonText = "Discover Now",
  buttonHref = "/shop",
  imageSrc = "/images/banner/banner-para.png",
  overlayOpacity = 0.4,
}) {
  return (
    <>
      <style>{`
        .banner-discover {
          display: flex;
          align-items: center;
          color: #fff;
          background-image: var(--banner-bg);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          min-height: 80vh;
          background-attachment: fixed;
          position: relative;
        }

        @media (max-width: 768px) {
          .banner-discover {
            background-attachment: scroll;
          }
        }

        .banner-discover__overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--banner-overlay);
          z-index: 1;
        }

        .banner-discover__content {
          position: relative;
          z-index: 100;
          width: 100%;
          padding: 0 3rem;
        }

        .banner-discover__tag {
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 0.5rem;
          letter-spacing: 1px;
          font-size: 0.9rem;
        }

        .banner-discover__title {
          font-weight: 700;
          font-size: clamp(2rem, 5vw, 3.5rem);
          color: #fff;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .banner-discover__subtitle {
          margin-bottom: 1.5rem;
          font-size: 1rem;
          opacity: 0.9;
        }

        .banner-discover__btn-wrap {
          animation: fadeInUp 0.6s ease 0.3s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <section
        className="banner-discover"
        style={{
          "--banner-bg": `url('${imageSrc}')`,
          "--banner-overlay": `rgba(0,0,0,${overlayOpacity})`,
        }}
      >
        <div className="banner-discover__overlay" />

        <div className="banner-discover__content">
          <div className="row">
            <div className="col-lg-6 col-md-8">

              <p className="banner-discover__tag">{tag}</p>

              <h1 className="banner-discover__title">{title}</h1>

              <p className="banner-discover__subtitle">{subtitle}</p>

              <div className="banner-discover__btn-wrap">
                <Link href={buttonHref} className="tf-btn btn-md btn-white">
                  <span className="text">{buttonText}</span>
                  <i className="icon icon-arrowUpRight" />
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  );
}