/**
 * One shader-patch composer for the studio material (E1 §6 R7). Every patch
 * goes through here, so `onBeforeCompile` is written once and the program
 * cache key is derived from the features actually enabled — two patches on one
 * material can no longer collide on the hook or share a wrong cached program.
 *
 * Patches:
 *   twoTone  antique buffed / oxide mix by baked occlusion (3c R2, 3e R2).
 *   brush    per-fragment anisotropy tangent (Phase 5 R5): linear along the
 *            face frame's X for BRUSHED, radial about the face centre for
 *            CIRCLE_BRUSHED. three derives the tangent from screen-space UV
 *            derivatives, which is constant per triangle — that is what made
 *            brushed metal read as a fan of flat facets.
 */
import * as THREE from "three";
import { oxideColor, twoToneFragmentChunks, twoToneVertexChunks } from "./twoTone";

export type BrushKind = "linear" | "radial";

export interface ShaderPatchOptions {
  twoTone?: boolean;
  /** The finish's oxide colour, as stored; absent falls back to the 3c oxide. */
  twoToneOxideHex?: string | null;
  brush?: BrushKind | null;
}

type Shader = { vertexShader: string; fragmentShader: string; uniforms: Record<string, { value: unknown }> };

/** `#include <x>` → the include plus `code`. */
export function after(source: string, include: string, code: string): string {
  return source.replace(`#include <${include}>`, `#include <${include}>\n${code}`);
}

const BRUSH_DIRECTION: Record<BrushKind, string> = {
  linear: "vec3( 1.0, 0.0, 0.0 )",
  radial: "vec3( vBrushWorld.xy, 0.0 )",
};

function brushPatch(shader: Shader, kind: BrushKind): void {
  shader.vertexShader = after(shader.vertexShader, "common", "varying vec3 vBrushWorld;");
  shader.vertexShader = after(shader.vertexShader, "project_vertex", "\tvBrushWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;");
  shader.fragmentShader = after(shader.fragmentShader, "common", "varying vec3 vBrushWorld;");
  // The face frame is world space here: the part is centred on the origin with
  // its decorated face on +Z, and the relief meshes are its siblings.
  shader.fragmentShader = after(
    shader.fragmentShader,
    "normal_fragment_begin",
    `#ifdef USE_ANISOTROPY
	{
		vec3 brushDir = ${BRUSH_DIRECTION[kind]};
		if ( dot( brushDir, brushDir ) < 1e-8 ) brushDir = vec3( 1.0, 0.0, 0.0 );
		vec3 brushT = ( viewMatrix * vec4( normalize( brushDir ), 0.0 ) ).xyz;
		brushT = brushT - normal * dot( normal, brushT );
		if ( dot( brushT, brushT ) < 1e-8 ) {
			brushT = ( viewMatrix * vec4( 0.0, 0.0, 1.0, 0.0 ) ).xyz;
			brushT = brushT - normal * dot( normal, brushT );
		}
		brushT = normalize( brushT );
		tbn[ 0 ] = brushT;
		tbn[ 1 ] = cross( normal, brushT );
	}
#endif`,
  );
}

/**
 * Applies the enabled patches to `material` and records them in `userData`,
 * so `clonePatched` can give a derived material (a recess floor, a wall) the
 * same appearance.
 */
export function applyShaderPatches(material: THREE.MeshPhysicalMaterial, options: ShaderPatchOptions): void {
  const twoTone = !!options.twoTone;
  const brush = options.brush ?? null;
  material.userData = { ...material.userData, shaderPatch: options };
  const features = [twoTone ? "two-tone" : null, brush ? `brush-${brush}` : null].filter(Boolean) as string[];
  if (features.length === 0) {
    material.onBeforeCompile = () => undefined;
    material.customProgramCacheKey = () => "wincyc:plain";
    return;
  }
  material.onBeforeCompile = (shader) => {
    if (twoTone) {
      twoToneVertexChunks(shader as Shader);
      twoToneFragmentChunks(shader as Shader, oxideColor(material, options.twoToneOxideHex));
    }
    if (brush) brushPatch(shader as Shader, brush);
  };
  material.customProgramCacheKey = () => `wincyc:${features.join("+")}`;
}

/** A copy of the studio material — same appearance, caller's own flags (stencil, side). */
export function clonePatched(material: THREE.MeshPhysicalMaterial): THREE.MeshPhysicalMaterial {
  const clone = material.clone();
  const options = material.userData?.shaderPatch as ShaderPatchOptions | undefined;
  if (options) applyShaderPatches(clone, options);
  return clone;
}

/** Which brush the finish's surface axis asks for; null when it isn't anisotropic at all (R5). */
export function brushForSurface(surfaceCode: string | undefined | null, anisotropy: number): BrushKind | null {
  if (!(anisotropy > 0)) return null;
  return surfaceCode === "CIRCLE_BRUSHED" ? "radial" : "linear";
}
