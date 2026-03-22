import React, { useRef, useEffect, useCallback, useState } from 'react'
import { RotateCw, ImagePlus } from 'lucide-react'
import type { DesignSession, DesignLayer } from '../types'

interface ComposerCanvasProps {
  session: DesignSession
  layers: DesignLayer[]
  selectedLayerIds: string[]
  onSelectLayer: (id: string | null, additive?: boolean) => void
  onUpdateLayer: (id: string, changes: Partial<DesignLayer>) => void
  onDeleteLayer: (id: string) => void
  readOnly?: boolean
}

export default function ComposerCanvas({
  session,
  layers,
  selectedLayerIds,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  readOnly = false,
}: ComposerCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasBounds, setCanvasBounds] = useState<DOMRect | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => {
      setCanvasBounds(canvas.getBoundingClientRect())
    })
    observer.observe(canvas)
    setCanvasBounds(canvas.getBoundingClientRect())
    return () => observer.disconnect()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (selectedLayerIds.length === 0) return
      if (readOnly) return

      const nudge = e.shiftKey ? 0.01 : 0.002

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          selectedLayerIds.forEach(id => {
            const layer = layers.find(l => l.id === id)
            if (layer && !layer.is_locked) onUpdateLayer(id, { x: Math.max(0, layer.x - nudge) })
          })
          break
        case 'ArrowRight':
          e.preventDefault()
          selectedLayerIds.forEach(id => {
            const layer = layers.find(l => l.id === id)
            if (layer && !layer.is_locked) onUpdateLayer(id, { x: Math.min(1, layer.x + nudge) })
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          selectedLayerIds.forEach(id => {
            const layer = layers.find(l => l.id === id)
            if (layer && !layer.is_locked) onUpdateLayer(id, { y: Math.max(0, layer.y - nudge) })
          })
          break
        case 'ArrowDown':
          e.preventDefault()
          selectedLayerIds.forEach(id => {
            const layer = layers.find(l => l.id === id)
            if (layer && !layer.is_locked) onUpdateLayer(id, { y: Math.min(1, layer.y + nudge) })
          })
          break
        case 'Delete':
        case 'Backspace':
          if (document.activeElement === canvasRef.current) {
            selectedLayerIds.forEach(id => onDeleteLayer(id))
          }
          break
        case 'Escape':
          onSelectLayer(null)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedLayerIds, layers, readOnly, onUpdateLayer, onDeleteLayer, onSelectLayer])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvasBg === 'true') {
      onSelectLayer(null)
    }
  }, [onSelectLayer])

  return (
    <div
      ref={canvasRef}
      tabIndex={0}
      onClick={handleCanvasClick}
      className="relative w-full h-full overflow-hidden bg-[hsl(var(--muted))] outline-none select-none"
      style={{ touchAction: 'none' }}
    >
      {session.background_image_url ? (
        <img
          src={session.background_image_url}
          alt="Garment background"
          data-canvas-bg="true"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-auto"
        />
      ) : (
        <EmptyCanvasPlaceholder />
      )}

      {[...layers]
        .sort((a, b) => a.layer_order - b.layer_order)
        .map(layer =>
          layer.is_visible ? (
            <CanvasLayer
              key={layer.id}
              layer={layer}
              canvasRef={canvasRef}
              canvasBounds={canvasBounds}
              isSelected={selectedLayerIds.includes(layer.id)}
              onSelect={(additive) => onSelectLayer(layer.id, additive)}
              onUpdate={(changes) => onUpdateLayer(layer.id, changes)}
              onGroupDrag={(dx, dy) => {
                // Move all selected layers together
                selectedLayerIds.forEach(id => {
                  const l = layers.find(ll => ll.id === id)
                  if (l && !l.is_locked && id !== layer.id) {
                    onUpdateLayer(id, {
                      x: Math.max(0, Math.min(1, l.x + dx)),
                      y: Math.max(0, Math.min(1, l.y + dy)),
                    })
                  }
                })
              }}
              isMultiSelected={selectedLayerIds.length > 1 && selectedLayerIds.includes(layer.id)}
              readOnly={readOnly || layer.is_locked}
            />
          ) : null
        )}
    </div>
  )
}

/* ─── CanvasLayer ──────────────────────────────── */

interface CanvasLayerProps {
  layer: DesignLayer
  canvasRef: React.RefObject<HTMLDivElement | null>
  canvasBounds: DOMRect | null
  isSelected: boolean
  onSelect: (additive?: boolean) => void
  onUpdate: (changes: Partial<DesignLayer>) => void
  onGroupDrag: (dx: number, dy: number) => void
  isMultiSelected: boolean
  readOnly: boolean
}

function CanvasLayer({ layer, canvasRef, canvasBounds, isSelected, onSelect, onUpdate, onGroupDrag, isMultiSelected, readOnly }: CanvasLayerProps) {
  const isAnnotation = layer.layer_type === 'annotation'

  const baseSize = canvasBounds
    ? Math.min(canvasBounds.width, canvasBounds.height) * (isAnnotation ? 0.2 : 0.15) * layer.scale
    : 60

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${layer.x * 100}%`,
    top: `${layer.y * 100}%`,
    width: isAnnotation ? 'auto' : `${baseSize}px`,
    height: isAnnotation ? 'auto' : `${baseSize}px`,
    minWidth: isAnnotation ? `${Math.max(80, baseSize * 0.8)}px` : undefined,
    transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scaleX(${layer.flip_x ? -1 : 1}) scaleY(${layer.flip_y ? -1 : 1})`,
    opacity: layer.opacity,
    cursor: readOnly ? 'default' : isSelected ? 'move' : 'pointer',
    zIndex: layer.layer_order + 10,
  }

  /* ── Drag ─────────────────────────── */
  function handlePointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    if (readOnly) { onSelect(e.shiftKey); return }
    onSelect(e.shiftKey)

    const startX = e.clientX
    const startY = e.clientY
    const startLayerX = layer.x
    const startLayerY = layer.y
    const canvas = canvasRef.current
    if (!canvas) return
    const bounds = canvas.getBoundingClientRect()

    function handlePointerMove(ev: PointerEvent) {
      const dx = (ev.clientX - startX) / bounds.width
      const dy = (ev.clientY - startY) / bounds.height
      onUpdate({
        x: Math.max(0, Math.min(1, startLayerX + dx)),
        y: Math.max(0, Math.min(1, startLayerY + dy)),
      })
      // Move grouped layers
      if (isMultiSelected) {
        onGroupDrag(dx === 0 && dy === 0 ? 0 : (ev.clientX - startX) / bounds.width - (startLayerX + dx - layer.x - dx), dx === 0 && dy === 0 ? 0 : 0)
      }
    }

    let lastDx = 0
    let lastDy = 0

    function handlePointerMoveGroup(ev: PointerEvent) {
      const dx = (ev.clientX - startX) / bounds.width
      const dy = (ev.clientY - startY) / bounds.height
      onUpdate({
        x: Math.max(0, Math.min(1, startLayerX + dx)),
        y: Math.max(0, Math.min(1, startLayerY + dy)),
      })
      if (isMultiSelected) {
        const deltaDx = dx - lastDx
        const deltaDy = dy - lastDy
        lastDx = dx
        lastDy = dy
        onGroupDrag(deltaDx, deltaDy)
      }
    }

    function handlePointerUp() {
      window.removeEventListener('pointermove', isMultiSelected ? handlePointerMoveGroup : handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', isMultiSelected ? handlePointerMoveGroup : handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  /* ── Rotate ──────────────────────── */
  function handleRotateStart(e: React.PointerEvent) {
    e.stopPropagation()
    const canvas = canvasRef.current
    if (!canvas) return
    const bounds = canvas.getBoundingClientRect()
    const centerX = bounds.left + layer.x * bounds.width
    const centerY = bounds.top + layer.y * bounds.height

    function handlePointerMove(ev: PointerEvent) {
      const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * (180 / Math.PI) + 90
      onUpdate({ rotation: angle })
    }

    function handlePointerUp() {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  /* ── Scale ───────────────────────── */
  function handleScaleStart(e: React.PointerEvent) {
    e.stopPropagation()
    const startX = e.clientX
    const startScale = layer.scale
    const canvas = canvasRef.current
    if (!canvas) return
    const bounds = canvas.getBoundingClientRect()
    const refSize = Math.min(bounds.width, bounds.height)

    function handlePointerMove(ev: PointerEvent) {
      const delta = (ev.clientX - startX) / refSize
      onUpdate({ scale: Math.max(0.1, Math.min(5, startScale + delta * 3)) })
    }

    function handlePointerUp() {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const textStyle = layer.text_style ?? {}

  return (
    <div style={style} onPointerDown={handlePointerDown}>
      {/* Layer content */}
      {isAnnotation ? (
        <div
          className="px-3 py-2 rounded-md pointer-events-none whitespace-pre-wrap break-words"
          style={{
            fontSize: `${textStyle.fontSize ?? 14}px`,
            fontWeight: textStyle.fontWeight ?? 'normal',
            color: textStyle.color ?? 'hsl(var(--foreground))',
            backgroundColor: textStyle.backgroundColor ?? 'hsl(var(--background) / 0.85)',
            textAlign: textStyle.textAlign ?? 'left',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 1px 4px hsl(var(--foreground) / 0.08)',
            maxWidth: '280px',
          }}
        >
          {layer.text_content || 'Empty note'}
        </div>
      ) : (
        <img
          src={layer.image_url}
          alt={layer.name || 'Layer'}
          draggable={false}
          className="w-full h-full object-contain pointer-events-none"
        />
      )}

      {/* Selection outline + handles */}
      {isSelected && !readOnly && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              border: `2px solid ${isMultiSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}`,
              outline: '1px solid hsl(var(--background))',
              outlineOffset: '-1px',
            }}
          />

          {!isMultiSelected && (
            <>
              {/* Rotation handle */}
              <div
                onPointerDown={handleRotateStart}
                className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab"
              >
                <div className="w-5 h-5 rounded-full bg-[hsl(var(--background))] border-2 border-[hsl(var(--foreground))] flex items-center justify-center shadow-sm">
                  <RotateCw size={10} className="text-[hsl(var(--foreground))]" />
                </div>
                <div className="w-px h-4 bg-[hsl(var(--foreground))]" />
              </div>

              {/* Scale handle */}
              <div
                onPointerDown={handleScaleStart}
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-[hsl(var(--background))] border-2 border-[hsl(var(--foreground))] cursor-nwse-resize shadow-sm"
              />

              {/* Corner dots */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[hsl(var(--background))] border-2 border-[hsl(var(--foreground))] pointer-events-none" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[hsl(var(--background))] border-2 border-[hsl(var(--foreground))] pointer-events-none" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[hsl(var(--background))] border-2 border-[hsl(var(--foreground))] pointer-events-none" />
            </>
          )}

          {/* Layer name tooltip */}
          {layer.name && (
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-[10px] font-medium tracking-wide rounded-sm">
              {layer.name}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─── Empty state ────────────────────────────────── */

function EmptyCanvasPlaceholder() {
  return (
    <div
      data-canvas-bg="true"
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4 pointer-events-none max-w-xs text-center">
        <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-secondary/50">
          <ImagePlus size={28} className="text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Start your concept board
          </p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Upload a garment or flat-lay image as your background, then add components from the Studio library.
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60 uppercase tracking-widest">
          <span>JPG</span>
          <span>·</span>
          <span>PNG</span>
          <span>·</span>
          <span>WEBP</span>
          <span>·</span>
          <span>Up to 10 MB</span>
        </div>
      </div>
    </div>
  )
}
