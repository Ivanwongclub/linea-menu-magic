export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      brand_memberships: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["brand_role"]
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["brand_role"]
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["brand_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_memberships_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      catalogue_editors: {
        Row: {
          granted_at: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_standards: {
        Row: {
          code: string
          id: string
          is_active: boolean
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Relationships: []
      }
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
      editor_sessions: {
        Row: {
          created_at: string
          id: string
          model_url: string
          product_name: string
          product_slug: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          model_url: string
          product_name: string
          product_slug?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          model_url?: string
          product_name?: string
          product_slug?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      finish_base_families: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      finish_coatings: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      finish_effects: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      finish_patterns: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      finish_processes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      finish_surfaces: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      finish_tints: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      finish_tones: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      finishes: {
        Row: {
          anisotropy: number
          base_family_id: string | null
          chart_page: string | null
          coating_id: string | null
          created_at: string
          cyc_code: string | null
          effect_id: string | null
          factory_name_en: string
          factory_name_zh_hans: string | null
          factory_name_zh_hant: string | null
          hex_approx: string | null
          id: string
          is_public: boolean
          is_standard: boolean
          marketing_name: string
          marketing_name_zh_hans: string | null
          marketing_name_zh_hant: string | null
          metalness: number
          notes: string | null
          pattern_id: string | null
          process_id: string | null
          roughness: number
          sort_order: number
          status: string
          surface_id: string | null
          swatch_url: string | null
          tint_id: string | null
          tone_id: string | null
          updated_at: string
        }
        Insert: {
          anisotropy: number
          base_family_id?: string | null
          chart_page?: string | null
          coating_id?: string | null
          created_at?: string
          cyc_code?: string | null
          effect_id?: string | null
          factory_name_en: string
          factory_name_zh_hans?: string | null
          factory_name_zh_hant?: string | null
          hex_approx?: string | null
          id?: string
          is_public?: boolean
          is_standard?: boolean
          marketing_name: string
          marketing_name_zh_hans?: string | null
          marketing_name_zh_hant?: string | null
          metalness: number
          notes?: string | null
          pattern_id?: string | null
          process_id?: string | null
          roughness: number
          sort_order?: number
          status?: string
          surface_id?: string | null
          swatch_url?: string | null
          tint_id?: string | null
          tone_id?: string | null
          updated_at?: string
        }
        Update: {
          anisotropy?: number
          base_family_id?: string | null
          chart_page?: string | null
          coating_id?: string | null
          created_at?: string
          cyc_code?: string | null
          effect_id?: string | null
          factory_name_en?: string
          factory_name_zh_hans?: string | null
          factory_name_zh_hant?: string | null
          hex_approx?: string | null
          id?: string
          is_public?: boolean
          is_standard?: boolean
          marketing_name?: string
          marketing_name_zh_hans?: string | null
          marketing_name_zh_hant?: string | null
          metalness?: number
          notes?: string | null
          pattern_id?: string | null
          process_id?: string | null
          roughness?: number
          sort_order?: number
          status?: string
          surface_id?: string | null
          swatch_url?: string | null
          tint_id?: string | null
          tone_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finishes_base_family_id_fkey"
            columns: ["base_family_id"]
            isOneToOne: false
            referencedRelation: "finish_base_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finishes_coating_id_fkey"
            columns: ["coating_id"]
            isOneToOne: false
            referencedRelation: "finish_coatings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finishes_effect_id_fkey"
            columns: ["effect_id"]
            isOneToOne: false
            referencedRelation: "finish_effects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finishes_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "finish_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finishes_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "finish_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finishes_surface_id_fkey"
            columns: ["surface_id"]
            isOneToOne: false
            referencedRelation: "finish_surfaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finishes_tint_id_fkey"
            columns: ["tint_id"]
            isOneToOne: false
            referencedRelation: "finish_tints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finishes_tone_id_fkey"
            columns: ["tone_id"]
            isOneToOne: false
            referencedRelation: "finish_tones"
            referencedColumns: ["id"]
          },
        ]
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
      product_attachments: {
        Row: {
          code: string
          id: string
          is_active: boolean
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          family_id: string | null
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          slug: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          family_id?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          slug?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          family_id?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          slug?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "product_families"
            referencedColumns: ["id"]
          },
        ]
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
      product_colours: {
        Row: {
          hex: string | null
          id: string
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          product_id: string
          sort_order: number
        }
        Insert: {
          hex?: string | null
          id?: string
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          product_id: string
          sort_order?: number
        }
        Update: {
          hex?: string | null
          id?: string
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_colours_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_compliance_map: {
        Row: {
          product_id: string
          standard_id: string
        }
        Insert: {
          product_id: string
          standard_id: string
        }
        Update: {
          product_id?: string
          standard_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_compliance_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_compliance_map_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "compliance_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      product_families: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          segment: string
          slug: string
          sort_order: number
          tagline: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          segment?: string
          slug: string
          sort_order?: number
          tagline?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          segment?: string
          slug?: string
          sort_order?: number
          tagline?: string | null
        }
        Relationships: []
      }
      product_finishes: {
        Row: {
          finish_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          finish_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          finish_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_finishes_finish_id_fkey"
            columns: ["finish_id"]
            isOneToOne: false
            referencedRelation: "finishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_finishes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
          is_active: boolean
          is_metal: boolean
          is_sustainable: boolean
          name: string
          name_zh_hans: string | null
          name_zh_hant: string | null
          slug: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean
          is_metal?: boolean
          is_sustainable?: boolean
          name: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          slug?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean
          is_metal?: boolean
          is_sustainable?: boolean
          name?: string
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      product_size_variants: {
        Row: {
          id: string
          is_default: boolean
          product_id: string
          size_label: string | null
          size_ligne: number | null
          size_primary_mm: number
          size_secondary_mm: number | null
          sort_order: number
          thickness_mm: number | null
          weight_g: number | null
        }
        Insert: {
          id?: string
          is_default?: boolean
          product_id: string
          size_label?: string | null
          size_ligne?: number | null
          size_primary_mm: number
          size_secondary_mm?: number | null
          sort_order?: number
          thickness_mm?: number | null
          weight_g?: number | null
        }
        Update: {
          id?: string
          is_default?: boolean
          product_id?: string
          size_label?: string | null
          size_ligne?: number | null
          size_primary_mm?: number
          size_secondary_mm?: number | null
          sort_order?: number
          thickness_mm?: number | null
          weight_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_size_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
          attachment_id: string | null
          brand_id: string | null
          created_at: string
          default_finish_id: string | null
          description: string | null
          description_en: string | null
          description_zh_hans: string | null
          description_zh_hant: string | null
          face_style: string | null
          hole_count: number | null
          id: string
          is_customizable: boolean
          is_public: boolean
          item_code: string | null
          lead_time_max_days: number | null
          lead_time_min_days: number | null
          logo_customisable: boolean
          material_id: string | null
          model_url: string | null
          moq_qty: number | null
          moq_unit: string | null
          name: string
          name_en: string | null
          name_zh_hans: string | null
          name_zh_hant: string | null
          nickel_release_compliant: boolean | null
          origin: string | null
          production: Json | null
          sample_time_days: number | null
          slug: string
          sort_order: number
          specifications: Json | null
          status: string
          tensile_strength: string | null
          thumbnail_url: string | null
          updated_at: string
          wash_resistance: string | null
        }
        Insert: {
          attachment_id?: string | null
          brand_id?: string | null
          created_at?: string
          default_finish_id?: string | null
          description?: string | null
          description_en?: string | null
          description_zh_hans?: string | null
          description_zh_hant?: string | null
          face_style?: string | null
          hole_count?: number | null
          id?: string
          is_customizable?: boolean
          is_public?: boolean
          item_code?: string | null
          lead_time_max_days?: number | null
          lead_time_min_days?: number | null
          logo_customisable?: boolean
          material_id?: string | null
          model_url?: string | null
          moq_qty?: number | null
          moq_unit?: string | null
          name: string
          name_en?: string | null
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          nickel_release_compliant?: boolean | null
          origin?: string | null
          production?: Json | null
          sample_time_days?: number | null
          slug: string
          sort_order?: number
          specifications?: Json | null
          status?: string
          tensile_strength?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          wash_resistance?: string | null
        }
        Update: {
          attachment_id?: string | null
          brand_id?: string | null
          created_at?: string
          default_finish_id?: string | null
          description?: string | null
          description_en?: string | null
          description_zh_hans?: string | null
          description_zh_hant?: string | null
          face_style?: string | null
          hole_count?: number | null
          id?: string
          is_customizable?: boolean
          is_public?: boolean
          item_code?: string | null
          lead_time_max_days?: number | null
          lead_time_min_days?: number | null
          logo_customisable?: boolean
          material_id?: string | null
          model_url?: string | null
          moq_qty?: number | null
          moq_unit?: string | null
          name?: string
          name_en?: string | null
          name_zh_hans?: string | null
          name_zh_hant?: string | null
          nickel_release_compliant?: boolean | null
          origin?: string | null
          production?: Json | null
          sample_time_days?: number | null
          slug?: string
          sort_order?: number
          specifications?: Json | null
          status?: string
          tensile_strength?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          wash_resistance?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "product_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_default_finish_id_fkey"
            columns: ["default_finish_id"]
            isOneToOne: false
            referencedRelation: "finishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "product_materials"
            referencedColumns: ["id"]
          },
        ]
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
      finish_material_params: {
        Args: {
          p_base_family: string
          p_coating: string
          p_effect: string
          p_pattern: string
          p_process: string
          p_surface: string
          p_tint: string
          p_tone: string
        }
        Returns: Record<string, unknown>
      }
      user_has_brand: {
        Args: { _brand_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_brand_text: {
        Args: { _brand_text: string; _user_id: string }
        Returns: boolean
      }
      user_is_brand_manager_or_owner: {
        Args: { _user_id: string }
        Returns: boolean
      }
      user_is_catalogue_editor: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      brand_role: "member" | "manager" | "owner"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      brand_role: ["member", "manager", "owner"],
    },
  },
} as const

