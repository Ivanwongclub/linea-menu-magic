import { useState, useCallback } from "react";
import { Code, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface EmbedModalProps {
  brochureId: string;
  brochureTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const EmbedModal = ({ brochureId, brochureTitle, isOpen, onClose }: EmbedModalProps) => {
  const [copied, setCopied] = useState(false);

  const embedUrl = `${window.location.origin}/portfolio/view/${brochureId}?embed=true`;
  const embedCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      toast.success("Embed code copied!");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Failed to copy");
    });
  }, [embedCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Code size={18} className="text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">Embed "{brochureTitle}"</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        <div className="px-6 py-4">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Preview</p>
          <div className="rounded-lg overflow-hidden border border-border" style={{ height: "300px" }}>
            <iframe
              src={embedUrl}
              className="w-full h-full"
              title={`Embed preview: ${brochureTitle}`}
            />
          </div>
        </div>

        {/* Code snippet */}
        <div className="px-6 pb-6">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Embed Code</p>
          <div className="relative">
            <pre className="bg-muted rounded-lg p-4 text-xs text-foreground overflow-x-auto font-mono leading-relaxed">
              {embedCode}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium transition-colors hover:bg-primary-hover"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbedModal;
