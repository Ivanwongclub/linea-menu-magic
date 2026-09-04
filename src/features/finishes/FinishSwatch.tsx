import { useMemo, type CSSProperties } from "react";
import { describeFinishSurface, finishSwatchStyle, type FinishMaterial } from "./swatch";

interface Props {
  finish: FinishMaterial;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/**
 * A rendered swatch. Exposes `data-surface` (mirror / brushed / matt / sand /
 * soft / gloss) so callers and tests can see which branch of the model it
 * took without inspecting pixels.
 */
export function FinishSwatch({ finish, className, style, title }: Props) {
  const key = `${finish.hex_approx}|${finish.metalness}|${finish.roughness}|${finish.anisotropy}|${finish.swatch_url ?? ""}`;
  const bg = useMemo(() => finishSwatchStyle(finish), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div
      data-surface={describeFinishSurface(finish)}
      className={className}
      style={{ ...bg, ...style }}
      title={title}
      role="img"
      aria-label={title}
    />
  );
}
