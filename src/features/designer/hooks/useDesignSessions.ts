import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { DesignSession } from '../types'

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

  return { sessions, loading, error, createSession, updateSession, deleteSession, refetch: fetchSessions }
}
