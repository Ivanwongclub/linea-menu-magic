import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadedModelPreview from "@/components/designer-studio/UploadedModelPreview";
import mo06 from "@/assets/model-previews/MO06.obj.asset.json";
import mo09 from "@/assets/model-previews/MO09.obj.asset.json";

export default function ModelPreview() {
  return (
    <main className="min-h-screen bg-background text-foreground px-5 py-8 lg:px-8 lg:py-12">
      <div className="max-w-7xl mx-auto">
        <Button asChild variant="ghost" className="px-0 mb-8"><Link to="/designer-studio"><ArrowLeft />Designer Studio</Link></Button>
        <header className="mb-10 border-b border-border pb-6">
          <h1 className="text-3xl font-medium">3D Model Preview</h1>
          <p className="mt-3 text-sm text-muted-foreground">MO06 / MO09 · Neutral material · MTL files not supplied</p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UploadedModelPreview name="MO06" url={mo06.url} size="30.5 MB" />
          <UploadedModelPreview name="MO09" url={mo09.url} size="6.5 MB" />
        </div>
      </div>
    </main>
  );
}