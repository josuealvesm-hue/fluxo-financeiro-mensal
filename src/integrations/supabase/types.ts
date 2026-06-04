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
      accounts: {
        Row: {
          active: boolean
          bank: string | null
          created_at: string
          id: string
          name: string
          type: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          bank?: string | null
          created_at?: string
          id?: string
          name: string
          type?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          bank?: string | null
          created_at?: string
          id?: string
          name?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budget_templates: {
        Row: {
          account_id: string | null
          active: boolean
          active_from_month: number | null
          active_from_year: number | null
          active_to_month: number | null
          active_to_year: number | null
          amount_type: Database["public"]["Enums"]["amount_type"]
          card_id: string | null
          category: string | null
          created_at: string
          default_amount: number
          expected_day: number | null
          group: string
          id: string
          name: string
          notes: string | null
          payment_method: string | null
          percentage: number | null
          recurrence: Database["public"]["Enums"]["recurrence_type"]
          recurrence_month: number | null
          subcategory: string | null
          type: Database["public"]["Enums"]["budget_type"]
          user_id: string
        }
        Insert: {
          account_id?: string | null
          active?: boolean
          active_from_month?: number | null
          active_from_year?: number | null
          active_to_month?: number | null
          active_to_year?: number | null
          amount_type?: Database["public"]["Enums"]["amount_type"]
          card_id?: string | null
          category?: string | null
          created_at?: string
          default_amount?: number
          expected_day?: number | null
          group: string
          id?: string
          name: string
          notes?: string | null
          payment_method?: string | null
          percentage?: number | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"]
          recurrence_month?: number | null
          subcategory?: string | null
          type: Database["public"]["Enums"]["budget_type"]
          user_id: string
        }
        Update: {
          account_id?: string | null
          active?: boolean
          active_from_month?: number | null
          active_from_year?: number | null
          active_to_month?: number | null
          active_to_year?: number | null
          amount_type?: Database["public"]["Enums"]["amount_type"]
          card_id?: string | null
          category?: string | null
          created_at?: string
          default_amount?: number
          expected_day?: number | null
          group?: string
          id?: string
          name?: string
          notes?: string | null
          payment_method?: string | null
          percentage?: number | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"]
          recurrence_month?: number | null
          subcategory?: string | null
          type?: Database["public"]["Enums"]["budget_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_templates_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_templates_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_invoices: {
        Row: {
          actual_amount: number | null
          card_id: string
          created_at: string
          due_date: string | null
          id: string
          month: number
          planned_amount: number
          status: Database["public"]["Enums"]["invoice_status"]
          user_id: string
          year: number
        }
        Insert: {
          actual_amount?: number | null
          card_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          month: number
          planned_amount?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          user_id: string
          year: number
        }
        Update: {
          actual_amount?: number | null
          card_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          month?: number
          planned_amount?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_invoices_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          active: boolean
          bank: string | null
          closing_day: number | null
          created_at: string
          due_day: number | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean
          bank?: string | null
          closing_day?: number | null
          created_at?: string
          due_day?: number | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          active?: boolean
          bank?: string | null
          closing_day?: number | null
          created_at?: string
          due_day?: number | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      extra_transactions: {
        Row: {
          account_id: string | null
          amount: number
          card_id: string | null
          category: string | null
          created_at: string
          date: string
          description: string
          group: string | null
          id: string
          month: number
          notes: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["item_status"]
          subcategory: string | null
          type: Database["public"]["Enums"]["budget_type"]
          user_id: string
          year: number
        }
        Insert: {
          account_id?: string | null
          amount: number
          card_id?: string | null
          category?: string | null
          created_at?: string
          date: string
          description: string
          group?: string | null
          id?: string
          month: number
          notes?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          subcategory?: string | null
          type: Database["public"]["Enums"]["budget_type"]
          user_id: string
          year: number
        }
        Update: {
          account_id?: string | null
          amount?: number
          card_id?: string | null
          category?: string | null
          created_at?: string
          date?: string
          description?: string
          group?: string | null
          id?: string
          month?: number
          notes?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          subcategory?: string | null
          type?: Database["public"]["Enums"]["budget_type"]
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "extra_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      funds: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          percentage: number
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          percentage?: number
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          percentage?: number
          user_id?: string
        }
        Relationships: []
      }
      monthly_budget_items: {
        Row: {
          account_id: string | null
          actual_amount: number | null
          card_id: string | null
          category: string | null
          created_at: string
          expected_date: string | null
          group: string
          id: string
          month: number
          name: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          planned_amount: number
          status: Database["public"]["Enums"]["item_status"]
          subcategory: string | null
          template_id: string | null
          type: Database["public"]["Enums"]["budget_type"]
          user_id: string
          year: number
        }
        Insert: {
          account_id?: string | null
          actual_amount?: number | null
          card_id?: string | null
          category?: string | null
          created_at?: string
          expected_date?: string | null
          group: string
          id?: string
          month: number
          name: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          planned_amount?: number
          status?: Database["public"]["Enums"]["item_status"]
          subcategory?: string | null
          template_id?: string | null
          type: Database["public"]["Enums"]["budget_type"]
          user_id: string
          year: number
        }
        Update: {
          account_id?: string | null
          actual_amount?: number | null
          card_id?: string | null
          category?: string | null
          created_at?: string
          expected_date?: string | null
          group?: string
          id?: string
          month?: number
          name?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          planned_amount?: number
          status?: Database["public"]["Enums"]["item_status"]
          subcategory?: string | null
          template_id?: string | null
          type?: Database["public"]["Enums"]["budget_type"]
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_budget_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_budget_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_budget_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "budget_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      swile_months: {
        Row: {
          created_at: string
          food_planned: number
          id: string
          mobility_planned: number
          month: number
          notes: string | null
          status: string
          used_amount: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          food_planned?: number
          id?: string
          mobility_planned?: number
          month: number
          notes?: string | null
          status?: string
          used_amount?: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          food_planned?: number
          id?: string
          mobility_planned?: number
          month?: number
          notes?: string | null
          status?: string
          used_amount?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      amount_type: "fixed" | "variable" | "percentage"
      budget_type: "entrada" | "saida" | "investimento" | "credito"
      invoice_status: "prevista" | "aberta" | "fechada" | "paga"
      item_status:
        | "previsto"
        | "pago"
        | "recebido"
        | "ajustado"
        | "cancelado"
        | "adiado"
      recurrence_type: "mensal" | "anual" | "unica" | "personalizada"
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
      amount_type: ["fixed", "variable", "percentage"],
      budget_type: ["entrada", "saida", "investimento", "credito"],
      invoice_status: ["prevista", "aberta", "fechada", "paga"],
      item_status: [
        "previsto",
        "pago",
        "recebido",
        "ajustado",
        "cancelado",
        "adiado",
      ],
      recurrence_type: ["mensal", "anual", "unica", "personalizada"],
    },
  },
} as const
