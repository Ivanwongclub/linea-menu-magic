import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useDesignSession } from '../hooks/useDesignSession'
import { createVariantFromSession } from '../hooks/useDesignSessions'
import { useUserLibrary } from '@/features/products/hooks/useUserLibrary'
import ComposerCanvas from '../components/ComposerCanvas'
import ComposerToolbar from '../components/ComposerToolbar'
import type { SaveStatus } from '../components/ComposerToolbar'
import LayerPanel from '../components/LayerPanel'
import ProductPickerSheet from '../components/ProductPickerSheet'
import type { DesignLayer } from '../types'

const DEMO_TEAM_ID = '00000000-0000-0000-0000-000000000001'

export default function ComposerPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLDivElement>(null)

  const { session, layers, loading, addLayer, updateLayer, deleteLayer, reorderLayers } = useDesignSession(sessionId ?? '')

  // Team ID for library
  const [teamId, setTeamId] = useState(DEMO_TEAM_ID)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata
      if (meta?.team_id) setTeamId(meta.team_id as string)
    })
  }, [])
  const { items: libraryItems } = useUserLibrary(teamId)

  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [exportLoading, setExportLoading] = useState(false)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Multi-select handler
  const handleSelectLayer = useCallback((id: string | null, additive?: boolean) => {
    if (id === null) {
      setSelectedLayerIds([])
      return
    }
    if (additive) {
      setSelectedLayerIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      )
    } else {
      setSelectedLayerIds([id])
    }
  }, [])

  // ─── Auto-save layer updates ──────────
  const handleUpdateLayer = useCallback(async (id: string, changes: Partial<DesignLayer>) => {
    updateLayer(id, changes)
    setSaveStatus('unsaved')

    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        // Filter to only DB-safe fields
        const { product, ...dbChanges } = changes as any
        const { error } = await supabase
          .from('design_layers')
          .update(dbChanges)
          .eq('id', id)
        if (error) throw error
        setSaveStatus('saved')
      } catch {
        setSaveStatus('unsaved')
        toast.error('Failed to save changes')
      }
    }, 1500)
  }, [updateLayer])

  const handleDeleteLayer = useCallback(async (id: string) => {
    setSelectedLayerIds(prev => prev.filter(x => x !== id))
    await deleteLayer(id)
    toast.success('Layer deleted')
  }, [deleteLayer])

  const handleAddLayer = useCallback(async (layer: Omit<DesignLayer, 'id' | 'created_at' | 'product'>) => {
    await addLayer(layer)
    toast.success('Component added to canvas')
  }, [addLayer])

  const handleAddAnnotation = useCallback(async () => {
    if (!session) return
    const newLayer: Omit<DesignLayer, 'id' | 'created_at' | 'product'> = {
      session_id: session.id,
      layer_order: layers.length,
      name: 'Annotation',
      image_url: '',
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      opacity: 1,
      flip_x: false,
      flip_y: false,
      is_visible: true,
      is_locked: false,
      layer_type: 'annotation',
      text_content: 'Add your note here',
      text_style: { fontSize: 14, fontWeight: 'normal', textAlign: 'left' },
    }
    await addLayer(newLayer)
    toast.success('Annotation added')
  }, [session, layers.length, addLayer])

  // Group / Ungroup
  const handleGroupSelected = useCallback(() => {
    if (selectedLayerIds.length < 2) return
    const groupId = `group-${Date.now()}`
    selectedLayerIds.forEach(id => {
      handleUpdateLayer(id, { group_id: groupId })
    })
    toast.success('Layers grouped')
  }, [selectedLayerIds, handleUpdateLayer])

  const handleUngroupSelected = useCallback(() => {
    selectedLayerIds.forEach(id => {
      handleUpdateLayer(id, { group_id: undefined })
    })
    toast.success('Layers ungrouped')
  }, [selectedLayerIds, handleUpdateLayer])

  // Duplicate selected layers
  const handleDuplicateSelected = useCallback(async () => {
    if (!session || selectedLayerIds.length === 0) return
    const toDuplicate = layers.filter(l => selectedLayerIds.includes(l.id))
    const newIds: string[] = []
    for (const src of toDuplicate) {
      const { id, created_at, product, ...rest } = src as any
      const newLayer = {
        ...rest,
        layer_order: layers.length + newIds.length,
        x: Math.min(1, src.x + 0.03),
        y: Math.min(1, src.y + 0.03),
        name: src.name ? `${src.name} copy` : 'Copy',
      }
      try {
        const added = await addLayer(newLayer)
        if (added?.id) newIds.push(added.id)
      } catch {}
    }
    if (newIds.length > 0) {
      setSelectedLayerIds(newIds)
      toast.success(`Duplicated ${newIds.length} item${newIds.length > 1 ? 's' : ''}`)
    }
  }, [session, selectedLayerIds, layers, addLayer])

  const handleRename = useCallback(async (name: string) => {
    if (!session) return
    await supabase.from('design_sessions').update({ name }).eq('id', session.id)
  }, [session])

  const handleShareStatusChange = useCallback(async (status: 'draft' | 'shared') => {
    if (!session) return
    const { error } = await supabase.from('design_sessions').update({ status }).eq('id', session.id)
    if (error) { toast.error('Failed to update share status'); return }
    toast.success(status === 'shared' ? 'Composition marked as shared' : 'Composition set to draft')
    window.location.reload()
  }, [session])

  const handleCreateVariant = useCallback(async () => {
    if (!session) return
    try {
      const variant = await createVariantFromSession(session.id)
      toast.success('Variant created — opening now')
      navigate(`/designer-studio/compose/${variant.id}`)
    } catch {
      toast.error('Failed to create variant')
    }
  }, [session, navigate])

  const handleUploadBackground = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !session) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB')
      return
    }

    const path = `backgrounds/${session.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('design-assets').upload(path, file, { contentType: file.type, upsert: true })
    if (error) { toast.error('Upload failed'); return }

    const { data: { publicUrl } } = supabase.storage.from('design-assets').getPublicUrl(path)

    const img = new Image()
    img.onload = async () => {
      await supabase.from('design_sessions').update({
        background_image_url: publicUrl,
        background_image_width: img.naturalWidth,
        background_image_height: img.naturalHeight,
      }).eq('id', session.id)
      toast.success('Background uploaded')
      window.location.reload()
    }
    img.src = publicUrl
  }, [session])

  const handleExport = useCallback(async () => {
    if (!canvasRef.current || !session) return
    setExportLoading(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const rendered = await html2canvas(canvasRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: null,
      })

      const link = document.createElement('a')
      link.download = `${session.name}-composition.png`
      link.href = rendered.toDataURL('image/png')
      link.click()

      rendered.toBlob(async (blob) => {
        if (!blob) return
        const path = `exports/${session.id}/${Date.now()}.png`
        await supabase.storage.from('design-assets').upload(path, blob, { contentType: 'image/png', upsert: false })
      }, 'image/png')

      toast.success('Exported successfully')
    } catch {
      toast.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }, [session])

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center h-screen bg-[hsl(var(--background))]">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading composer...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[hsl(var(--background))]">
      <ComposerToolbar
        session={session}
        zoom={zoom}
        saveStatus={saveStatus}
        onBack={() => navigate('/designer-studio/dashboard')}
        onRenameSession={handleRename}
        onUploadBackground={handleUploadBackground}
        onOpenProductPicker={() => setPickerOpen(true)}
        onAddAnnotation={handleAddAnnotation}
        onZoom={setZoom}
        onExport={handleExport}
        onCreateRFQ={() => toast.info('RFQ creation coming soon')}
        onShareStatusChange={handleShareStatusChange}
        onCreateVariant={handleCreateVariant}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 overflow-auto bg-[hsl(var(--secondary))]/50 p-8 flex items-center justify-center">
          <div
            ref={canvasRef}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 200ms ease',
              maxWidth: '900px',
              width: '100%',
              aspectRatio: session.background_image_width && session.background_image_height
                ? `${session.background_image_width} / ${session.background_image_height}`
                : '4 / 3',
            }}
          >
            <ComposerCanvas
              session={session}
              layers={layers}
              selectedLayerIds={selectedLayerIds}
              onSelectLayer={handleSelectLayer}
              onUpdateLayer={handleUpdateLayer}
              onDeleteLayer={handleDeleteLayer}
              onDuplicateSelected={handleDuplicateSelected}
            />
          </div>
        </div>

        {/* Layer panel */}
        <LayerPanel
          layers={layers}
          selectedLayerIds={selectedLayerIds}
          onSelectLayer={handleSelectLayer}
          onUpdateLayer={handleUpdateLayer}
          onDeleteLayer={handleDeleteLayer}
          onReorderLayers={reorderLayers}
          onGroupSelected={handleGroupSelected}
          onUngroupSelected={handleUngroupSelected}
          onDuplicateSelected={handleDuplicateSelected}
        />
      </div>

      <ProductPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        session={session}
        layers={layers}
        libraryItems={libraryItems.map(item => ({
          id: item.id,
          product_id: item.product_id,
          custom_name: item.custom_name,
          products: item.product ? {
            id: item.product.id,
            name: item.product.name,
            name_en: item.product.name_en,
            item_code: item.product.item_code,
            thumbnail_url: item.product.thumbnail_url,
          } : null,
        }))}
        onAddLayer={handleAddLayer}
        onGoToLibrary={() => navigate('/designer-studio/dashboard?tab=library')}
      />
    </div>
  )
}
