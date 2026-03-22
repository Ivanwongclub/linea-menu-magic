export type DesignSession = {
  id: string
  team_id: string
  name: string
  background_image_url?: string
  background_image_width?: number
  background_image_height?: number
  thumbnail_url?: string
  status: 'draft' | 'shared' | 'archived'
  created_by?: string
  created_at: string
  updated_at: string
  layers?: DesignLayer[]
}

export type LayerType = 'image' | 'annotation' | 'arrow' | 'highlight' | 'legend'

export type TextStyle = {
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  color?: string
  backgroundColor?: string
  textAlign?: 'left' | 'center' | 'right'
  borderColor?: string
  highlightShape?: 'rect' | 'ellipse'
}

export type DesignLayer = {
  id: string
  session_id: string
  product_id?: string
  layer_order: number
  name: string
  image_url: string
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
  flip_x: boolean
  flip_y: boolean
  is_visible: boolean
  is_locked: boolean
  created_at: string
  layer_type: LayerType
  text_content?: string
  text_style?: TextStyle
  group_id?: string
  product?: {
    id: string
    name: string
    name_en?: string
    item_code: string
    thumbnail_url?: string
  }
}

export type DesignExport = {
  id: string
  session_id: string
  export_url: string
  export_type: 'png' | 'jpeg' | 'pdf'
  created_at: string
}
