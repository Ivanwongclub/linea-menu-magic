import { Component, lazy, Suspense, useEffect, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/I18nProvider";

// R15: the R3F chunk never loads with the rest of the admin bundle.
const loadPreview = () => import("./ProductModelPreview");

/** Starts fetching the preview chunk ahead of the click, once a model exists (4h R5). */
export function preloadProductModelPreview() {
  loadPreview().catch(() => {
    /* surfaced by the slot's boundary when it is actually opened */
  });
}

type PreviewProps = ComponentProps<Awaited<ReturnType<typeof loadPreview>>["default"]>;

const SLOW_MS = 15000;
const FRAME = "h-[38rem] max-w-3xl mx-auto flex flex-col items-center justify-center gap-3 border border-border text-xs text-muted-foreground";

function Retry({ message, onRetry, state }: { message: string; onRetry: () => void; state: string }) {
  const { t } = useI18n();
  return (
    <div className={FRAME} data-testid="model-preview-fallback" data-state={state}>
      <p>{message}</p>
      <Button variant="outline" size="sm" className="h-7 text-xs" data-testid="model-preview-retry" onClick={onRetry}>
        {t("admin.model.preview.retry")}
      </Button>
    </div>
  );
}

function Loading({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_MS);
    return () => window.clearTimeout(timer);
  }, []);
  return slow ? (
    <Retry message={t("admin.model.preview.slow")} onRetry={onRetry} state="slow" />
  ) : (
    <div className={FRAME} data-testid="model-preview-fallback" data-state="loading">
      {t("admin.model.scale.previewLoading")}
    </div>
  );
}

/** A dynamic import that failed stays failed for this document (the browser caches the module map entry). */
function isChunkLoadError(error: unknown): boolean {
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(String(error));
}

class PreviewBoundary extends Component<
  { fallback: (retry: () => void) => ReactNode; onRetry: () => void; children: ReactNode },
  { error: unknown }
> {
  state: { error: unknown } = { error: null };
  static getDerivedStateFromError(error: unknown) {
    return { error: error ?? new Error("preview failed") };
  }
  componentDidCatch(error: unknown) {
    console.warn("CMS model preview failed", error);
  }
  retry = () => {
    // A stale or failed chunk can only be fetched again by a new document.
    if (isChunkLoadError(this.state.error)) {
      window.location.reload();
      return;
    }
    this.setState({ error: null });
    this.props.onRetry();
  };
  render() {
    return this.state.error ? this.props.fallback(this.retry) : this.props.children;
  }
}

/**
 * The CMS preview's lazy boundary (4h R5). Before, a bare `Suspense` meant a
 * chunk or model failure took the whole admin page down to the app's error
 * screen, and a chunk request that never settled left "Loading preview…"
 * forever. Now: the chunk is preloaded once a model exists; a failure in the
 * chunk or inside the canvas (the OBJ fetch) shows a message with Retry —
 * a failed chunk reloads the page (the browser won't refetch it in this
 * document), anything else re-creates the lazy component and remounts the
 * canvas; a load that outlasts 15 s offers Retry instead of waiting silently.
 */
export function ProductModelPreviewSlot(props: PreviewProps) {
  const { t } = useI18n();
  const [attempt, setAttempt] = useState(0);
  // A rejected `lazy` caches its failure — a retry needs a fresh one.
  const Preview = useMemo(() => lazy(loadPreview), [attempt]);
  const retry = () => setAttempt((n) => n + 1);

  return (
    <PreviewBoundary
      key={attempt}
      onRetry={retry}
      fallback={(again) => <Retry message={t("admin.model.preview.failed")} onRetry={again} state="failed" />}
    >
      <Suspense fallback={<Loading onRetry={retry} />}>
        <Preview {...props} />
      </Suspense>
    </PreviewBoundary>
  );
}
