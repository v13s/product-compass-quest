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
      activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      dependencies: {
        Row: {
          created_at: string
          created_by: string | null
          dep_type: string
          from_id: string
          from_type: string
          id: string
          to_id: string
          to_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dep_type?: string
          from_id: string
          from_type: string
          id?: string
          to_id: string
          to_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dep_type?: string
          from_id?: string
          from_type?: string
          id?: string
          to_id?: string
          to_type?: string
        }
        Relationships: []
      }
      epics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          initiative_id: string | null
          name: string
          owner_id: string | null
          priority: Database["public"]["Enums"]["priority"]
          product_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["work_status"]
          target_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          initiative_id?: string | null
          name: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          product_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_status"]
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          initiative_id?: string | null
          name?: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          product_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_status"]
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epics_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_products: {
        Row: {
          initiative_id: string
          product_id: string
        }
        Insert: {
          initiative_id: string
          product_id: string
        }
        Update: {
          initiative_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiative_products_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      initiative_types: {
        Row: {
          built_in: boolean
          color: string | null
          created_at: string
          field_schema: Json
          id: string
          key: string
          label: string
        }
        Insert: {
          built_in?: boolean
          color?: string | null
          created_at?: string
          field_schema?: Json
          id?: string
          key: string
          label: string
        }
        Update: {
          built_in?: boolean
          color?: string | null
          created_at?: string
          field_schema?: Json
          id?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      initiatives: {
        Row: {
          created_at: string
          custom_fields: Json
          description: string | null
          id: string
          name: string
          owner_id: string | null
          portfolio_id: string | null
          priority: Database["public"]["Enums"]["priority"]
          start_date: string | null
          status: Database["public"]["Enums"]["work_status"]
          target_date: string | null
          type_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_fields?: Json
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          portfolio_id?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_status"]
          target_date?: string | null
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_fields?: Json
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          portfolio_id?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_status"]
          target_date?: string | null
          type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiatives_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "initiative_types"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string | null
          portfolio_id: string | null
          priority: Database["public"]["Enums"]["priority"]
          start_date: string | null
          status: Database["public"]["Enums"]["work_status"]
          target_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          portfolio_id?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_status"]
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          portfolio_id?: string | null
          priority?: Database["public"]["Enums"]["priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_status"]
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          team: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          team?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          team?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      release_epics: {
        Row: {
          epic_id: string
          release_id: string
        }
        Insert: {
          epic_id: string
          release_id: string
        }
        Update: {
          epic_id?: string
          release_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_epics_epic_id_fkey"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "epics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_epics_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          product_id: string | null
          released_at: string | null
          status: Database["public"]["Enums"]["release_status"]
          target_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          product_id?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["release_status"]
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          product_id?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["release_status"]
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "releases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          assignee_id: string | null
          created_at: string
          description: string | null
          epic_id: string | null
          id: string
          name: string
          priority: Database["public"]["Enums"]["priority"]
          release_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["work_status"]
          target_date: string | null
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          epic_id?: string | null
          id?: string
          name: string
          priority?: Database["public"]["Enums"]["priority"]
          release_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_status"]
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          epic_id?: string | null
          id?: string
          name?: string
          priority?: Database["public"]["Enums"]["priority"]
          release_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_status"]
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_epic_id_fkey"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "epics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          priority: Database["public"]["Enums"]["priority"]
          start_date: string | null
          status: Database["public"]["Enums"]["work_status"]
          story_id: string | null
          target_date: string | null
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          priority?: Database["public"]["Enums"]["priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_status"]
          story_id?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          priority?: Database["public"]["Enums"]["priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_status"]
          story_id?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_pm: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "leader" | "pm" | "member"
      priority: "p0" | "p1" | "p2" | "p3"
      release_status: "planned" | "in_development" | "released" | "deprecated"
      work_status:
        | "draft"
        | "planned"
        | "in_progress"
        | "in_review"
        | "done"
        | "released"
        | "cancelled"
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
      app_role: ["admin", "leader", "pm", "member"],
      priority: ["p0", "p1", "p2", "p3"],
      release_status: ["planned", "in_development", "released", "deprecated"],
      work_status: [
        "draft",
        "planned",
        "in_progress",
        "in_review",
        "done",
        "released",
        "cancelled",
      ],
    },
  },
} as const
