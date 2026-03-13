import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, FileImage, CheckCircle2 } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UploadState = "idle" | "uploading" | "complete";

const ACCEPTED = ".pdf,.jpg,.jpeg,.png";
const ACCEPT_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const UploadModal = ({ isOpen, onClose }: UploadModalProps) => {
  const navigate = useNavigate();
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setState("idle");
      setProgress(0);
      setFileName("");
    }
  }, [isOpen]);

  const simulateUpload = useCallback((name: string) => {
    setFileName(name);
    setState("uploading");
    setProgress(0);

    const duration = 2000;
    const interval = 30;
    const steps = duration / interval;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setProgress(Math.min(Math.round((step / steps) * 100), 100));
      if (step >= steps) {
        clearInterval(timer);
        setState("complete");
      }
    }, interval);
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!ACCEPT_TYPES.includes(file.type)) return;
    simulateUpload(file.name);
  }, [simulateUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">Upload Brochure</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          {state === "idle" && (
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                dragOver ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <FileImage size={40} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1">
                Drag & drop your file here
              </p>
              <p className="text-xs text-muted-foreground">
                Accepts PDF, JPG, PNG
              </p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          )}

          {state === "uploading" && (
            <div className="text-center py-4">
              <FileImage size={32} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1 truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground mb-4">Processing…</p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-100 ease-linear"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: "hsl(var(--accent))",
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 tabular-nums">{progress}%</p>
            </div>
          )}

          {state === "complete" && (
            <div className="text-center py-4">
              <CheckCircle2 size={40} className="mx-auto mb-3" style={{ color: "hsl(var(--accent))" }} />
              <p className="text-base font-semibold text-foreground mb-1">Processing complete!</p>
              <p className="text-sm text-muted-foreground mb-6">Your brochure is ready to view.</p>
              <button
                onClick={() => {
                  onClose();
                  navigate("/portfolio/view/spring-collection-2025");
                }}
                className="px-6 py-2.5 bg-primary text-primary-foreground text-xs tracking-widest uppercase rounded-full transition-all duration-300 hover:bg-primary-hover"
              >
                View Now
              </button>
              <p className="text-xs text-muted-foreground mt-3 italic">
                Demo: navigates to a sample brochure
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
