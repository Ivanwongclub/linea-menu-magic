import { useParams, Link } from 'react-router-dom'
import { useDesignSession } from '../hooks/useDesignSession'
import ComposerCanvas from '../components/ComposerCanvas'
import BrandLogo from '@/components/viewer/BrandLogo'
import { Maximize, Minimize, EyeOff, AlertCircle } from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from 'react'

export default function PresentationPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { session, layers, loading } = useDesignSession(sessionId ?? '')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    if (session?.name) {
      document.title = `${session.name} · Concept Board — WIN-CYC`
    }
    return () => { document.title = 'WIN-CYC Group' }
  }, [session?.name])

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-6">
        <BrandLogo maxHeight={32} variant="dark" />
        <div className="flex flex-col items-center gap-2">
          <div className="w-48 h-0.5 rounded-full bg-border overflow-hidden">
            <div className="h-full w-1/3 bg-foreground/20 rounded-full animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground tracking-wide">Preparing your concept board…</p>
        </div>
      </div>
    )
  }

  // Not found
  if (!session) {
    return (
      <GatedScreen
        icon={<AlertCircle size={24} className="text-muted-foreground/40" />}
        heading="This concept board is unavailable"
        message="The link may have expired, or the board may no longer exist. Please contact your designer for an updated link."
      />
    )
  }

  // Not shared
  if (session.status !== 'shared') {
    return (
      <GatedScreen
        icon={<EyeOff size={24} className="text-muted-foreground/40" />}
        heading="This concept board is private"
        message="Your designer hasn't shared this board for viewing yet. Please check back later or reach out to them directly."
      />
    )
  }

  const visibleLayers = layers.filter(l => l.is_visible)
  const updatedDate = new Date(session.updated_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div ref={containerRef} className="flex flex-col h-screen bg-background">
      {/* Presentation header */}
      <header className="flex items-center justify-between px-5 h-14 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/" target="_blank" rel="noopener noreferrer" title="Visit WIN-CYC Group">
            <BrandLogo maxHeight={24} variant="dark" />
          </a>
          <div className="w-px h-6 bg-border shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-medium text-foreground truncate max-w-[320px]">
              {session.name}
            </h1>
            <p className="text-[10px] text-muted-foreground tracking-wide">
              Concept Board · Updated {updatedDate}
            </p>
          </div>
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-[var(--radius)] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </header>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto bg-secondary/30 flex items-center justify-center p-6 md:p-10">
        <div
          className="rounded-[var(--radius)] overflow-hidden shadow-sm border border-border/50"
          style={{
            maxWidth: '940px',
            width: '100%',
            aspectRatio: session.background_image_width && session.background_image_height
              ? `${session.background_image_width} / ${session.background_image_height}`
              : '4 / 3',
          }}
        >
          <ComposerCanvas
            session={session}
            layers={visibleLayers}
            selectedLayerIds={[]}
            onSelectLayer={() => {}}
            onUpdateLayer={() => {}}
            onDeleteLayer={() => {}}
            readOnly
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-5 h-10 border-t border-border bg-background shrink-0">
        <p className="text-[10px] text-muted-foreground tracking-wide">
          {visibleLayers.length} component{visibleLayers.length !== 1 ? 's' : ''} · Shared presentation
        </p>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground hover:text-foreground tracking-wide transition-colors"
        >
          WIN-CYC Group
        </a>
      </footer>
    </div>
  )
}

/* ─── Gated screen for unavailable states ─── */

function GatedScreen({ icon, heading, message }: { icon: React.ReactNode; heading: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-5 max-w-xs text-center px-6">
        <BrandLogo maxHeight={28} variant="dark" />
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mt-2">
          {icon}
        </div>
        <div className="space-y-2">
          <h1 className="text-sm font-medium text-foreground">{heading}</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
        </div>
        <a
          href="/"
          className="mt-1 text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 tracking-wide transition-colors"
        >
          Visit WIN-CYC Group
        </a>
      </div>
    </div>
  )
}
