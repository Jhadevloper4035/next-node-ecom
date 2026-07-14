import "../public/fonts/fonts.css";
import "../public/fonts/font-icons.css";
import "../public/css/bootstrap.min.css";
import "../public/css/bootstrap-select.min.css";
import "../public/css/swiper-bundle.min.css";
import "../public/css/animate.css";
import "../public/scss/main.scss";
import "photoswipe/style.css";
import "react-range-slider-input/dist/style.css";
import Script from "next/script";
import "../public/css/image-compare-viewer.min.css";
import "../components/common/toast.css";
import AppShell from "@/components/common/AppShell";

export const metadata = {
  title: "Curve & Comfort",
  description: "Furniture and decor for comfortable modern homes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YCVX5BCPPM"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YCVX5BCPPM');
          `}
        </Script>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
