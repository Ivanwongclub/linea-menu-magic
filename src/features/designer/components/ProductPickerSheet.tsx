import React, { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import type { DesignLayer, DesignSession } from '../types'

interface LibraryProduct {
  id: string
  name: string
  name_en?: string | null
  item_code?: string | null
  thumbnail_url?: string | null
}

interface LibraryItem {
  id: string
  product_id: string
  custom_name?: string | null
  products?: LibraryProduct | null
}

interface ProductPickerSheetProps {
  open: boolean
  onClose: () => void
  session: DesignSession
  layers: DesignLayer[]
  libraryItems: LibraryItem[]
  onAddLayer: (layer: Omit<DesignLayer, 'id' | 'created_at' | 'product'>) => void
  onGoToLibrary: () => void
}

export default function ProductPickerSheet({
  open,
  onClose,
  session,
  layers,
  libraryItems,
  onAddLayer,
  onGoToLibrary,
}: ProductPickerSheetProps) {
  const [search, setSearch] = useState('')

  const filteredItems = useMemo(() => {
    if (!search.trim()) return libraryItems
    const q = search.toLowerCase()
    return libraryItems.filter(item => {
      const name = item.custom_name ?? item.products?.name_en ?? item.products?.name ?? ''
      const code = item.products?.item_code ?? ''
      return name.toLowerCase().includes(q) || code.toLowerCase().includes(q)
    })
  }, [libraryItems, search])

  function addLayerFromLibraryItem(item: LibraryItem) {
    onAddLayer({
      session_id: session.id,
      product_id: item.product_id,
      layer_order: layers.length,
      name: item.custom_name ?? item.products?.name_en ?? item.products?.name ?? 'Trim',
      image_url: item.products?.thumbnail_url ?? '',
      x: 0.5,
      y: 0.5,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
      flip_x: false,
      flip_y: false,
      is_visible: true,
      is_locked: false,
    })
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-[360px] p-0 flex flex-col overflow-hidden">
        <SheetTitle className="px-4 pt-4 pb-2 text-sm font-medium border-b border-[hsl(var(--border))]">
          Add Component to Canvas
        </SheetTitle>

        {/* Search */}
        <div className="p-3 border-b border-[hsl(var(--border))]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Search trims..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs border border-[hsl(var(--border))] rounded-[0.25rem] bg-[hsl(var(--background))] focus:outline-none focus:border-[hsl(var(--foreground))] transition-colors text-[hsl(var(--foreground))]"
            />
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-2">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => addLayerFromLibraryItem(item)}
                className="group relative border border-[hsl(var(--border))] rounded-[0.25rem] overflow-hidden hover:border-[hsl(var(--foreground))] transition-colors duration-150 text-left"
              >
                <div className="aspect-square bg-[hsl(var(--secondary))] overflow-hidden">
                  <img
                    src={item.products?.thumbnail_url ?? ''}
                    alt={item.products?.name_en ?? ''}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-medium line-clamp-1 text-[hsl(var(--foreground))]">
                    {item.custom_name ?? item.products?.name_en ?? item.products?.name}
                  </p>
                  <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] mt-0.5">
                    {item.products?.item_code}
                  </p>
                </div>
                <div className="absolute inset-0 bg-[hsl(var(--foreground))]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-[hsl(var(--background))]" />
                </div>
              </button>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-xs text-[hsl(var(--muted-foreground))]">
              No trims in your library.
              <br />
              <button onClick={onGoToLibrary} className="mt-2 underline underline-offset-4 hover:text-[hsl(var(--foreground))] transition-colors">
                Browse the catalog →
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
