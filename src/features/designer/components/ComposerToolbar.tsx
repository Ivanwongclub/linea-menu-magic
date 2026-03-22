import React, { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Upload, Plus, Download, Cloud, CloudOff, Loader2 } from 'lucide-react'
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
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(session.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setEditName(session.name) }, [session.name])

  const commitName = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== session.name) onRenameSession(trimmed)
    else setEditName(session.name)
    setIsEditing(false)
  }

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background">
      {/* Left: back + session identity */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
          title="Back to Studio"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-border flex-shrink-0" />

        {/* Session name — click to edit */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setEditName(session.name); setIsEditing(false) } }}
              autoFocus
              className="text-sm font-medium bg-secondary px-2 py-1 rounded outline-none border border-border focus:border-foreground transition-colors min-w-[180px] text-foreground"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-foreground hover:bg-secondary px-2 py-1 rounded transition-colors truncate max-w-[240px]"
              title="Click to rename"
            >
              {session.name}
            </button>
          )}

          {/* Save status indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0" title={saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'All changes saved' : 'Unsaved changes'}>
            {saveStatus === 'saving' ? (
              <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
            ) : saveStatus === 'saved' ? (
              <Cloud className="w-3 h-3 text-muted-foreground" />
            ) : (
              <CloudOff className="w-3 h-3 text-amber-500" />
            )}
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {saveStatus === 'saving' ? 'Saving' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
            </span>
          </div>
        </div>
      </div>

      {/* Center: canvas tools */}
      <div className="flex items-center gap-1">
        <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-[var(--radius)] cursor-pointer hover:border-foreground transition-colors text-foreground">
          <Upload className="w-3 h-3" />
          <span className="hidden md:inline">Background</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onUploadBackground}
          />
        </label>

        <Button variant="outline" size="sm" onClick={onOpenProductPicker} className="text-xs gap-1.5">
          <Plus className="w-3 h-3" />
          <span className="hidden md:inline">Add Component</span>
        </Button>

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5 ml-2 border border-border rounded-[var(--radius)] overflow-hidden">
          <button
            onClick={() => onZoom(Math.max(0.25, zoom - 0.1))}
            className="w-7 h-7 flex items-center justify-center text-xs hover:bg-secondary transition-colors text-foreground"
          >
            −
          </button>
          <button
            onClick={() => onZoom(1)}
            className="text-[10px] font-mono px-2 h-7 flex items-center hover:bg-secondary transition-colors text-muted-foreground"
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => onZoom(Math.min(3, zoom + 0.1))}
            className="w-7 h-7 flex items-center justify-center text-xs hover:bg-secondary transition-colors text-foreground"
          >
            +
          </button>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExport} className="text-xs gap-1.5">
          <Download className="w-3 h-3" />
          <span className="hidden md:inline">Export</span>
        </Button>
        <Button variant="default" size="sm" onClick={onCreateRFQ} className="text-xs">
          Request Sample
        </Button>
      </div>
    </div>
  )
}
