import { Color, Vector2, Vector4 } from "three";
import type { ColourGradient, GradientBounds, GradientPaint } from "./gradient.ts";

interface Shader {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
}

/** One projection keeps a fill continuous across source meshes and text glyphs. */
export function gradientShaderPatch(shader: Shader, base: GradientPaint | undefined, zones: { gradient?: ColourGradient; preserveColour?: boolean }[] | null, zoneBounds: GradientBounds): void {
  if (!base && !zones?.some(zone => zone.gradient)) return;
  shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vWincycGradientPosition;");
  shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\nvWincycGradientPosition = ( modelMatrix * vec4( transformed, 1.0 ) ).xy;");
  let declarations = `varying vec2 vWincycGradientPosition;
vec3 wincycGradient( vec3 a, vec3 b, vec2 axis, vec4 bounds, float midpoint ) {
  vec2 size = bounds.zw - bounds.xy;
  float extent = max( dot( abs( axis ), size ), 0.000001 );
  float t = clamp( dot( vWincycGradientPosition - ( bounds.xy + bounds.zw ) * 0.5, axis ) / extent + 0.5, 0.0, 1.0 );
  t = t <= midpoint ? 0.5 * t / midpoint : 0.5 + 0.5 * ( t - midpoint ) / ( 1.0 - midpoint );
  return mix( a, b, t );
}`;
  const fill = (name: string, colour: ColourGradient, bounds: GradientBounds): string => {
    const radians = colour.angle * Math.PI / 180;
    shader.uniforms[`${name}From`] = { value: new Color(colour.from) };
    shader.uniforms[`${name}To`] = { value: new Color(colour.to) };
    shader.uniforms[`${name}Axis`] = { value: new Vector2(Math.cos(radians), Math.sin(radians)) };
    shader.uniforms[`${name}Bounds`] = { value: new Vector4(...bounds) };
    shader.uniforms[`${name}Midpoint`] = { value: colour.midpoint };
    declarations += `\nuniform vec3 ${name}From, ${name}To;\nuniform vec2 ${name}Axis;\nuniform vec4 ${name}Bounds;\nuniform float ${name}Midpoint;`;
    // Preserve maps, vertex colours and alpha. PBR lighting follows this fill.
    return `diffuseColor.rgb = wincycGradient( ${name}From, ${name}To, ${name}Axis, ${name}Bounds, ${name}Midpoint );
#ifdef USE_MAP
diffuseColor.rgb *= sampledDiffuseColor.rgb;
#endif
#if defined( USE_COLOR_ALPHA ) || defined( USE_COLOR )
diffuseColor.rgb *= vColor.rgb;
#endif`;
  };
  let code = "";
  if (base) {
    const excluded = (zones ?? []).flatMap((zone, index) => !zone.preserveColour || zone.gradient ? [`abs( vZoneIndex - ${index + 1}.0 ) < 0.5`] : []);
    code += `{\n${excluded.length ? `if ( !( ${excluded.join(" || ")} ) ) {\n` : ""}${fill("wincycBaseGradient", base.colour, base.bounds)}\n${excluded.length ? "}" : ""}\n}\n`;
  }
  zones?.forEach((zone, index) => {
    if (zone.gradient) code += `if ( abs( vZoneIndex - ${index + 1}.0 ) < 0.5 ) {\n${fill(`wincycZoneGradient${index}`, zone.gradient, zoneBounds)}\n}\n`;
  });
  shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>\n${declarations}`);
  shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\n${code}`);
}
