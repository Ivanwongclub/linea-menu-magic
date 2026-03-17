import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { DesignExport } from '../types'

export function useDesignExports(sessionId: string) {
  const [exports, setExports] = useState<DesignExport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)

    supabase
      .from('design_exports')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setExports((data ?? []) as unknown as DesignExport[])
        setLoading(false)
      })
  }, [sessionId])

  const createExport = useCallback(async (exportUrl: string, exportType: 'png' | 'jpeg' | 'pdf') => {
    const { data, error } = await supabase
      .from('design_exports')
      .insert({ session_id: sessionId, export_url: exportUrl, export_type: exportType })
      .select()
      .single()

    if (error) throw error
    const exp = data as unknown as DesignExport
    setExports(prev => [exp, ...prev])
    return exp
  }, [sessionId])

  return { exports, loading, createExport }
}
