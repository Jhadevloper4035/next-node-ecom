import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function BannerCollection() {
  return (
    <section className="flat-spacing pt-0">
      <div className="  container-full2 ">
        <div className="tf-grid-layout md-col-2">
          <div className="collection-default hover-img">
            <a className="img-style">
              <Image
                className="lazyload"
                data-src="/images/banner/sales-coffee-table.jpeg"
                alt="banner-cls"
                src="/images/banner/sales-coffee-table.jpeg"
                width={945}
                height={709}
              />
            </a>
            <div className="content">
              <h3 className="title wow fadeInUp">
                <Link href={`/shop-collection`} className="link">
                  Upgrade Your Home to Luxury with Us
                </Link>
              </h3>
              <p className="desc wow fadeInUp">
                Transform your everyday spaces into refined living experiences. Our thoughtfully crafted furniture blends modern design with timeless comfort, helping you create a home that feels truly luxurious.
              </p>
              <div className="wow fadeInUp">
                <Link href={`/shop-collection`} className="btn-line">
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
          <div className="collection-position hover-img">
            <a className="img-style">
              <Image
                className="lazyload"
                data-src="/images/banner/sales1.jpeg"
                alt="banner-cls"
                src="/images/banner/sales1.jpeg"
                width={945}
                height={945}
              />
            </a>
            <div className="content">
              <h3 className="title">
                <Link
                  href={`/shop-collection`}
                  className="link text-white wow fadeInUp"
                >
                  Capsule Collection
                </Link>
              </h3>
              <p className="desc text-white wow fadeInUp">
                Reserved for special occasions
              </p>
              <div className="wow fadeInUp">
                <Link
                  href={`/shop-collection`}
                  className="btn-line style-white"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
