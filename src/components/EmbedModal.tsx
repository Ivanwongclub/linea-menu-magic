import { useState, useCallback } from "react";
import { Code, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmbedModalProps {
  slug: string;
  brochureTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const HEIGHT_PRESETS = [
  { label: "Compact", value: 500 },
  { label: "Standard", value: 700 },
  { label: "Full", value: 900 },
] as const;

const EmbedModal = ({ slug, brochureTitle, isOpen, onClose }: EmbedModalProps) => {
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState(700);

  const embedUrl = `${window.location.origin}/ecollections/${slug}?embed=true`;
  const embedCode = `<iframe src="${embedUrl}" width="100%" height="${height}" frameborder="0" allowfullscreen></iframe>`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      toast.success("Embed code copied!");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Failed to copy");
    });
  }, [embedCode]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Code size={18} className="text-muted-foreground" />
            Embed "{brochureTitle}"
          </DialogTitle>
        </DialogHeader>

        {/* Height presets */}
        <div className="px-6 pt-4">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Height</p>
          <div className="flex gap-2">
            {HEIGHT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setHeight(preset.value)}
                className={`px-3 py-1.5 rounded-none text-xs font-medium transition-colors ${
                  height === preset.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {preset.label} ({preset.value}px)
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="px-6 pt-4">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Preview</p>
          <div className="rounded-lg overflow-hidden border border-border" style={{ height: Math.min(height, 300) }}>
            <iframe
              src={embedUrl}
              className="w-full h-full border-none"
              title={`Embed preview: ${brochureTitle}`}
            />
          </div>
        </div>

        {/* Code snippet */}
        <div className="px-6 pt-4 pb-6">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Embed Code</p>
          <div className="relative">
            <pre className="bg-muted rounded-lg p-4 pr-28 text-xs text-foreground overflow-x-auto font-mono leading-relaxed">
              {embedCode}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-primary text-primary-foreground text-xs font-medium transition-colors hover:opacity-90"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy code"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmbedModal;
