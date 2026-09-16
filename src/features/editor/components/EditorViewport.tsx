import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Box } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StudioEnvironment } from "./StudioEnvironment";
import { EditorModel } from "./EditorModel";
import type { EditorColour, EditorFinish } from "../hooks/useEditorProduct";

interface EditorViewportProps {
  modelStoragePath: string | null;
  sizePrimaryMm: number;
  isMetal: boolean;
  finish: EditorFinish | null;
  colour: EditorColour | null;
}

function ViewportFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 bg-foreground/[0.06] border border-foreground/10 animate-pulse" />
    </div>
  );
}

/** Never a demo mesh — a product with no uploaded model gets an empty state (v3-review §10). */
function EmptyModelState() {
  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="max-w-sm text-center space-y-4">
        <div className="mx-auto w-12 h-12 flex items-center justify-center border border-foreground">
          <Box className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-light tracking-wide text-foreground">No 3D model yet</h2>
          <p className="text-sm text-muted-foreground">This product doesn't have an uploaded model to preview.</p>
        </div>
      </div>
    </div>
  );
}

export function EditorViewport({ modelStoragePath, sizePrimaryMm, isMetal, finish, colour }: EditorViewportProps) {
  if (!modelStoragePath) {
    return <EmptyModelState />;
  }

  const url = supabase.storage.from("product-models").getPublicUrl(modelStoragePath).data.publicUrl;

  return (
    <div className="relative flex-1 bg-secondary/20">
      <Suspense fallback={<ViewportFallback />}>
        <Canvas camera={{ position: [0, 0, 60], fov: 35 }} dpr={[1, 2]}>
          <StudioEnvironment />
          <EditorModel url={url} sizePrimaryMm={sizePrimaryMm} isMetal={isMetal} finish={finish} colour={colour} />
          <OrbitControls enablePan={false} minDistance={20} maxDistance={200} />
        </Canvas>
      </Suspense>
    </div>
  );
}
