import React from 'react'
import { ArrowLeft, Upload, Plus, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DesignSession } from '../types'

export type SaveStatus = 'saved' | 'saving' | 'unsaved'

interface ComposerToolbarProps {
  session: DesignSession
  saveStatus: SaveStatus
  zoom: number
  onBack: () => void
  onRenameSession: (name: string) => void
  onUploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void
  onOpenProductPicker: () => void
  onZoom: (level: number) => void
  onExport: () => void
  onCreateRFQ: () => void
}

export default function ComposerToolbar({
  session,
  saveStatus,
  zoom,
  onBack,
  onRenameSession,
  onUploadBackground,
  onOpenProductPicker,
  onZoom,
  onExport,
  onCreateRFQ,
}: ComposerToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      {/* Left: back + session name + save status */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={session.name}
          onChange={e => onRenameSession(e.target.value)}
          className="text-sm font-medium bg-transparent border-none outline-none focus:bg-[hsl(var(--secondary))] px-2 py-1 rounded transition-colors min-w-[200px] text-[hsl(var(--foreground))]"
          placeholder="Session name..."
        />

        <span className="text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap flex-shrink-0">
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Unsaved changes'}
        </span>
      </div>

      {/* Center: canvas tools */}
      <div className="flex items-center gap-1">
        <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.06em] border border-[hsl(var(--border))] rounded-[0.25rem] cursor-pointer hover:border-[hsl(var(--foreground))] transition-colors">
          <Upload className="w-3 h-3" />
          Background
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onUploadBackground}
          />
        </label>

        <Button variant="outline" size="sm" onClick={onOpenProductPicker} className="text-xs">
          <Plus className="w-3 h-3 mr-1" />
          Add Trim
        </Button>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onZoom(Math.max(0.25, zoom - 0.1))}
            className="w-6 h-6 flex items-center justify-center text-xs border border-[hsl(var(--border))] rounded hover:border-[hsl(var(--foreground))] transition-colors"
          >
            −
          </button>
          <span className="text-xs font-mono w-12 text-center text-[hsl(var(--foreground))]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoom(Math.min(3, zoom + 0.1))}
            className="w-6 h-6 flex items-center justify-center text-xs border border-[hsl(var(--border))] rounded hover:border-[hsl(var(--foreground))] transition-colors"
          >
            +
          </button>
          <button
            onClick={() => onZoom(1)}
            className="text-[10px] px-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExport} className="text-xs">
          <Download className="w-3 h-3 mr-1" />
          Export
        </Button>
        <Button variant="default" size="sm" onClick={onCreateRFQ} className="text-xs">
          Request Sample
        </Button>
      </div>
    </div>
  )
}
