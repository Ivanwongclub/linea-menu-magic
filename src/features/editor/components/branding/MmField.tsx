import { useState } from "react";
import { cn } from "@/lib/utils";

interface MmFieldProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  testId?: string;
  className?: string;
}

/**
 * A length in mm (C3): 2 dp at rest, 3 dp while focused. What the buyer types
 * is written unrounded; only the display rounds.
 */
export function MmField({ id, value, onChange, min = 0, testId, className }: MmFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div className={cn("flex items-baseline border-b border-border focus-within:border-foreground transition-colors", className)}>
      <input
        id={id}
        data-testid={testId}
        inputMode="decimal"
        className="w-full bg-transparent py-1 text-sm tabular-nums text-foreground outline-none"
        value={draft ?? value.toFixed(2)}
        onFocus={() => setDraft(value.toFixed(3))}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          setDraft(e.target.value);
          const next = Number(e.target.value.replace(",", "."));
          if (e.target.value.trim() !== "" && Number.isFinite(next) && next > min) onChange(next);
        }}
      />
      <span className="pl-1 text-xs text-muted-foreground">mm</span>
    </div>
  );
}
