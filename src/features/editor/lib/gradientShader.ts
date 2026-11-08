import { Color, Vector2, Vector3, Vector4 } from "three";
import { hexRgb, type ColourGradient, type GradientBounds, type GradientPaint } from "./gradient.ts";

interface Shader {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
}

// Every material in a GP reads the same vector. Text loading/placement can
// update the union bounds after a source mesh's shader has already compiled.
const boundsUniforms = new WeakMap<GradientBounds, Vector4>();
function boundsUniform(bounds: GradientBounds): Vector4 {
  let uniform = boundsUniforms.get(bounds);
  if (!uniform) { uniform = new Vector4(...bounds); boundsUniforms.set(bounds, uniform); }
  return uniform;
}

export function updateGradientBounds(bounds: GradientBounds, value: GradientBounds): void {
  bounds.splice(0, 4, ...value);
  boundsUniforms.get(bounds)?.fromArray(value);
}

/** One projection keeps a fill continuous across source meshes and text glyphs. */
export function gradientShaderPatch(shader: Shader, base: GradientPaint | undefined, zones: { gradient?: ColourGradient; preserveColour?: boolean }[] | null, zoneBounds: GradientBounds): void {
  if (!base && !zones?.some(zone => zone.gradient)) return;
  shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vWincycGradientPosition;");
  shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\nvWincycGradientPosition = ( modelMatrix * vec4( transformed, 1.0 ) ).xy;");
  let declarations = `varying vec2 vWincycGradientPosition;
vec3 wincycGradient( vec3 a, vec3 b, vec2 axis, vec4 bounds, float midpoint, float brightnessMode, vec3 brightnessColour, vec2 brightnessRange ) {
  vec2 size = bounds.zw - bounds.xy;
  float extent = max( dot( abs( axis ), size ), 0.000001 );
  float t = clamp( dot( vWincycGradientPosition - ( bounds.xy + bounds.zw ) * 0.5, axis ) / extent + 0.5, 0.0, 1.0 );
  t = t <= midpoint ? 0.5 * t / midpoint : 0.5 + 0.5 * ( t - midpoint ) / ( 1.0 - midpoint );
  if ( brightnessMode > 0.5 ) {
    float level = mix( brightnessRange.x, brightnessRange.y, t );
    vec3 colour = mix( brightnessColour, level < 0.0 ? vec3( 0.0 ) : vec3( 1.0 ), abs( level ) );
    // Tint/shade in displayed sRGB, then return to linear space for PBR lighting.
    return mix( colour / 12.92, pow( ( colour + 0.055 ) / 1.055, vec3( 2.4 ) ), step( vec3( 0.04045 ), colour ) );
  }
  return mix( a, b, t );
}`;
  const fill = (name: string, colour: ColourGradient, bounds: GradientBounds): string => {
    const radians = colour.angle * Math.PI / 180;
    shader.uniforms[`${name}From`] = { value: new Color(colour.from) };
    shader.uniforms[`${name}To`] = { value: new Color(colour.to) };
    shader.uniforms[`${name}Axis`] = { value: new Vector2(Math.cos(radians), Math.sin(radians)) };
    shader.uniforms[`${name}Bounds`] = { value: boundsUniform(bounds) };
    shader.uniforms[`${name}Midpoint`] = { value: colour.midpoint };
    shader.uniforms[`${name}BrightnessMode`] = { value: colour.brightness ? 1 : 0 };
    shader.uniforms[`${name}BrightnessColour`] = { value: new Vector3(...hexRgb(colour.brightness?.colour ?? colour.from)) };
    shader.uniforms[`${name}BrightnessRange`] = { value: new Vector2((colour.brightness?.from ?? 0) / 100, (colour.brightness?.to ?? 0) / 100) };
    declarations += `\nuniform vec3 ${name}From, ${name}To, ${name}BrightnessColour;\nuniform vec2 ${name}Axis, ${name}BrightnessRange;\nuniform vec4 ${name}Bounds;\nuniform float ${name}Midpoint, ${name}BrightnessMode;`;
    // Preserve maps, vertex colours and alpha. PBR lighting follows this fill.
    return `diffuseColor.rgb = wincycGradient( ${name}From, ${name}To, ${name}Axis, ${name}Bounds, ${name}Midpoint, ${name}BrightnessMode, ${name}BrightnessColour, ${name}BrightnessRange );
#ifdef USE_MAP
diffuseColor.rgb *= sampledDiffuseColor.rgb;
#endif
#if defined( USE_COLOR_ALPHA ) || defined( USE_COLOR )
diffuseColor.rgb *= vColor.rgb;
#endif`;
  };
  let code = "";
  if (base) {
    const excluded = (zones ?? []).flatMap((zone, index) => !zone.preserveColour || zone.gradient ? [`abs( wincycZoneSlot - ${index + 1}.0 ) < 0.5`] : []);
    code += `{\n${excluded.length ? `if ( !( ${excluded.join(" || ")} ) ) {\n` : ""}${fill("wincycBaseGradient", base.colour, base.bounds)}\n${excluded.length ? "}" : ""}\n}\n`;
  }
  zones?.forEach((zone, index) => {
    if (zone.gradient) code += `if ( abs( wincycZoneSlot - ${index + 1}.0 ) < 0.5 ) {\n${fill(`wincycZoneGradient${index}`, zone.gradient, zoneBounds)}\n}\n`;
  });
  shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>\n${declarations}`);
  shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\n${code}`);
}
