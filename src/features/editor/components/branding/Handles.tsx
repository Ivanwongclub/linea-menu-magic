import { useRef, type MutableRefObject, type PointerEvent as ReactPointerEvent } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../../store/useEditorStore";
import {
  HANDLE_HIT_PX,
  dragPatch,
  layerHandles,
  onCircle,
  startProgress,
  type DragProgress,
  type DragStart,
  type FacePoint,
  type HandleKind,
} from "../../lib/handleGeometry";
import type { Rect } from "../../lib/rulerLabelLayout";
import type { TextLayer } from "../../lib/recipe";

const RING_SEGMENTS = 96;

/**
 * Shared between the canvas (which knows the camera) and the DOM overlay
 * (which takes the pointer): the face-plane raycast, and the handles' screen
 * rects so the ruler labels keep clear of them.
 */
export interface HandleBridge {
  facePoint: ((clientX: number, clientY: number) => FacePoint | null) | null;
  rects: Rect[];
}

export interface HandleElements {
  root: SVGSVGElement | null;
  ring: SVGGElement | null;
  arc: SVGGElement | null;
  move: SVGGElement | null;
}

export function newHandleBridge(): HandleBridge {
  return { facePoint: null, rects: [] };
}

export function newHandleElements(): HandleElements {
  return { root: null, ring: null, arc: null, move: null };
}

/**
 * Inside the canvas: projects the selected layer's handles to screen each
 * frame and writes them straight onto the overlay's SVG (no React render
 * per frame), and provides the face-plane raycast for drags (4i R1: the
 * plane z = face top, face frame = world, since the model has no parent).
 */
export function HandleProjector({
  layer,
  faceZ,
  bridge,
  elements,
}: {
  layer: TextLayer | null;
  faceZ: number;
  bridge: MutableRefObject<HandleBridge>;
  elements: MutableRefObject<HandleElements>;
}) {
  const { camera, gl, size } = useThree();
  const scratch = useRef({ v: new THREE.Vector3(), raycaster: new THREE.Raycaster(), plane: new THREE.Plane(), ndc: new THREE.Vector2(), hit: new THREE.Vector3() });

  bridge.current.facePoint = (clientX, clientY) => {
    const rect = gl.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const { raycaster, plane, ndc, hit } = scratch.current;
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    plane.set(new THREE.Vector3(0, 0, 1), -faceZ);
    return raycaster.ray.intersectPlane(plane, hit) ? { x: hit.x, y: hit.y } : null;
  };

  useFrame(() => {
    const { root, ring, arc, move } = elements.current;
    if (!root || !layer) {
      bridge.current.rects = [];
      return;
    }
    const { v } = scratch.current;
    const project = (p: FacePoint) => {
      v.set(p.x, p.y, faceZ).project(camera);
      return { x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height };
    };
    const place = (el: SVGGElement | null, p: FacePoint | null) => {
      if (!el) return;
      if (!p) {
        el.style.display = "none";
        return;
      }
      const s = project(p);
      el.style.display = "";
      el.setAttribute("transform", `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})`);
      el.dataset.x = s.x.toFixed(1);
      el.dataset.y = s.y.toFixed(1);
      rects.push({ x: s.x - HANDLE_HIT_PX / 2, y: s.y - HANDLE_HIT_PX / 2, width: HANDLE_HIT_PX, height: HANDLE_HIT_PX });
    };

    const h = layerHandles(layer);
    const rects: Rect[] = [];
    place(arc, h.arcKnob);
    place(move, h.move);

    if (ring) {
      if (h.radius == null) {
        ring.style.display = "none";
      } else {
        ring.style.display = "";
        let d = "";
        for (let i = 0; i <= RING_SEGMENTS; i++) {
          const s = project(onCircle(h.centre, h.radius, (i / RING_SEGMENTS) * 360));
          d += `${i === 0 ? "M" : "L"}${s.x.toFixed(1)} ${s.y.toFixed(1)}`;
        }
        for (const path of Array.from(ring.querySelectorAll("path"))) path.setAttribute("d", d);
        const grab = project(h.ringGrab as FacePoint);
        const outward = project(onCircle(h.centre, h.radius + 1, layer.placement.arc_position_deg + 180));
        const len = Math.hypot(outward.x - grab.x, outward.y - grab.y) || 1;
        ring.dataset.grab = JSON.stringify({
          x: +grab.x.toFixed(1),
          y: +grab.y.toFixed(1),
          dx: +((outward.x - grab.x) / len).toFixed(4),
          dy: +((outward.y - grab.y) / len).toFixed(4),
        });
      }
    }
    root.style.visibility = "visible";
    bridge.current.rects = rects;
  });

  return null;
}

/**
 * The DOM side (4i R1): SVG over the canvas, handles for the selected layer
 * only — a ring for the radius, a knob for the arc position, a move handle
 * for straight text — each with a ≥ 28 px hit area and `touch-action: none`
 * so a finger drags instead of scrolling. Drags write the same store as the
 * numeric fields (live), hold autosave, and commit one undo entry and one
 * write on pointer-up.
 */
export function HandlesOverlay({
  layer,
  bridge,
  elements,
}: {
  layer: TextLayer;
  bridge: MutableRefObject<HandleBridge>;
  elements: MutableRefObject<HandleElements>;
}) {
  const { t } = useI18n();
  const drag = useRef<{ start: DragStart; progress: DragProgress; pointerId: number } | null>(null);

  const onDown = (kind: HandleKind) => (event: ReactPointerEvent<SVGGElement>) => {
    const at = bridge.current.facePoint?.(event.clientX, event.clientY);
    const store = useEditorStore.getState();
    const current = store.recipe.layers.find((l) => l.id === layer.id);
    if (!at || !current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const start: DragStart = { kind, layer: current, at };
    drag.current = { start, progress: startProgress(start), pointerId: event.pointerId };
    store.beginDrag();
  };

  const onMove = (event: ReactPointerEvent<SVGGElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const at = bridge.current.facePoint?.(event.clientX, event.clientY);
    if (!at) return;
    useEditorStore.getState().updateLayer(active.start.layer.id, dragPatch(active.start, active.progress, at));
  };

  const onUp = (event: ReactPointerEvent<SVGGElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    drag.current = null;
    useEditorStore.getState().endDrag();
  };

  const handlers = (kind: HandleKind) => ({
    onPointerDown: onDown(kind),
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerCancel: onUp,
    style: { touchAction: "none", cursor: kind === "move" ? "move" : "grab" } as const,
  });

  const r = HANDLE_HIT_PX / 2;
  return (
    <svg
      ref={(el) => (elements.current.root = el)}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ visibility: "hidden" }}
      data-testid="layer-handles"
      data-layer-id={layer.id}
    >
      <g ref={(el) => (elements.current.ring = el)} data-testid="handle-radius" aria-label={t("editor.handles.radius")} className="pointer-events-auto" {...handlers("radius")}>
        <path fill="none" stroke="transparent" strokeWidth={HANDLE_HIT_PX} style={{ pointerEvents: "stroke" }} />
        <path fill="none" stroke="hsl(var(--background))" strokeWidth={3} style={{ pointerEvents: "none" }} />
        <path fill="none" stroke="hsl(var(--foreground))" strokeWidth={1.25} strokeDasharray="4 3" style={{ pointerEvents: "none" }} />
      </g>
      <g ref={(el) => (elements.current.arc = el)} data-testid="handle-arc" aria-label={t("editor.handles.arcPosition")} className="pointer-events-auto" {...handlers("arc")}>
        <circle r={r} fill="transparent" />
        <circle r={6} fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth={1.5} />
      </g>
      <g ref={(el) => (elements.current.move = el)} data-testid="handle-move" aria-label={t("editor.handles.move")} className="pointer-events-auto" {...handlers("move")}>
        <circle r={r} fill="transparent" />
        <circle r={7} fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth={1.5} />
        <path d="M-3.5 0H3.5M0 -3.5V3.5" stroke="hsl(var(--foreground))" strokeWidth={1.25} />
      </g>
    </svg>
  );
}
