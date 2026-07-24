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
  metadataBase: new URL("https://curve-comfort.com"),
  title: {
    default: "Curve & Comfort | Premium Furniture Online",
    template: "%s | Curve & Comfort",
  },
  description: "Furniture and decor for comfortable modern homes.",
  manifest: "/images/favicon/site.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    siteName: "Curve & Comfort",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    title: "Curve and Comfort",
  },
  icons: {
    icon: [
      {
        url: "/images/favicon/favicon-96x96.png",
        type: "image/png",
        sizes: "96x96",
      },
      {
        url: "/images/favicon/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/images/favicon/favicon.ico",
    apple: [
      {
        url: "/images/favicon/apple-touch-icon.png",
        sizes: "180x180",
      },
    ],
  },
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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1585503169853883');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1585503169853883&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
