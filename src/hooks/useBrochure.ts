import { useState, useEffect } from "react";
import type { Brochure } from "@/types/flipbook";
import { brochures } from "@/data/brochures";

export function useBrochure(id: string | undefined) {
  const [brochure, setBrochure] = useState<Brochure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Simulate async fetch
    const timer = setTimeout(() => {
      const found = brochures.find((b) => b.id === id) ?? null;
      if (found) {
        setBrochure(found);
      } else {
        setError("Brochure not found");
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [id]);

  return { brochure, loading, error };
}
