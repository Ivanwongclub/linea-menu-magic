import { useState } from "react";
import { Box, RotateCcw, ZoomIn, ZoomOut, Move } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Model3DViewerProps {
  hasModel: boolean;
}

const Model3DViewer = ({ hasModel }: Model3DViewerProps) => {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  if (!hasModel) {
    return (
      <div className="aspect-video bg-muted/50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-border">
        <Box className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">等待製造商上傳 3D 模型</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mock 3D Viewer - In real implementation, use Three.js */}
      <div 
        className="aspect-video bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg flex items-center justify-center relative overflow-hidden"
        style={{ perspective: '1000px' }}
      >
        {/* Simulated 3D Object */}
        <div 
          className="w-32 h-32 relative transition-transform duration-300"
          style={{ 
            transform: `rotateY(${rotation}deg) scale(${zoom})`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Front face */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg shadow-lg border border-primary/30 flex items-center justify-center">
            <span className="text-primary/60 text-xs font-medium">BTN</span>
          </div>
          {/* Side decorations for 3D effect */}
          <div 
            className="absolute inset-0 bg-primary/30 rounded-lg"
            style={{ 
              transform: 'translateZ(-10px)',
              opacity: 0.5
            }}
          />
        </div>

        {/* Grid Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
        </div>

        {/* Floating Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setRotation(r => r - 45)}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setZoom(z => Math.min(2, z + 0.2))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
          >
            <Move className="w-4 h-4" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="absolute top-4 left-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
          拖曳旋轉 • 滾輪縮放
        </div>
      </div>

      {/* Model Info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">模型格式: OBJ</span>
        <span className="text-muted-foreground">檔案大小: 2.4 MB</span>
      </div>
    </div>
  );
};

export default Model3DViewer;
