import React from 'react'
import { Eye, EyeOff, Lock, Unlock, Trash2, GripVertical } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import type { DesignLayer } from '../types'

interface LayerPanelProps {
  layers: DesignLayer[]
  selectedLayerId: string | null
  onSelectLayer: (id: string | null) => void
  onUpdateLayer: (id: string, changes: Partial<DesignLayer>) => void
  onDeleteLayer: (id: string) => void
  onReorderLayers: (orderedIds: string[]) => void
}

export default function LayerPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onReorderLayers,
}: LayerPanelProps) {
  const sorted = [...layers].sort((a, b) => b.layer_order - a.layer_order)
  const selectedLayer = layers.find(l => l.id === selectedLayerId)

  return (
    <div className="w-[240px] border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[hsl(var(--border))]">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
          Layers
        </p>
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">No layers yet</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]/60 mt-1">Add trims from the toolbar</p>
          </div>
        ) : (
          sorted.map(layer => (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer border-b border-[hsl(var(--border))]/50 transition-colors ${
                layer.id === selectedLayerId
                  ? 'bg-[hsl(var(--secondary))]'
                  : 'hover:bg-[hsl(var(--secondary))]/50'
              }`}
            >
              <GripVertical className="w-3 h-3 text-[hsl(var(--muted-foreground))]/40 flex-shrink-0 cursor-grab" />

              {/* Thumbnail */}
              <div className="w-7 h-7 rounded-sm bg-[hsl(var(--muted))] overflow-hidden flex-shrink-0">
                {layer.image_url && (
                  <img src={layer.image_url} alt="" className="w-full h-full object-contain" />
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] truncate ${
                  !layer.is_visible ? 'text-[hsl(var(--muted-foreground))]/50 line-through' : 'text-[hsl(var(--foreground))]'
                }`}>
                  {layer.name || 'Untitled'}
                </p>
                {layer.product?.item_code && (
                  <p className="text-[9px] font-mono text-[hsl(var(--muted-foreground))] truncate">
                    {layer.product.item_code}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); onUpdateLayer(layer.id, { is_visible: !layer.is_visible }) }}
                  className="p-1 rounded hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  {layer.is_visible
                    ? <Eye className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                    : <EyeOff className="w-3 h-3 text-[hsl(var(--muted-foreground))]/40" />
                  }
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onUpdateLayer(layer.id, { is_locked: !layer.is_locked }) }}
                  className="p-1 rounded hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  {layer.is_locked
                    ? <Lock className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
                    : <Unlock className="w-3 h-3 text-[hsl(var(--muted-foreground))]/40" />
                  }
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected layer properties */}
      {selectedLayer && (
        <div className="border-t border-[hsl(var(--border))] p-3 space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
            Properties
          </p>

          {/* Opacity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Opacity</span>
              <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                {Math.round(selectedLayer.opacity * 100)}%
              </span>
            </div>
            <Slider
              value={[selectedLayer.opacity * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={([v]) => onUpdateLayer(selectedLayer.id, { opacity: v / 100 })}
              className="w-full"
            />
          </div>

          {/* Scale */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Scale</span>
              <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                {selectedLayer.scale.toFixed(1)}×
              </span>
            </div>
            <Slider
              value={[selectedLayer.scale * 100]}
              min={10}
              max={500}
              step={5}
              onValueChange={([v]) => onUpdateLayer(selectedLayer.id, { scale: v / 100 })}
              className="w-full"
            />
          </div>

          {/* Rotation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Rotation</span>
              <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                {Math.round(selectedLayer.rotation)}°
              </span>
            </div>
            <Slider
              value={[selectedLayer.rotation + 180]}
              min={0}
              max={360}
              step={1}
              onValueChange={([v]) => onUpdateLayer(selectedLayer.id, { rotation: v - 180 })}
              className="w-full"
            />
          </div>

          {/* Delete */}
          <button
            onClick={() => onDeleteLayer(selectedLayer.id)}
            className="flex items-center gap-1.5 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors mt-2"
          >
            <Trash2 className="w-3 h-3" />
            Delete Layer
          </button>
        </div>
      )}
    </div>
  )
}
