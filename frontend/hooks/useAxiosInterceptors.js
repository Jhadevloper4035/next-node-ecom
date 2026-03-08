import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import api from "@/api/api.config";
import { setIsLoading } from "@/redux/uiSlice";

// This hook initializes axios interceptors
// Call this once in a client component that loads early (like AuthHydrator)
export const useAxiosInterceptors = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        dispatch(setIsLoading(true));
        return config;
      },
      (error) => {
        dispatch(setIsLoading(false));
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        dispatch(setIsLoading(false));
        return response;
      },
      (error) => {
        dispatch(setIsLoading(false));
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [dispatch]);
};


