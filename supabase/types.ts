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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      banks: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          name: string
          nit: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name: string
          nit?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          nit?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      common_areas: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      developers: {
        Row: {
          address: string
          created_at: string | null
          description: string | null
          email: string | null
          id: number
          name: string
          nit: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: never
          name: string
          nit?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: never
          name?: string
          nit?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          delivery_date: string
          description: string
          developer_id: number | null
          id: number
          image: string
          is_favorite: boolean | null
          location: string
          name: string
          price_range: string
          status: string
          total_units: number
          type: string
          units_available: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_date: string
          description: string
          developer_id?: number | null
          id?: never
          image: string
          is_favorite?: boolean | null
          location: string
          name: string
          price_range: string
          status: string
          total_units: number
          type: string
          units_available: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_date?: string
          description?: string
          developer_id?: number | null
          id?: never
          image?: string
          is_favorite?: boolean | null
          location?: string
          name?: string
          price_range?: string
          status?: string
          total_units?: number
          type?: string
          units_available?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          additional_images: string[] | null
          address: string
          amenities: Json
          area: string
          bathrooms: number
          bedrooms: number
          builder_id: number | null
          city: string | null
          commune: string | null
          construction_bank: string | null
          construction_company: string | null
          created_at: string | null
          credit_amount: string | null
          credit_percentage: number | null
          delivery_date: string | null
          description: string
          developer_id: number | null
          housing_type: string | null
          id: number
          image: string
          initial_fee_amount: string | null
          initial_fee_percentage: number | null
          is_favorite: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          meters: string | null
          meters2: string | null
          neighborhood: string | null
          parking: number
          price: string
          project_name: string | null
          property_type: string | null
          sales_room_address: string | null
          sales_room_email: string | null
          sales_room_hours: string | null
          sales_room_phone: string | null
          seller_id: number | null
          separation_amount: string | null
          stratum: number
          study: string | null
          title: string
          tower_count: number | null
          tower_details: Json
          tower_name: string | null
          trust_company: string | null
          type: string
          typologies: Json
          updated_at: string | null
          uuid: string
          year_built: number
        }
        Insert: {
          additional_images?: string[] | null
          address: string
          amenities?: Json
          area: string
          bathrooms: number
          bedrooms: number
          builder_id?: number | null
          city?: string | null
          commune?: string | null
          construction_bank?: string | null
          construction_company?: string | null
          created_at?: string | null
          credit_amount?: string | null
          credit_percentage?: number | null
          delivery_date?: string | null
          description: string
          developer_id?: number | null
          housing_type?: string | null
          id?: never
          image: string
          initial_fee_amount?: string | null
          initial_fee_percentage?: number | null
          is_favorite?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          meters?: string | null
          meters2?: string | null
          neighborhood?: string | null
          parking: number
          price: string
          project_name?: string | null
          property_type?: string | null
          sales_room_address?: string | null
          sales_room_email?: string | null
          sales_room_hours?: string | null
          sales_room_phone?: string | null
          seller_id?: number | null
          separation_amount?: string | null
          stratum: number
          study?: string | null
          title: string
          tower_count?: number | null
          tower_details?: Json
          tower_name?: string | null
          trust_company?: string | null
          type: string
          typologies?: Json
          updated_at?: string | null
          uuid?: string
          year_built: number
        }
        Update: {
          additional_images?: string[] | null
          address?: string
          amenities?: Json
          area?: string
          bathrooms?: number
          bedrooms?: number
          builder_id?: number | null
          city?: string | null
          commune?: string | null
          construction_bank?: string | null
          construction_company?: string | null
          created_at?: string | null
          credit_amount?: string | null
          credit_percentage?: number | null
          delivery_date?: string | null
          description?: string
          developer_id?: number | null
          housing_type?: string | null
          id?: never
          image?: string
          initial_fee_amount?: string | null
          initial_fee_percentage?: number | null
          is_favorite?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          meters?: string | null
          meters2?: string | null
          neighborhood?: string | null
          parking?: number
          price?: string
          project_name?: string | null
          property_type?: string | null
          sales_room_address?: string | null
          sales_room_email?: string | null
          sales_room_hours?: string | null
          sales_room_phone?: string | null
          seller_id?: number | null
          separation_amount?: string | null
          stratum?: number
          study?: string | null
          title?: string
          tower_count?: number | null
          tower_details?: Json
          tower_name?: string | null
          trust_company?: string | null
          type?: string
          typologies?: Json
          updated_at?: string | null
          uuid?: string
          year_built?: number
        }
        Relationships: [
          {
            foreignKeyName: "properties_builder_id_fkey"
            columns: ["builder_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      real_estate_agencies: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          name: string
          nit: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name: string
          nit?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          nit?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          permissions: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      trust_companies: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          name: string
          nit: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name: string
          nit?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          nit?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string | null
          phone: string | null
          role_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          is_active?: boolean | null
          name?: string | null
          phone?: string | null
          role_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          phone?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_permission: {
        Args: { permission_name: string; user_uuid: string }
        Returns: boolean
      }
      get_user_role: { Args: { user_uuid: string }; Returns: string }
      migrate_typologies_to_tower_format: {
        Args: { old_typologies: Json; tower_count: number }
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
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
