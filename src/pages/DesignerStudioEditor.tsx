import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/features/i18n/I18nProvider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/AuthProvider";

const DesignerStudioEditor = () => {
  const [params] = useSearchParams();
  const model = params.get("model");
  const name = params.get("name");
  const slug = params.get("slug");
  const { language } = useI18n();
  const { session: authSession } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const src = (() => {
    const qs = new URLSearchParams();
    if (model) qs.set("model", model);
    if (name) qs.set("name", name);
    const q = qs.toString();
    return `/3d-editor/index.html${q ? `?${q}` : ""}`;
  })();

  // Save editor session on mount (only when a model is loaded)
  useEffect(() => {
    if (!model) return;
    supabase
      .from("editor_sessions")
      .insert({
        user_id: authSession?.user?.id ?? null,
        product_slug: slug,
        product_name: name ?? "Untitled",
        model_url: model,
      })
      .then(() => {
        /* no-op */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  const { data: sessions = [] } = useQuery({
    queryKey: ["editor-sessions", authSession?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("editor_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!authSession?.user?.id,
  });

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
          {authSession && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setHistoryOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs tracking-[0.05em] uppercase text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 border border-border"
              >
                <Clock className="h-3.5 w-3.5" />
                History
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {historyOpen && sessions.length > 0 && (
                <div className="absolute left-0 top-full mt-1 w-80 max-h-96 overflow-y-auto bg-background border border-border shadow-lg z-50">
                  {sessions.map((s: any) => (
                    <Link
                      key={s.id}
                      to={`/designer-studio/editor?model=${encodeURIComponent(s.model_url)}&name=${encodeURIComponent(s.product_name)}${s.product_slug ? `&slug=${encodeURIComponent(s.product_slug)}` : ""}`}
                      onClick={() => setHistoryOpen(false)}
                      className="flex flex-col px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-0"
                    >
                      <span className="text-sm font-medium truncate">{s.product_name}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {new Date(s.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
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
