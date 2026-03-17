import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useDesignSession } from '../hooks/useDesignSession'
import { useUserLibrary } from '@/features/products/hooks/useUserLibrary'
import ComposerCanvas from '../components/ComposerCanvas'
import ComposerToolbar from '../components/ComposerToolbar'
import type { SaveStatus } from '../components/ComposerToolbar'
import LayerPanel from '../components/LayerPanel'
import ProductPickerSheet from '../components/ProductPickerSheet'
import type { DesignLayer } from '../types'

const DEMO_TEAM_ID = 'demo-team'

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

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [exportLoading, setExportLoading] = useState(false)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // ─── Auto-save layer updates ──────────
  const handleUpdateLayer = useCallback(async (id: string, changes: Partial<DesignLayer>) => {
    // Optimistic local update
    updateLayer(id, changes)
    setSaveStatus('unsaved')

    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const { error } = await supabase
          .from('design_layers')
          .update(changes)
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
    if (selectedLayerId === id) setSelectedLayerId(null)
    await deleteLayer(id)
    toast.success('Layer deleted')
  }, [deleteLayer, selectedLayerId])

  const handleAddLayer = useCallback(async (layer: Omit<DesignLayer, 'id' | 'created_at' | 'product'>) => {
    await addLayer(layer)
    toast.success('Trim added to canvas')
  }, [addLayer])

  const handleRename = useCallback(async (name: string) => {
    if (!session) return
    await supabase.from('design_sessions').update({ name }).eq('id', session.id)
  }, [session])

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

    // Get image dimensions
    const img = new Image()
    img.onload = async () => {
      await supabase.from('design_sessions').update({
        background_image_url: publicUrl,
        background_image_width: img.naturalWidth,
        background_image_height: img.naturalHeight,
      }).eq('id', session.id)
      toast.success('Background uploaded')
      // Force reload
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
        onBack={() => navigate('/designer-studio/dashboard?tab=composer')}
        onRenameSession={handleRename}
        onUploadBackground={handleUploadBackground}
        onOpenProductPicker={() => setPickerOpen(true)}
        onZoom={setZoom}
        onExport={handleExport}
        onCreateRFQ={() => toast.info('RFQ creation coming soon')}
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
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onUpdateLayer={handleUpdateLayer}
              onDeleteLayer={handleDeleteLayer}
            />
          </div>
        </div>

        {/* Layer panel */}
        <LayerPanel
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onUpdateLayer={handleUpdateLayer}
          onDeleteLayer={handleDeleteLayer}
          onReorderLayers={reorderLayers}
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
