import "../public/fonts/fonts.css";
import "../public/fonts/font-icons.css";
import "../public/css/bootstrap.min.css";
import "../public/css/bootstrap-select.min.css";
import "../public/css/swiper-bundle.min.css";
import "../public/css/animate.css";
import "../public/scss/main.scss";
import "photoswipe/style.css";
import "react-range-slider-input/dist/style.css";
import "../public/css/image-compare-viewer.min.css";
import "react-toastify/dist/ReactToastify.css";
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
