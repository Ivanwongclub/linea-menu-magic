import React, { useRef, useEffect, useCallback, useState } from 'react'
import { RotateCw, ImagePlus } from 'lucide-react'
import type { DesignSession, DesignLayer } from '../types'

/* ─── Snap helpers ─────────────────────────────── */
const SNAP_THRESHOLD = 0.015 // fractional distance to snap
type SnapGuide = { axis: 'x' | 'y'; position: number }

function computeSnapGuides(
  dragX: number,
  dragY: number,
  dragId: string,
  layers: DesignLayer[],
  selectedIds: string[],
): { snappedX: number; snappedY: number; guides: SnapGuide[] } {
  const guides: SnapGuide[] = []
  let snappedX = dragX
  let snappedY = dragY

  // Canvas reference points: center + edges
  const refPointsX = [0, 0.25, 0.5, 0.75, 1]
  const refPointsY = [0, 0.25, 0.5, 0.75, 1]

  // Add other layers' positions as snap targets
  layers.forEach(l => {
    if (selectedIds.includes(l.id) || !l.is_visible) return
    refPointsX.push(l.x)
    refPointsY.push(l.y)
  })

  let bestDx = SNAP_THRESHOLD
  let bestDy = SNAP_THRESHOLD

  for (const rx of refPointsX) {
    const d = Math.abs(dragX - rx)
    if (d < bestDx) {
      bestDx = d
      snappedX = rx
    }
  }
  for (const ry of refPointsY) {
    const d = Math.abs(dragY - ry)
    if (d < bestDy) {
      bestDy = d
      snappedY = ry
    }
  }

  if (snappedX !== dragX) guides.push({ axis: 'x', position: snappedX })
  if (snappedY !== dragY) guides.push({ axis: 'y', position: snappedY })

  return { snappedX, snappedY, guides }
}

/* ─── Canvas ───────────────────────────────────── */

interface ComposerCanvasProps {
  session: DesignSession
  layers: DesignLayer[]
  selectedLayerIds: string[]
  onSelectLayer: (id: string | null, additive?: boolean) => void
  onUpdateLayer: (id: string, changes: Partial<DesignLayer>) => void
  onDeleteLayer: (id: string) => void
  onDuplicateSelected?: () => void
  readOnly?: boolean
}

export default function ComposerCanvas({
  session,
  layers,
  selectedLayerIds,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateSelected,
  readOnly = false,
}: ComposerCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasBounds, setCanvasBounds] = useState<DOMRect | null>(null)
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([])

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
      if (readOnly) return

      // Ctrl/Cmd+D = duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedLayerIds.length > 0) {
        e.preventDefault()
        onDuplicateSelected?.()
        return
      }

      if (selectedLayerIds.length === 0) return

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
  }, [selectedLayerIds, layers, readOnly, onUpdateLayer, onDeleteLayer, onSelectLayer, onDuplicateSelected])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvasBg === 'true') {
      onSelectLayer(null)
    }
  }, [onSelectLayer])

  const handleSnapUpdate = useCallback((guides: SnapGuide[]) => {
    setActiveGuides(guides)
  }, [])

  const handleDragEnd = useCallback(() => {
    setActiveGuides([])
  }, [])

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

      {/* Snap guide lines */}
      {activeGuides.map((g, i) =>
        g.axis === 'x' ? (
          <div
            key={`guide-${i}`}
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: `${g.position * 100}%`,
              width: '1px',
              backgroundColor: 'hsl(var(--primary) / 0.5)',
            }}
          />
        ) : (
          <div
            key={`guide-${i}`}
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: `${g.position * 100}%`,
              height: '1px',
              backgroundColor: 'hsl(var(--primary) / 0.5)',
            }}
          />
        )
      )}

      {[...layers]
        .sort((a, b) => a.layer_order - b.layer_order)
        .map(layer =>
          layer.is_visible ? (
            <CanvasLayer
              key={layer.id}
              layer={layer}
              allLayers={layers}
              selectedIds={selectedLayerIds}
              canvasRef={canvasRef}
              canvasBounds={canvasBounds}
              isSelected={selectedLayerIds.includes(layer.id)}
              onSelect={(additive) => onSelectLayer(layer.id, additive)}
              onUpdate={(changes) => onUpdateLayer(layer.id, changes)}
              onGroupDrag={(dx, dy) => {
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
              onSnapUpdate={handleSnapUpdate}
              onDragEnd={handleDragEnd}
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
  allLayers: DesignLayer[]
  selectedIds: string[]
  canvasRef: React.RefObject<HTMLDivElement | null>
  canvasBounds: DOMRect | null
  isSelected: boolean
  onSelect: (additive?: boolean) => void
  onUpdate: (changes: Partial<DesignLayer>) => void
  onGroupDrag: (dx: number, dy: number) => void
  onSnapUpdate: (guides: SnapGuide[]) => void
  onDragEnd: () => void
  isMultiSelected: boolean
  readOnly: boolean
}

function CanvasLayer({
  layer, allLayers, selectedIds, canvasRef, canvasBounds,
  isSelected, onSelect, onUpdate, onGroupDrag,
  onSnapUpdate, onDragEnd, isMultiSelected, readOnly,
}: CanvasLayerProps) {
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

  /* ── Drag with snapping ──────────── */
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

    let lastDx = 0
    let lastDy = 0

    function handlePointerMove(ev: PointerEvent) {
      const rawDx = (ev.clientX - startX) / bounds.width
      const rawDy = (ev.clientY - startY) / bounds.height
      const rawX = Math.max(0, Math.min(1, startLayerX + rawDx))
      const rawY = Math.max(0, Math.min(1, startLayerY + rawDy))

      const { snappedX, snappedY, guides } = computeSnapGuides(
        rawX, rawY, layer.id, allLayers, selectedIds,
      )
      onSnapUpdate(guides)
      onUpdate({ x: snappedX, y: snappedY })

      if (isMultiSelected) {
        const totalDx = snappedX - startLayerX
        const totalDy = snappedY - startLayerY
        const deltaDx = totalDx - lastDx
        const deltaDy = totalDy - lastDy
        lastDx = totalDx
        lastDy = totalDy
        onGroupDrag(deltaDx, deltaDy)
      }
    }

    function handlePointerUp() {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      onSnapUpdate([])
      onDragEnd()
    }

    window.addEventListener('pointermove', handlePointerMove)
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
              <div
                onPointerDown={handleRotateStart}
                className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab"
              >
                <div className="w-5 h-5 rounded-full bg-[hsl(var(--background))] border-2 border-[hsl(var(--foreground))] flex items-center justify-center shadow-sm">
                  <RotateCw size={10} className="text-[hsl(var(--foreground))]" />
                </div>
                <div className="w-px h-4 bg-[hsl(var(--foreground))]" />
              </div>

              <div
                onPointerDown={handleScaleStart}
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-[hsl(var(--background))] border-2 border-[hsl(var(--foreground))] cursor-nwse-resize shadow-sm"
              />

              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[hsl(var(--background))] border-2 border-[hsl(var(--foreground))] pointer-events-none" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[hsl(var(--background))] border-2 border-[hsl(var(--foreground))] pointer-events-none" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[hsl(var(--background))] border-2 border-[hsl(var(--foreground))] pointer-events-none" />
            </>
          )}

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
