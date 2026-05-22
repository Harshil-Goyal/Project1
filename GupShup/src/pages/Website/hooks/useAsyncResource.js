import { useEffect, useState } from "react";

export function useAsyncResource(loader, initialValue, deps = []) {
  const [data, setData] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");

    loader()
      .then((result) => {
        if (!mounted) return;
        setData(result);
        setIsLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Could not load data right now.");
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader, ...deps]);

  return { data, isLoading, error };
}
