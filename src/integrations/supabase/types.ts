export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      customization_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string | null
          request_code: string | null
          requirements: Json | null
          status: string
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          request_code?: string | null
          requirements?: Json | null
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          request_code?: string | null
          requirements?: Json | null
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customization_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      design_exports: {
        Row: {
          created_at: string
          export_type: string
          export_url: string | null
          id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          export_type?: string
          export_url?: string | null
          id?: string
          session_id: string
        }
        Update: {
          created_at?: string
          export_type?: string
          export_url?: string | null
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_exports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "design_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      design_layers: {
        Row: {
          created_at: string
          flip_x: boolean
          flip_y: boolean
          group_id: string | null
          id: string
          image_url: string | null
          is_locked: boolean
          is_visible: boolean
          layer_order: number
          layer_type: string
          name: string | null
          opacity: number
          product_id: string | null
          rotation: number
          scale: number
          session_id: string
          text_content: string | null
          text_style: Json | null
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          flip_x?: boolean
          flip_y?: boolean
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_locked?: boolean
          is_visible?: boolean
          layer_order: number
          layer_type?: string
          name?: string | null
          opacity?: number
          product_id?: string | null
          rotation?: number
          scale?: number
          session_id: string
          text_content?: string | null
          text_style?: Json | null
          x?: number
          y?: number
        }
        Update: {
          created_at?: string
          flip_x?: boolean
          flip_y?: boolean
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_locked?: boolean
          is_visible?: boolean
          layer_order?: number
          layer_type?: string
          name?: string | null
          opacity?: number
          product_id?: string | null
          rotation?: number
          scale?: number
          session_id?: string
          text_content?: string | null
          text_style?: Json | null
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_layers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_layers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "design_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      design_sessions: {
        Row: {
          background_image_height: number | null
          background_image_url: string | null
          background_image_width: number | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          status: string
          team_id: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          background_image_height?: number | null
          background_image_url?: string | null
          background_image_width?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          status?: string
          team_id: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          background_image_height?: number | null
          background_image_url?: string | null
          background_image_width?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          status?: string
          team_id?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      flipbook_brochures: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      flipbook_hotlinks: {
        Row: {
          height: number | null
          id: string
          label: string | null
          page_id: string
          url: string | null
          width: number | null
          x: number | null
          y: number | null
        }
        Insert: {
          height?: number | null
          id?: string
          label?: string | null
          page_id: string
          url?: string | null
          width?: number | null
          x?: number | null
          y?: number | null
        }
        Update: {
          height?: number | null
          id?: string
          label?: string | null
          page_id?: string
          url?: string | null
          width?: number | null
          x?: number | null
          y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "flipbook_hotlinks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "flipbook_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      flipbook_pages: {
        Row: {
          brochure_id: string
          id: string
          image_url: string
          page_number: number
        }
        Insert: {
          brochure_id: string
          id?: string
          image_url: string
          page_number: number
        }
        Update: {
          brochure_id?: string
          id?: string
          image_url?: string
          page_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "flipbook_pages_brochure_id_fkey"
            columns: ["brochure_id"]
            isOneToOne: false
            referencedRelation: "flipbook_brochures"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          icon_url: string | null
          id: string
          name: string
          slug: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon_url?: string | null
          id?: string
          name: string
          slug?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon_url?: string | null
          id?: string
          name?: string
          slug?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      product_category_map: {
        Row: {
          category_id: string
          is_primary: boolean
          product_id: string
        }
        Insert: {
          category_id: string
          is_primary?: boolean
          product_id: string
        }
        Update: {
          category_id?: string
          is_primary?: boolean
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_category_map_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_category_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_certification_map: {
        Row: {
          certification_id: string
          product_id: string
        }
        Insert: {
          certification_id: string
          product_id: string
        }
        Update: {
          certification_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_certification_map_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "product_certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_certification_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_certifications: {
        Row: {
          abbreviation: string | null
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          abbreviation?: string | null
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          abbreviation?: string | null
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_industries: {
        Row: {
          id: string
          name: string
          slug: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      product_industry_map: {
        Row: {
          industry_id: string
          product_id: string
        }
        Insert: {
          industry_id: string
          product_id: string
        }
        Update: {
          industry_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_industry_map_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "product_industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_industry_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_material_map: {
        Row: {
          material_id: string
          product_id: string
        }
        Insert: {
          material_id: string
          product_id: string
        }
        Update: {
          material_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_material_map_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "product_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_material_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_materials: {
        Row: {
          id: string
          is_sustainable: boolean
          name: string
          slug: string | null
        }
        Insert: {
          id?: string
          is_sustainable?: boolean
          name: string
          slug?: string | null
        }
        Update: {
          id?: string
          is_sustainable?: boolean
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      product_tag_map: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tag_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tag_map_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "product_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          color: string | null
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          color?: string | null
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          color?: string | null
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          description_en: string | null
          id: string
          is_customizable: boolean
          is_public: boolean
          item_code: string | null
          model_url: string | null
          name: string
          name_en: string | null
          production: Json | null
          slug: string
          sort_order: number
          specifications: Json | null
          status: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          is_customizable?: boolean
          is_public?: boolean
          item_code?: string | null
          model_url?: string | null
          name: string
          name_en?: string | null
          production?: Json | null
          slug: string
          sort_order?: number
          specifications?: Json | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          is_customizable?: boolean
          is_public?: boolean
          item_code?: string | null
          model_url?: string | null
          name?: string
          name_en?: string | null
          production?: Json | null
          slug?: string
          sort_order?: number
          specifications?: Json | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_library_items: {
        Row: {
          added_at: string
          added_by: string | null
          custom_brand: string | null
          custom_description: string | null
          custom_name: string | null
          custom_specs: Json | null
          downloadable_files: Json | null
          id: string
          is_admin_default: boolean | null
          is_favourite: boolean
          notes: string | null
          product_id: string
          team_id: string
          team_name: string | null
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          custom_brand?: string | null
          custom_description?: string | null
          custom_name?: string | null
          custom_specs?: Json | null
          downloadable_files?: Json | null
          id?: string
          is_admin_default?: boolean | null
          is_favourite?: boolean
          notes?: string | null
          product_id: string
          team_id: string
          team_name?: string | null
        }
        Update: {
          added_at?: string
          added_by?: string | null
          custom_brand?: string | null
          custom_description?: string | null
          custom_name?: string | null
          custom_specs?: Json | null
          downloadable_files?: Json | null
          id?: string
          is_admin_default?: boolean | null
          is_favourite?: boolean
          notes?: string | null
          product_id?: string
          team_id?: string
          team_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_library_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
