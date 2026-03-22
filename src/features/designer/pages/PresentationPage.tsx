import { useParams, Link } from 'react-router-dom'
import { useDesignSession } from '../hooks/useDesignSession'
import ComposerCanvas from '../components/ComposerCanvas'
import BrandLogo from '@/components/viewer/BrandLogo'
import { ArrowLeft, Maximize, Minimize } from 'lucide-react'
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
      document.title = `${session.name} — WIN-CYC Studio`
    }
    return () => { document.title = 'WIN-CYC Group' }
  }, [session?.name])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-sm text-muted-foreground">Loading presentation…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <p className="text-sm text-muted-foreground">This composition is not available.</p>
        <Link to="/" className="text-xs text-primary underline underline-offset-2">
          Go to homepage
        </Link>
      </div>
    )
  }

  if (session.status !== 'shared') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <p className="text-sm text-muted-foreground">This composition has not been shared yet.</p>
        <Link to="/" className="text-xs text-primary underline underline-offset-2">
          Go to homepage
        </Link>
      </div>
    )
  }

  const visibleLayers = layers.filter(l => l.is_visible)

  return (
    <div ref={containerRef} className="flex flex-col h-screen bg-background">
      {/* Minimal toolbar */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <BrandLogo maxHeight={24} variant="dark" />
          <div className="w-px h-5 bg-border" />
          <h1 className="text-sm font-medium text-foreground truncate max-w-[280px]">
            {session.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </header>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto bg-secondary/50 flex items-center justify-center p-6">
        <div
          style={{
            maxWidth: '900px',
            width: '100%',
            aspectRatio: session.background_image_width && session.background_image_height
              ? `${session.background_image_width} / ${session.background_image_height}`
              : '4 / 3',
          }}
        >
          <ComposerCanvas
            session={session}
            layers={visibleLayers}
            selectedLayerId={null}
            onSelectLayer={() => {}}
            onUpdateLayer={() => {}}
            onDeleteLayer={() => {}}
            readOnly
          />
        </div>
      </div>

      {/* Footer attribution */}
      <footer className="flex items-center justify-between px-4 h-9 border-t border-border bg-background shrink-0">
        <p className="text-[10px] text-muted-foreground tracking-wide">
          {visibleLayers.length} component{visibleLayers.length !== 1 ? 's' : ''}
        </p>
        <p className="text-[10px] text-muted-foreground tracking-wide">
          Powered by WIN-CYC Studio
        </p>
      </footer>
    </div>
  )
}
