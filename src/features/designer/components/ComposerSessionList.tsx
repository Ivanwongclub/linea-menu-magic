import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Layers, MoreHorizontal, Pencil, Trash2, Share2, Lock, Link2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDesignSessions } from '../hooks/useDesignSessions'
import type { DesignSession } from '../types'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

interface ComposerSessionListProps {
  teamId: string
}

export default function ComposerSessionList({ teamId }: ComposerSessionListProps) {
  const navigate = useNavigate()
  const { sessions, loading, createSession, deleteSession, updateSession } = useDesignSessions(teamId)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCreate = async () => {
    try {
      const session = await createSession('Untitled Composition')
      navigate(`/designer-studio/compose/${session.id}`)
    } catch {
      toast.error('Failed to create session')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSession(id)
      toast.success('Session deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleRenameSubmit = async (id: string) => {
    if (renameValue.trim()) {
      await updateSession(id, { name: renameValue.trim() })
    }
    setRenamingId(null)
  }

  const handleToggleShare = async (session: DesignSession) => {
    const newStatus = session.status === 'shared' ? 'draft' : 'shared'
    const { error } = await supabase.from('design_sessions').update({ status: newStatus }).eq('id', session.id)
    if (error) { toast.error('Failed to update status'); return }
    toast.success(newStatus === 'shared' ? 'Composition shared' : 'Composition set to draft')
    // Trigger refetch via updateSession
    await updateSession(session.id, { name: session.name })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Visual Composer</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Place and visualise trim products on your garment designs
          </p>
        </div>
        <Button variant="default" size="sm" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Composition
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">Loading sessions...</p>
        </div>
      ) : sessions.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sessions.map(session => (
            <div
              key={session.id}
              className="group relative border border-border rounded-[calc(var(--radius)*2)] overflow-hidden cursor-pointer hover:border-foreground transition-colors duration-200"
              onClick={() => navigate(`/designer-studio/compose/${session.id}`)}
            >
              {/* Thumbnail */}
              <div className="aspect-[4/3] bg-secondary overflow-hidden">
                {session.thumbnail_url ? (
                  <img src={session.thumbnail_url} alt={session.name} className="w-full h-full object-cover" />
                ) : session.background_image_url ? (
                  <img src={session.background_image_url} alt={session.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Layers className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                {renamingId === session.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameSubmit(session.id)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(session.id); if (e.key === 'Escape') setRenamingId(null) }}
                    onClick={e => e.stopPropagation()}
                    className="text-sm font-medium w-full bg-transparent border-b border-foreground outline-none text-foreground"
                  />
                ) : (
                  <p className="text-sm font-medium truncate text-foreground">{session.name}</p>
                )}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant={session.status === 'shared' ? 'published' : 'draft'} className="text-[8px] px-1 py-0 leading-tight">
                    {session.status === 'shared' ? 'Shared' : 'Draft'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(session.updated_at)}
                  </span>
                </div>
              </div>

              {/* Hover actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-background/90 border border-border hover:border-foreground transition-colors">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => { setRenamingId(session.id); setRenameValue(session.name) }}>
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(session.id)} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleShare(session) }}>
                      {session.status === 'shared' ? <Lock className="w-3.5 h-3.5 mr-2" /> : <Share2 className="w-3.5 h-3.5 mr-2" />}
                      {session.status === 'shared' ? 'Set to Draft' : 'Share'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-[calc(var(--radius)*2)]">
          <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-2">No compositions yet</p>
          <p className="text-xs text-muted-foreground/60 mb-4">
            Create your first composition to start placing trims on garment designs
          </p>
          <Button variant="default" size="sm" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New Composition
          </Button>
        </div>
      )}
    </div>
  )
}