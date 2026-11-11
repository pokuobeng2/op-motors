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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
          summary: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          summary: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          summary?: string
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          contact_number: string
          created_at: string
          created_by: string | null
          customer_name: string
          enquiry_date: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["enquiry_status"]
          updated_at: string
          vehicle_id: string | null
          vehicle_label: string | null
        }
        Insert: {
          contact_number: string
          created_at?: string
          created_by?: string | null
          customer_name: string
          enquiry_date?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
          vehicle_id?: string | null
          vehicle_label?: string | null
        }
        Update: {
          contact_number?: string
          created_at?: string
          created_by?: string | null
          customer_name?: string
          enquiry_date?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
          vehicle_id?: string | null
          vehicle_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about_text: string
          address: string
          dealership_name: string
          email: string
          id: number
          opening_hours: string
          phone: string
          tagline: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          about_text?: string
          address?: string
          dealership_name?: string
          email?: string
          id?: number
          opening_hours?: string
          phone?: string
          tagline?: string
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          about_text?: string
          address?: string
          dealership_name?: string
          email?: string
          id?: number
          opening_hours?: string
          phone?: string
          tagline?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      staff_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          position: number
          storage_path: string | null
          url: string
          vehicle_id: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          position?: number
          storage_path?: string | null
          url: string
          vehicle_id: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          position?: number
          storage_path?: string | null
          url?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          body_type: string
          condition: string
          country_of_import: string | null
          created_at: string
          created_by: string | null
          description: string
          doors: number | null
          drivetrain: string | null
          engine_capacity: string
          exterior_colour: string
          features: string[]
          fuel_type: string
          id: string
          interior_colour: string | null
          is_featured: boolean
          make: string
          mileage: number
          model: string
          price: number
          published_at: string | null
          reference: string
          slug: string
          status: Database["public"]["Enums"]["vehicle_status"]
          transmission: string
          trim: string | null
          updated_at: string
          updated_by: string | null
          year: number
        }
        Insert: {
          body_type: string
          condition: string
          country_of_import?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          doors?: number | null
          drivetrain?: string | null
          engine_capacity: string
          exterior_colour: string
          features?: string[]
          fuel_type: string
          id?: string
          interior_colour?: string | null
          is_featured?: boolean
          make: string
          mileage: number
          model: string
          price: number
          published_at?: string | null
          reference?: string
          slug?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          transmission: string
          trim?: string | null
          updated_at?: string
          updated_by?: string | null
          year: number
        }
        Update: {
          body_type?: string
          condition?: string
          country_of_import?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          doors?: number | null
          drivetrain?: string | null
          engine_capacity?: string
          exterior_colour?: string
          features?: string[]
          fuel_type?: string
          id?: string
          interior_colour?: string | null
          is_featured?: boolean
          make?: string
          mileage?: number
          model?: string
          price?: number
          published_at?: string | null
          reference?: string
          slug?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          transmission?: string
          trim?: string | null
          updated_at?: string
          updated_by?: string | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: {
        Args: {
          _perm: Database["public"]["Enums"]["app_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_member: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      log_activity: {
        Args: {
          _action: string
          _details?: Json
          _entity_id: string
          _entity_type: string
          _summary: string
        }
        Returns: undefined
      }
      owner_exists: { Args: never; Returns: boolean }
    }
    Enums: {
      app_permission:
        | "add_vehicles"
        | "edit_vehicles"
        | "manage_photos"
        | "update_prices"
        | "mark_sold"
        | "manage_featured"
        | "manage_enquiries"
      app_role: "super_admin" | "staff"
      enquiry_status:
        | "new"
        | "contacted"
        | "follow_up"
        | "inspection_booked"
        | "won"
        | "lost"
      vehicle_status:
        | "draft"
        | "available"
        | "reserved"
        | "sold"
        | "withdrawn"
        | "archived"
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
    Enums: {
      app_permission: [
        "add_vehicles",
        "edit_vehicles",
        "manage_photos",
        "update_prices",
        "mark_sold",
        "manage_featured",
        "manage_enquiries",
      ],
      app_role: ["super_admin", "staff"],
      enquiry_status: [
        "new",
        "contacted",
        "follow_up",
        "inspection_booked",
        "won",
        "lost",
      ],
      vehicle_status: [
        "draft",
        "available",
        "reserved",
        "sold",
        "withdrawn",
        "archived",
      ],
    },
  },
} as const
