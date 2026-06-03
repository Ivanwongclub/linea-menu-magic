import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";

const DesignerStudioEditor = () => {
  const [params] = useSearchParams();
  const model = params.get("model");
  const name = params.get("name");
  const { language } = useI18n();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const src = (() => {
    const qs = new URLSearchParams();
    if (model) qs.set("model", model);
    if (name) qs.set("name", name);
    const q = qs.toString();
    return `/3d-editor/index.html${q ? `?${q}` : ""}`;
  })();

  // Push language to iframe whenever it changes or the editor signals ready.
  useEffect(() => {
    const send = () => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "set-language", language },
        "*",
      );
    };
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "editor-ready") send();
    };
    window.addEventListener("message", onMsg);
    // Also send on language change (in case editor already loaded)
    send();
    return () => window.removeEventListener("message", onMsg);
  }, [language]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between px-6 lg:px-10 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to="/designer-studio/trim-library"
            className="inline-flex items-center gap-1.5 text-xs tracking-[0.05em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Trim Library
          </Link>
          <span className="text-muted-foreground/30">/</span>
          <h1 className="text-sm font-medium tracking-tight truncate">
            3D Editor{name ? ` — ${name}` : ""}
          </h1>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        title="3D Editor"
        src={src}
        className="flex-1 w-full border-0 bg-background"
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
      />
    </div>
  );
};

export default DesignerStudioEditor;
