import { useQuery } from "@tanstack/react-query";
import type * as THREE from "three";
import type { ModelGroupInfo } from "@/features/admin/lib/brandingRecovery";

export interface LoadedModelGroups {
  /** The unrotated, unscaled OBJ root — raw frame, as `brandingRecovery` expects. Never mutated. */
  root: THREE.Group;
  groups: ModelGroupInfo[];
}

/**
 * Fetches and parses the product's OBJ for the CMS branding-marks panel.
 * `brandingRecovery` (and its BVH dependency) is imported dynamically, so it
 * only loads once the panel is opened.
 */
export function useModelGroups(modelUrl: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-model-groups", modelUrl],
    enabled: enabled && !!modelUrl,
    staleTime: Infinity,
    queryFn: async (): Promise<LoadedModelGroups> => {
      const [response, { OBJLoader }, recovery] = await Promise.all([
        fetch(modelUrl as string),
        import("three/examples/jsm/loaders/OBJLoader.js"),
        import("@/features/admin/lib/brandingRecovery"),
      ]);
      if (!response.ok) throw new Error(`Couldn't load the model (${response.status})`);
      const root = new OBJLoader().parse(await response.text());
      return { root, groups: recovery.listModelGroups(root) };
    },
  });
}
