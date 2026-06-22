"use client";

import { useEffect, useState } from "react";

const getPathname = () =>
  typeof window === "undefined" ? "" : window.location.pathname;

export default function useCurrentPathname() {
  const [pathname, setPathname] = useState(getPathname);

  useEffect(() => {
    const updatePathname = () => setPathname(getPathname());

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event("app-route-change"));
      return result;
    };

    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("app-route-change"));
      return result;
    };

    window.addEventListener("app-route-change", updatePathname);
    window.addEventListener("popstate", updatePathname);
    updatePathname();

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("app-route-change", updatePathname);
      window.removeEventListener("popstate", updatePathname);
    };
  }, []);

  return pathname;
}
