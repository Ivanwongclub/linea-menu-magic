import React from 'react'
import { Layout, Shirt, Grid3X3, FileText, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { DesignLayer } from '../types'

export type TemplateId = 'blank' | 'mood-board' | 'garment-flat' | 'trim-grid' | 'presentation'

export interface SessionTemplate {
  id: TemplateId
  name: string
  description: string
  icon: React.ReactNode
  aspectHint: string
  layers: Omit<DesignLayer, 'id' | 'created_at' | 'session_id' | 'product'>[]
}

const TEMPLATES: SessionTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with a clean board',
    icon: <Sparkles className="w-5 h-5" />,
    aspectHint: '4:3',
    layers: [],
  },
  {
    id: 'mood-board',
    name: 'Concept Board',
    description: 'Structured mood board with title zone and component areas',
    icon: <Layout className="w-5 h-5" />,
    aspectHint: '4:3',
    layers: [
      {
        layer_order: 0,
        name: 'Board Title',
        image_url: '',
        x: 0.5,
        y: 0.08,
        scale: 1.4,
        rotation: 0,
        opacity: 1,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: 'Collection Title',
        text_style: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
      },
      {
        layer_order: 1,
        name: 'Season / Theme',
        image_url: '',
        x: 0.5,
        y: 0.16,
        scale: 1,
        rotation: 0,
        opacity: 0.7,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: 'SS26 · Theme Description',
        text_style: { fontSize: 12, fontWeight: 'normal', textAlign: 'center' },
      },
      {
        layer_order: 2,
        name: 'Notes',
        image_url: '',
        x: 0.15,
        y: 0.88,
        scale: 1,
        rotation: 0,
        opacity: 0.6,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: 'Design notes and references',
        text_style: { fontSize: 11, fontWeight: 'normal', textAlign: 'left' },
      },
    ],
  },
  {
    id: 'garment-flat',
    name: 'Garment Mockup',
    description: 'Upload a flat-lay or garment photo and place trims directly',
    icon: <Shirt className="w-5 h-5" />,
    aspectHint: '3:4',
    layers: [
      {
        layer_order: 0,
        name: 'Style Name',
        image_url: '',
        x: 0.5,
        y: 0.06,
        scale: 1.2,
        rotation: 0,
        opacity: 1,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: 'Style Name / Code',
        text_style: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
      },
      {
        layer_order: 1,
        name: 'Placement Note',
        image_url: '',
        x: 0.82,
        y: 0.5,
        scale: 1,
        rotation: 0,
        opacity: 0.65,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: '← Trim placement',
        text_style: { fontSize: 11, fontWeight: 'normal', textAlign: 'left' },
      },
    ],
  },
  {
    id: 'trim-grid',
    name: 'Component Grid',
    description: 'Grid layout for comparing multiple trims side-by-side',
    icon: <Grid3X3 className="w-5 h-5" />,
    aspectHint: '16:9',
    layers: [
      {
        layer_order: 0,
        name: 'Grid Title',
        image_url: '',
        x: 0.5,
        y: 0.08,
        scale: 1.3,
        rotation: 0,
        opacity: 1,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: 'Component Comparison',
        text_style: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
      },
      {
        layer_order: 1,
        name: 'Option A',
        image_url: '',
        x: 0.2,
        y: 0.45,
        scale: 1,
        rotation: 0,
        opacity: 0.5,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: 'Option A',
        text_style: { fontSize: 12, fontWeight: 'normal', textAlign: 'center' },
      },
      {
        layer_order: 2,
        name: 'Option B',
        image_url: '',
        x: 0.5,
        y: 0.45,
        scale: 1,
        rotation: 0,
        opacity: 0.5,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: 'Option B',
        text_style: { fontSize: 12, fontWeight: 'normal', textAlign: 'center' },
      },
      {
        layer_order: 3,
        name: 'Option C',
        image_url: '',
        x: 0.8,
        y: 0.45,
        scale: 1,
        rotation: 0,
        opacity: 0.5,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: 'Option C',
        text_style: { fontSize: 12, fontWeight: 'normal', textAlign: 'center' },
      },
      {
        layer_order: 4,
        name: 'Notes',
        image_url: '',
        x: 0.5,
        y: 0.88,
        scale: 1,
        rotation: 0,
        opacity: 0.5,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: 'Add comparison notes here',
        text_style: { fontSize: 11, fontWeight: 'normal', textAlign: 'center' },
      },
    ],
  },
  {
    id: 'presentation',
    name: 'Presentation Slide',
    description: 'Client-ready slide with title, hero area, and detail zones',
    icon: <FileText className="w-5 h-5" />,
    aspectHint: '16:9',
    layers: [
      {
        layer_order: 0,
        name: 'Slide Title',
        image_url: '',
        x: 0.5,
        y: 0.1,
        scale: 1.5,
        rotation: 0,
        opacity: 1,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: 'Presentation Title',
        text_style: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
      },
      {
        layer_order: 1,
        name: 'Subtitle',
        image_url: '',
        x: 0.5,
        y: 0.18,
        scale: 1,
        rotation: 0,
        opacity: 0.6,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: 'Brand Name · Season · Date',
        text_style: { fontSize: 12, fontWeight: 'normal', textAlign: 'center' },
      },
      {
        layer_order: 2,
        name: 'Detail Left',
        image_url: '',
        x: 0.18,
        y: 0.85,
        scale: 1,
        rotation: 0,
        opacity: 0.5,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: 'Detail / Spec',
        text_style: { fontSize: 10, fontWeight: 'normal', textAlign: 'left' },
      },
      {
        layer_order: 3,
        name: 'Detail Right',
        image_url: '',
        x: 0.82,
        y: 0.85,
        scale: 1,
        rotation: 0,
        opacity: 0.5,
        flip_x: false,
        flip_y: false,
        is_visible: true,
        is_locked: false,
        layer_type: 'annotation',
        text_content: 'Detail / Spec',
        text_style: { fontSize: 10, fontWeight: 'normal', textAlign: 'right' },
      },
    ],
  },
]

interface TemplatePickerDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (template: SessionTemplate) => void
}

export default function TemplatePickerDialog({ open, onClose, onSelect }: TemplatePickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="text-base">New Composition</DialogTitle>
          <DialogDescription className="text-xs text-[hsl(var(--muted-foreground))]">
            Choose a starting structure for your concept board
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          {TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              className="group flex flex-col items-center gap-2.5 p-4 rounded-[calc(var(--radius)*1.5)] border border-[hsl(var(--border))] hover:border-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--secondary))] group-hover:bg-[hsl(var(--background))] flex items-center justify-center text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
                {tpl.icon}
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-[hsl(var(--foreground))]">{tpl.name}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 leading-snug">{tpl.description}</p>
              </div>
              <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]/60 uppercase tracking-wider">
                {tpl.aspectHint}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
