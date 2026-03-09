import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setIsLoading } from "@/redux/uiSlice";

export const useRouteLoadingState = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const previousPathname = useRef(pathname);
  const previousSearchParams = useRef(searchParams.toString());
  const isNavigating = useRef(false);

  // Handle route completion
  useEffect(() => {
    const currentPath = pathname + (searchParams.toString() ? "?" + searchParams.toString() : "");
    const prevPath = previousPathname.current + (previousSearchParams.current ? "?" + previousSearchParams.current : "");

    if (currentPath !== prevPath) {
      // Small delay to ensure render is smooth then hide
      const timer = setTimeout(() => {
        if (isNavigating.current) {
          dispatch(setIsLoading(false));
          isNavigating.current = false;
        }
      }, 300);

      previousPathname.current = pathname;
      previousSearchParams.current = searchParams.toString();
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, dispatch]);

  // Handle navigation start (Global Interception)
  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target.closest("a");
      const button = e.target.closest("button");

      if (target && target.href && target.target !== "_blank") {
        try {
          const url = new URL(target.href);
          const isInternal = url.origin === window.location.origin;
          const isSamePath = url.pathname === window.location.pathname && url.search === window.location.search;

          if (isInternal && !isSamePath && !target.hasAttribute("data-no-loader")) {
            if (!isNavigating.current) {
              dispatch(setIsLoading(true));
              isNavigating.current = true;
            }
          }
        } catch (err) {
          // Ignore invalid URLs
        }
      }

      // Also trigger for buttons or interaction links (brief flash)
      const isInteractionLink = target && (target.getAttribute("href") === "#" || !target.getAttribute("href"));

      if ((button || isInteractionLink) && !e.target.closest("[data-no-loader]")) {
        dispatch(setIsLoading(true));
        setTimeout(() => {
          dispatch(setIsLoading(false));
        }, 400);
      }
    };

    const handlePopState = () => {
      if (!isNavigating.current) {
        dispatch(setIsLoading(true));
        isNavigating.current = true;
      }
    };

    window.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [dispatch]);
};
