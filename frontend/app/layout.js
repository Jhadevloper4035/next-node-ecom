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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
