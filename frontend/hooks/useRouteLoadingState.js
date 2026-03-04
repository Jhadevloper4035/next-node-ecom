import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { setIsLoading } from "@/redux/uiSlice";

export const useRouteLoadingState = () => {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      // Show loader when path changes
      dispatch(setIsLoading(true));
      previousPathname.current = pathname;

      // Hide loader after a short delay (page transition completes)
      const timer = setTimeout(() => {
        dispatch(setIsLoading(false));
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname, dispatch]);
};
