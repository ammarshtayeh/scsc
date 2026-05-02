"use client";

import { type DependencyList, useEffect, useState } from "react";

export function useFirestore<T>(loader: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    loader()
      .then((result) => {
        if (!mounted) {
          return;
        }
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, deps);

  return { data, loading, error };
}
