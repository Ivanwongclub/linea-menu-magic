import { createPortal } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import type { Mesh } from "three";
import type { OutlineSettings } from "../store/useEditorStore";

export type OutlineMeshItem = {
  mesh: Mesh;
  settings: OutlineSettings;
};

/** View-only crease edges. Never measured, never saved to the recipe. */
export function WireframeOverlay({ items }: { items: OutlineMeshItem[] }) {
  return (
    <>
      {items.map(({ mesh, settings }) => {
        if (!settings.enabled) return null;
        const dashed = settings.style !== "solid";
        const dashSize = settings.style === "dotted" ? 0.12 : 0.55;
        const gapSize = settings.style === "dotted" ? 0.18 : 0.35;
        return createPortal(
          <Edges
            key={`${mesh.uuid}-${settings.style}-${settings.widthPx}-${settings.hex}`}
            geometry={mesh.geometry}
            threshold={25}
            color={settings.hex}
            lineWidth={settings.widthPx}
            dashed={dashed}
            dashSize={dashSize}
            gapSize={gapSize}
            transparent
            depthWrite={false}
            toneMapped={false}
            renderOrder={900}
            raycast={() => null}
          />,
          mesh,
        );
      })}
    </>
  );
}
