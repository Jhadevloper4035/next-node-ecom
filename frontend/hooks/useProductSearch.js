"use client";

import { useEffect, useState } from "react";
import { getAllProducts } from "@/services/product/product.service";
import { mapProductsForCards } from "@/utlis/productMapper";

export default function useProductSearch(
  query,
  { delay = 250, limit = 6, minimumCharacters = 2 } = {},
) {
  const normalizedQuery = query.trim();
  const canSearch = normalizedQuery.length >= minimumCharacters;
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!canSearch) {
      setProducts([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    let isCurrentRequest = true;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await getAllProducts(
          {
            page: 1,
            limit,
            q: normalizedQuery,
            sort: "rating",
          },
          { silent: true, signal: controller.signal },
        );

        if (isCurrentRequest) {
          setProducts(mapProductsForCards(response?.data || []));
        }
      } catch {
        if (isCurrentRequest) {
          setProducts([]);
          setHasError(true);
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    }, delay);

    return () => {
      isCurrentRequest = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [canSearch, delay, limit, normalizedQuery]);

  return {
    canSearch,
    hasError,
    isLoading,
    normalizedQuery,
    products,
  };
}
