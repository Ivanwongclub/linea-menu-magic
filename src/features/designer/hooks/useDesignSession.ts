import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { DesignSession, DesignLayer } from '../types'

export function useDesignSession(sessionId: string) {
  const [session, setSession] = useState<DesignSession | null>(null)
  const [layers, setLayers] = useState<DesignLayer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)

    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('design_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (!error && data) setSession(data as unknown as DesignSession)

      const { data: layerData } = await supabase
        .from('design_layers')
        .select('*, products(id, name, name_en, item_code, thumbnail_url)')
        .eq('session_id', sessionId)
        .order('layer_order', { ascending: true })

      if (layerData) {
        setLayers(layerData.map((l: any) => ({
          ...l,
          layer_type: l.layer_type ?? 'image',
          product: l.products ?? undefined,
          products: undefined,
        })) as DesignLayer[])
      }
      setLoading(false)
    }

    fetchSession()

    // Realtime subscription on layers
    const channel = supabase
      .channel(`design-layers-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'design_layers',
        filter: `session_id=eq.${sessionId}`,
      }, () => { fetchSession() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  const addLayer = useCallback(async (layer: Omit<DesignLayer, 'id' | 'created_at' | 'product'>) => {
    const { data, error } = await supabase
      .from('design_layers')
      .insert(layer)
      .select()
      .single()

    if (error) throw error
    return data as unknown as DesignLayer
  }, [])

  const updateLayer = useCallback(async (id: string, updates: Partial<Pick<DesignLayer, 'x' | 'y' | 'scale' | 'rotation' | 'opacity' | 'flip_x' | 'flip_y' | 'is_visible' | 'is_locked' | 'name' | 'layer_order' | 'image_url'>>) => {
    const { error } = await supabase
      .from('design_layers')
      .update(updates)
      .eq('id', id)

    if (error) throw error
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  }, [])

  const deleteLayer = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('design_layers')
      .delete()
      .eq('id', id)

    if (error) throw error
    setLayers(prev => prev.filter(l => l.id !== id))
  }, [])

  const reorderLayers = useCallback(async (orderedIds: string[]) => {
    const updates = orderedIds.map((id, i) =>
      supabase.from('design_layers').update({ layer_order: i }).eq('id', id)
    )
    await Promise.all(updates)
    setLayers(prev => {
      const map = new Map(prev.map(l => [l.id, l]))
      return orderedIds.map((id, i) => ({ ...map.get(id)!, layer_order: i }))
    })
  }, [])

  return { session, layers, loading, addLayer, updateLayer, deleteLayer, reorderLayers }
}
