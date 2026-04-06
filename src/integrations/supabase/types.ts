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
      certificados: {
        Row: {
          cantidad_dispuesta: number
          categoria_residuo: string
          codigo_verificacion: string
          created_at: string
          destino_final: string
          fecha_recoleccion: string
          generadora_ciudad: string
          generadora_id: string
          generadora_nit: string
          generadora_razon_social: string
          generadora_representante: string
          id: string
          numero_certificado: string
          recolectora_autoridad_ambiental: string | null
          recolectora_id: string
          recolectora_licencia_ambiental: string | null
          recolectora_nit: string
          recolectora_razon_social: string
          solicitud_id: string | null
          tipo_residuo: string
          unidad: string
          updated_at: string
        }
        Insert: {
          cantidad_dispuesta: number
          categoria_residuo: string
          codigo_verificacion: string
          created_at?: string
          destino_final: string
          fecha_recoleccion: string
          generadora_ciudad: string
          generadora_id: string
          generadora_nit: string
          generadora_razon_social: string
          generadora_representante: string
          id?: string
          numero_certificado: string
          recolectora_autoridad_ambiental?: string | null
          recolectora_id: string
          recolectora_licencia_ambiental?: string | null
          recolectora_nit: string
          recolectora_razon_social: string
          solicitud_id?: string | null
          tipo_residuo: string
          unidad: string
          updated_at?: string
        }
        Update: {
          cantidad_dispuesta?: number
          categoria_residuo?: string
          codigo_verificacion?: string
          created_at?: string
          destino_final?: string
          fecha_recoleccion?: string
          generadora_ciudad?: string
          generadora_id?: string
          generadora_nit?: string
          generadora_razon_social?: string
          generadora_representante?: string
          id?: string
          numero_certificado?: string
          recolectora_autoridad_ambiental?: string | null
          recolectora_id?: string
          recolectora_licencia_ambiental?: string | null
          recolectora_nit?: string
          recolectora_razon_social?: string
          solicitud_id?: string | null
          tipo_residuo?: string
          unidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificados_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_recoleccion"
            referencedColumns: ["id"]
          },
        ]
      }
      ofertas_recoleccion: {
        Row: {
          contrapropuesta_fecha: string | null
          contrapropuesta_mensaje: string | null
          contrapropuesta_precio: number | null
          created_at: string
          fecha_disponible: string
          id: string
          mensaje: string | null
          precio_propuesto: number
          recolectora_id: string
          solicitud_id: string
          status: string
          updated_at: string
        }
        Insert: {
          contrapropuesta_fecha?: string | null
          contrapropuesta_mensaje?: string | null
          contrapropuesta_precio?: number | null
          created_at?: string
          fecha_disponible: string
          id?: string
          mensaje?: string | null
          precio_propuesto: number
          recolectora_id: string
          solicitud_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          contrapropuesta_fecha?: string | null
          contrapropuesta_mensaje?: string | null
          contrapropuesta_precio?: number | null
          created_at?: string
          fecha_disponible?: string
          id?: string
          mensaje?: string | null
          precio_propuesto?: number
          recolectora_id?: string
          solicitud_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_recoleccion_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_recoleccion"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ciudad: string
          created_at: string
          email_corporativo: string
          id: string
          nit: string
          razon_social: string
          representante_legal: string
          telefono: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ciudad: string
          created_at?: string
          email_corporativo: string
          id?: string
          nit: string
          razon_social: string
          representante_legal: string
          telefono: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ciudad?: string
          created_at?: string
          email_corporativo?: string
          id?: string
          nit?: string
          razon_social?: string
          representante_legal?: string
          telefono?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registration_documents: {
        Row: {
          ai_anomalies: string[] | null
          ai_confidence: number | null
          ai_fields: Json | null
          ai_validated_at: string | null
          autoridad_emisora: string | null
          categorias_autorizadas: string[] | null
          document_name: string
          fecha_vencimiento: string | null
          file_path: string
          file_size: number | null
          id: string
          is_required: boolean | null
          numero_resolucion: string | null
          observation: string | null
          request_id: string
          uploaded_at: string
          validation_status: string | null
        }
        Insert: {
          ai_anomalies?: string[] | null
          ai_confidence?: number | null
          ai_fields?: Json | null
          ai_validated_at?: string | null
          autoridad_emisora?: string | null
          categorias_autorizadas?: string[] | null
          document_name: string
          fecha_vencimiento?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          is_required?: boolean | null
          numero_resolucion?: string | null
          observation?: string | null
          request_id: string
          uploaded_at?: string
          validation_status?: string | null
        }
        Update: {
          ai_anomalies?: string[] | null
          ai_confidence?: number | null
          ai_fields?: Json | null
          ai_validated_at?: string | null
          autoridad_emisora?: string | null
          categorias_autorizadas?: string[] | null
          document_name?: string
          fecha_vencimiento?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          is_required?: boolean | null
          numero_resolucion?: string | null
          observation?: string | null
          request_id?: string
          uploaded_at?: string
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "registration_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_requests: {
        Row: {
          admin_message: string | null
          allow_resubmit: boolean | null
          autoridad_ambiental: string | null
          ciudad: string
          created_at: string
          email_corporativo: string
          id: string
          nit: string
          numero_resolucion_licencia: string | null
          razon_social: string
          rejection_reason: string | null
          representante_legal: string
          reviewed_at: string | null
          reviewed_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          telefono: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_message?: string | null
          allow_resubmit?: boolean | null
          autoridad_ambiental?: string | null
          ciudad: string
          created_at?: string
          email_corporativo: string
          id?: string
          nit: string
          numero_resolucion_licencia?: string | null
          razon_social: string
          rejection_reason?: string | null
          representante_legal: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          telefono: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_message?: string | null
          allow_resubmit?: boolean | null
          autoridad_ambiental?: string | null
          ciudad?: string
          created_at?: string
          email_corporativo?: string
          id?: string
          nit?: string
          numero_resolucion_licencia?: string | null
          razon_social?: string
          rejection_reason?: string | null
          representante_legal?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          telefono?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      request_actions_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          performed_by: string | null
          request_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          performed_by?: string | null
          request_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          performed_by?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_actions_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "registration_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      residuos: {
        Row: {
          activo: boolean
          cantidad_estimada: number
          categoria: string
          condiciones_almacenamiento: string | null
          created_at: string
          descripcion: string | null
          frecuencia: string
          id: string
          nombre: string
          unidad: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          cantidad_estimada: number
          categoria: string
          condiciones_almacenamiento?: string | null
          created_at?: string
          descripcion?: string | null
          frecuencia: string
          id?: string
          nombre: string
          unidad: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          cantidad_estimada?: number
          categoria?: string
          condiciones_almacenamiento?: string | null
          created_at?: string
          descripcion?: string | null
          frecuencia?: string
          id?: string
          nombre?: string
          unidad?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      solicitud_residuos: {
        Row: {
          cantidad_real: number
          created_at: string
          id: string
          residuo_id: string
          solicitud_id: string
        }
        Insert: {
          cantidad_real: number
          created_at?: string
          id?: string
          residuo_id: string
          solicitud_id: string
        }
        Update: {
          cantidad_real?: number
          created_at?: string
          id?: string
          residuo_id?: string
          solicitud_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitud_residuos_residuo_id_fkey"
            columns: ["residuo_id"]
            isOneToOne: false
            referencedRelation: "residuos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitud_residuos_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_recoleccion"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_recoleccion: {
        Row: {
          created_at: string
          direccion_recoleccion: string
          fecha_preferida: string
          id: string
          instrucciones_especiales: string | null
          notas_acceso: string | null
          rango_horario_fin: string
          rango_horario_inicio: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direccion_recoleccion: string
          fecha_preferida: string
          id?: string
          instrucciones_especiales?: string | null
          notas_acceso?: string | null
          rango_horario_fin: string
          rango_horario_inicio: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direccion_recoleccion?: string
          fecha_preferida?: string
          id?: string
          instrucciones_especiales?: string | null
          notas_acceso?: string | null
          rango_horario_fin?: string
          rango_horario_inicio?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      recolectora_can_view_residuo: {
        Args: { _recolectora_id: string; _residuo_id: string }
        Returns: boolean
      }
      recolectora_has_oferta_on_solicitud: {
        Args: { _recolectora_id: string; _solicitud_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "generadora" | "recolectora"
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
      app_role: ["admin", "generadora", "recolectora"],
    },
  },
} as const
