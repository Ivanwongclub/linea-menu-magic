import React, { useState } from 'react'
import { Eye, EyeOff, Lock, Unlock, Trash2, GripVertical, Type, Group, Ungroup, Copy } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { DesignLayer } from '../types'

interface LayerPanelProps {
  layers: DesignLayer[]
  selectedLayerIds: string[]
  onSelectLayer: (id: string | null, additive?: boolean) => void
  onUpdateLayer: (id: string, changes: Partial<DesignLayer>) => void
  onDeleteLayer: (id: string) => void
  onReorderLayers: (orderedIds: string[]) => void
  onGroupSelected?: () => void
  onUngroupSelected?: () => void
  onDuplicateSelected?: () => void
}

export default function LayerPanel({
  layers,
  selectedLayerIds,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onReorderLayers,
  onGroupSelected,
  onUngroupSelected,
}: LayerPanelProps) {
  const sorted = [...layers].sort((a, b) => b.layer_order - a.layer_order)
  const selectedLayer = selectedLayerIds.length === 1 ? layers.find(l => l.id === selectedLayerIds[0]) : null
  const hasMultiSelection = selectedLayerIds.length > 1
  const selectedHaveGroup = hasMultiSelection && selectedLayerIds.some(id => {
    const l = layers.find(ll => ll.id === id)
    return l?.group_id
  })

  // Group labels
  const groupMap = new Map<string, DesignLayer[]>()
  layers.forEach(l => {
    if (l.group_id) {
      const arr = groupMap.get(l.group_id) ?? []
      arr.push(l)
      groupMap.set(l.group_id, arr)
    }
  })

  return (
    <div className="w-[240px] border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[hsl(var(--border))] flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
          Layers
        </p>
        {hasMultiSelection && (
          <div className="flex items-center gap-1">
            {onGroupSelected && (
              <Button variant="ghost" size="sm" onClick={onGroupSelected} className="h-6 px-1.5 text-[10px] gap-1" title="Group selected">
                <Group className="w-3 h-3" /> Group
              </Button>
            )}
            {selectedHaveGroup && onUngroupSelected && (
              <Button variant="ghost" size="sm" onClick={onUngroupSelected} className="h-6 px-1.5 text-[10px] gap-1" title="Ungroup">
                <Ungroup className="w-3 h-3" /> Ungroup
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">No layers yet</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]/60 mt-1">Add components from the toolbar</p>
          </div>
        ) : (
          sorted.map(layer => {
            const isSelected = selectedLayerIds.includes(layer.id)
            const isAnnotation = layer.layer_type === 'annotation'
            return (
              <div
                key={layer.id}
                onClick={(e) => onSelectLayer(layer.id, e.shiftKey)}
                className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer border-b border-[hsl(var(--border))]/50 transition-colors ${
                  isSelected
                    ? 'bg-[hsl(var(--secondary))]'
                    : 'hover:bg-[hsl(var(--secondary))]/50'
                }`}
              >
                <GripVertical className="w-3 h-3 text-[hsl(var(--muted-foreground))]/40 flex-shrink-0 cursor-grab" />

                {/* Thumbnail */}
                <div className="w-7 h-7 rounded-sm bg-[hsl(var(--muted))] overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {isAnnotation ? (
                    <Type className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                  ) : layer.image_url ? (
                    <img src={layer.image_url} alt="" className="w-full h-full object-contain" />
                  ) : null}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] truncate ${
                    !layer.is_visible ? 'text-[hsl(var(--muted-foreground))]/50 line-through' : 'text-[hsl(var(--foreground))]'
                  }`}>
                    {layer.name || (isAnnotation ? 'Annotation' : 'Untitled')}
                  </p>
                  {layer.group_id && (
                    <p className="text-[9px] text-[hsl(var(--primary))] truncate">
                      Grouped
                    </p>
                  )}
                  {!isAnnotation && layer.product?.item_code && (
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
            )
          })
        )}
      </div>

      {/* Selected layer properties */}
      {selectedLayer && (
        <SelectedLayerProperties
          layer={selectedLayer}
          onUpdate={(changes) => onUpdateLayer(selectedLayer.id, changes)}
          onDelete={() => onDeleteLayer(selectedLayer.id)}
        />
      )}

      {/* Multi-select info */}
      {hasMultiSelection && (
        <div className="border-t border-[hsl(var(--border))] p-3">
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
            {selectedLayerIds.length} items selected
          </p>
        </div>
      )}
    </div>
  )
}

function SelectedLayerProperties({
  layer,
  onUpdate,
  onDelete,
}: {
  layer: DesignLayer
  onUpdate: (changes: Partial<DesignLayer>) => void
  onDelete: () => void
}) {
  const isAnnotation = layer.layer_type === 'annotation'
  const [editingText, setEditingText] = useState(false)

  return (
    <div className="border-t border-[hsl(var(--border))] p-3 space-y-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
        Properties
      </p>

      {/* Annotation text editing */}
      {isAnnotation && (
        <div className="space-y-1">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Text</span>
          <Textarea
            value={layer.text_content ?? ''}
            onChange={e => onUpdate({ text_content: e.target.value })}
            rows={3}
            className="text-xs resize-none"
            placeholder="Enter annotation text..."
          />
        </div>
      )}

      {/* Name */}
      <div className="space-y-1">
        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Name</span>
        <Input
          value={layer.name ?? ''}
          onChange={e => onUpdate({ name: e.target.value })}
          className="h-7 text-xs"
          placeholder="Layer name"
        />
      </div>

      {/* Opacity */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Opacity</span>
          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
            {Math.round(layer.opacity * 100)}%
          </span>
        </div>
        <Slider
          value={[layer.opacity * 100]}
          min={0}
          max={100}
          step={1}
          onValueChange={([v]) => onUpdate({ opacity: v / 100 })}
          className="w-full"
        />
      </div>

      {/* Scale */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Scale</span>
          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
            {layer.scale.toFixed(1)}×
          </span>
        </div>
        <Slider
          value={[layer.scale * 100]}
          min={10}
          max={500}
          step={5}
          onValueChange={([v]) => onUpdate({ scale: v / 100 })}
          className="w-full"
        />
      </div>

      {/* Rotation */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Rotation</span>
          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
            {Math.round(layer.rotation)}°
          </span>
        </div>
        <Slider
          value={[layer.rotation + 180]}
          min={0}
          max={360}
          step={1}
          onValueChange={([v]) => onUpdate({ rotation: v - 180 })}
          className="w-full"
        />
      </div>

      {/* Annotation font size */}
      {isAnnotation && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Font Size</span>
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
              {(layer.text_style as any)?.fontSize ?? 14}px
            </span>
          </div>
          <Slider
            value={[(layer.text_style as any)?.fontSize ?? 14]}
            min={8}
            max={48}
            step={1}
            onValueChange={([v]) => onUpdate({ text_style: { ...((layer.text_style as any) ?? {}), fontSize: v } })}
            className="w-full"
          />
        </div>
      )}

      {/* Delete */}
      <button
        onClick={onDelete}
        className="flex items-center gap-1.5 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors mt-2"
      >
        <Trash2 className="w-3 h-3" />
        Delete Layer
      </button>
    </div>
  )
}
