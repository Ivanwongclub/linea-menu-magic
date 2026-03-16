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
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          name_en: string | null
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_en?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_en?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      customization_requests: {
        Row: {
          created_at: string
          estimated_delivery: string | null
          id: string
          metadata: Json | null
          notes: string | null
          product_id: string
          quantity: number
          status: Database["public"]["Enums"]["customization_status"]
          target_date: string | null
          target_price: number | null
          team_id: string | null
          team_name: string | null
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_delivery?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          product_id: string
          quantity?: number
          status?: Database["public"]["Enums"]["customization_status"]
          target_date?: string | null
          target_price?: number | null
          team_id?: string | null
          team_name?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_delivery?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          product_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["customization_status"]
          target_date?: string | null
          target_price?: number | null
          team_id?: string | null
          team_name?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
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
      industries: {
        Row: {
          created_at: string
          id: string
          name: string
          name_en: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_en?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_en?: string | null
          slug?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string
          id: string
          name: string
          name_en: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_en?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_en?: string | null
          slug?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          product_id: string
        }
        Insert: {
          category_id: string
          product_id: string
        }
        Update: {
          category_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_certifications: {
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
            foreignKeyName: "product_certifications_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_certifications_product_id_fkey"
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
          image_url: string
          is_thumbnail: boolean
          product_id: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_thumbnail?: boolean
          product_id: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_thumbnail?: boolean
          product_id?: string
          sort_order?: number
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
            foreignKeyName: "product_industries_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_industries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_materials: {
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
            foreignKeyName: "product_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
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
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          applications: string[] | null
          available_colors: string[] | null
          capacity: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          is_public: boolean
          item_code: string | null
          lead_time: string | null
          model_url: string | null
          moq: number | null
          name: string
          name_en: string | null
          origin: string | null
          price_breaks: Json | null
          sample_time: string | null
          slug: string
          spec_color: string | null
          spec_finish: string | null
          spec_material: string | null
          spec_size: string | null
          spec_tensile_strength: string | null
          spec_thickness: string | null
          spec_weight: string | null
          status: Database["public"]["Enums"]["product_status"]
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          applications?: string[] | null
          available_colors?: string[] | null
          capacity?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_public?: boolean
          item_code?: string | null
          lead_time?: string | null
          model_url?: string | null
          moq?: number | null
          name: string
          name_en?: string | null
          origin?: string | null
          price_breaks?: Json | null
          sample_time?: string | null
          slug: string
          spec_color?: string | null
          spec_finish?: string | null
          spec_material?: string | null
          spec_size?: string | null
          spec_tensile_strength?: string | null
          spec_thickness?: string | null
          spec_weight?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          applications?: string[] | null
          available_colors?: string[] | null
          capacity?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_public?: boolean
          item_code?: string | null
          lead_time?: string | null
          model_url?: string | null
          moq?: number | null
          name?: string
          name_en?: string | null
          origin?: string | null
          price_breaks?: Json | null
          sample_time?: string | null
          slug?: string
          spec_color?: string | null
          spec_finish?: string | null
          spec_material?: string | null
          spec_size?: string | null
          spec_tensile_strength?: string | null
          spec_thickness?: string | null
          spec_weight?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      user_library_items: {
        Row: {
          created_at: string
          custom_brand: string | null
          custom_specs: Json | null
          id: string
          is_favorite: boolean
          notes: string | null
          product_id: string
          team_id: string | null
          team_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_brand?: string | null
          custom_specs?: Json | null
          id?: string
          is_favorite?: boolean
          notes?: string | null
          product_id: string
          team_id?: string | null
          team_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_brand?: string | null
          custom_specs?: Json | null
          id?: string
          is_favorite?: boolean
          notes?: string | null
          product_id?: string
          team_id?: string | null
          team_name?: string | null
          updated_at?: string
          user_id?: string
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
      customization_status:
        | "submitted"
        | "model_uploaded"
        | "design_confirmed"
        | "ready_for_printing"
        | "printing"
        | "shipped"
        | "sample_review"
        | "production"
        | "closed"
      product_status: "draft" | "active" | "archived"
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
    Enums: {
      customization_status: [
        "submitted",
        "model_uploaded",
        "design_confirmed",
        "ready_for_printing",
        "printing",
        "shipped",
        "sample_review",
        "production",
        "closed",
      ],
      product_status: ["draft", "active", "archived"],
    },
  },
} as const
