import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { DesignSession } from '../types'

/** Shared variant-creation logic usable from any context */
export async function createVariantFromSession(sourceId: string, existingSessions?: DesignSession[]): Promise<DesignSession> {
  const { data: src, error: srcErr } = await supabase
    .from('design_sessions')
    .select('*')
    .eq('id', sourceId)
    .single()
  if (srcErr || !src) throw srcErr ?? new Error('Session not found')

  const baseName = ((src as any).name ?? 'Composition').replace(/ — Variant.*$/, '')
  const siblingCount = (existingSessions ?? []).filter(s => s.name.startsWith(baseName)).length
  const name = `${baseName} — Variant ${siblingCount + 1}`

  const user = (await supabase.auth.getUser()).data.user
  const { data: newSession, error: createErr } = await supabase
    .from('design_sessions')
    .insert({
      team_id: (src as any).team_id,
      name,
      background_image_url: (src as any).background_image_url ?? null,
      background_image_width: (src as any).background_image_width ?? null,
      background_image_height: (src as any).background_image_height ?? null,
      created_by: user?.id ?? null,
      status: 'draft',
    })
    .select()
    .single()
  if (createErr || !newSession) throw createErr ?? new Error('Failed to create variant')

  const { data: srcLayers } = await supabase
    .from('design_layers')
    .select('*')
    .eq('session_id', sourceId)
    .order('layer_order', { ascending: true })

  if (srcLayers && srcLayers.length > 0) {
    const layerInserts = srcLayers.map(({ id, created_at, ...rest }: any) => ({
      ...rest,
      session_id: (newSession as any).id,
    }))
    await supabase.from('design_layers').insert(layerInserts)
  }

  return newSession as unknown as DesignSession
}

export function useDesignSessions(teamId: string) {
  const [sessions, setSessions] = useState<DesignSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    if (!teamId) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('design_sessions')
      .select('*')
      .eq('team_id', teamId)
      .order('updated_at', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setSessions((data ?? []) as unknown as DesignSession[])
    }
    setLoading(false)
  }, [teamId])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const createSession = useCallback(async (name: string, backgroundUrl?: string, width?: number, height?: number) => {
    const user = (await supabase.auth.getUser()).data.user
    const { data, error: err } = await supabase
      .from('design_sessions')
      .insert({
        team_id: teamId,
        name,
        background_image_url: backgroundUrl ?? null,
        background_image_width: width ?? null,
        background_image_height: height ?? null,
        created_by: user?.id ?? null,
      })
      .select()
      .single()

    if (err) throw err
    const session = data as unknown as DesignSession
    setSessions(prev => [session, ...prev])
    return session
  }, [teamId])

  const updateSession = useCallback(async (id: string, updates: Partial<Pick<DesignSession, 'name' | 'status' | 'thumbnail_url' | 'background_image_url' | 'background_image_width' | 'background_image_height'>>) => {
    const { error: err } = await supabase
      .from('design_sessions')
      .update(updates)
      .eq('id', id)

    if (err) throw err
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s))
  }, [])

  const deleteSession = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('design_sessions')
      .delete()
      .eq('id', id)

    if (err) throw err
    setSessions(prev => prev.filter(s => s.id !== id))
  }, [])

  const duplicateSession = useCallback(async (sourceId: string, variantName?: string) => {
    // Fetch source session
    const { data: src, error: srcErr } = await supabase
      .from('design_sessions')
      .select('*')
      .eq('id', sourceId)
      .single()
    if (srcErr || !src) throw srcErr ?? new Error('Session not found')

    // Count existing variants to generate suffix
    const baseName = (src as any).name?.replace(/ — Variant \d+$/, '') ?? 'Composition'
    const name = variantName ?? `${baseName} — Variant ${sessions.filter(s => s.name.startsWith(baseName)).length + 1}`

    const user = (await supabase.auth.getUser()).data.user
    const { data: newSession, error: createErr } = await supabase
      .from('design_sessions')
      .insert({
        team_id: (src as any).team_id,
        name,
        background_image_url: (src as any).background_image_url ?? null,
        background_image_width: (src as any).background_image_width ?? null,
        background_image_height: (src as any).background_image_height ?? null,
        created_by: user?.id ?? null,
        status: 'draft',
      })
      .select()
      .single()
    if (createErr || !newSession) throw createErr ?? new Error('Failed to create variant')

    // Copy layers
    const { data: srcLayers } = await supabase
      .from('design_layers')
      .select('*')
      .eq('session_id', sourceId)
      .order('layer_order', { ascending: true })

    if (srcLayers && srcLayers.length > 0) {
      const layerInserts = srcLayers.map(({ id, created_at, ...rest }: any) => ({
        ...rest,
        session_id: (newSession as any).id,
      }))
      await supabase.from('design_layers').insert(layerInserts)
    }

    const session = newSession as unknown as DesignSession
    setSessions(prev => [session, ...prev])
    return session
  }, [teamId, sessions])

  return { sessions, loading, error, createSession, updateSession, deleteSession, duplicateSession, refetch: fetchSessions }
}
