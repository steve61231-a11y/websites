export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          age_range: string | null;
          created_at: string;
          description: string | null;
          glyph: string;
          id: string;
          name: string;
          one_liner: string;
          outcomes: string[];
          recruiting: boolean;
          slug: string;
          sort_order: number;
          status: Database["public"]["Enums"]["activity_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          age_range?: string | null;
          created_at?: string;
          description?: string | null;
          glyph?: string;
          id?: string;
          name: string;
          one_liner: string;
          outcomes?: string[];
          recruiting?: boolean;
          slug: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["activity_status"];
          updated_at?: string;
        };
        Update: {
          age_range?: string | null;
          created_at?: string;
          description?: string | null;
          glyph?: string;
          id?: string;
          name?: string;
          one_liner?: string;
          outcomes?: string[];
          recruiting?: boolean;
          slug?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["activity_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      activity_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          from_value: string | null;
          id: string;
          to_value: string | null;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          from_value?: string | null;
          id?: string;
          to_value?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          from_value?: string | null;
          id?: string;
          to_value?: string | null;
        };
        Relationships: [];
      };
      application_activities: {
        Row: {
          activity_id: string;
          application_id: string;
          created_at: string;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          activity_id: string;
          application_id: string;
          created_at?: string;
          id?: string;
        };
        Update: {
          activity_id?: string;
          application_id?: string;
          created_at?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "application_activities_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "application_activities_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      application_files: {
        Row: {
          application_id: string;
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["file_kind"];
          mime: string;
          original_name: string;
          size_bytes: number;
          storage_path: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["file_kind"];
          mime: string;
          original_name: string;
          size_bytes: number;
          storage_path: string;
        };
        Update: {
          application_id?: string;
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["file_kind"];
          mime?: string;
          original_name?: string;
          size_bytes?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "application_files_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      application_referees: {
        Row: {
          application_id: string;
          created_at: string;
          id: string;
          name: string;
          phone_e164: string;
          relationship: string | null;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          created_at?: string;
          id?: string;
          name: string;
          phone_e164: string;
          relationship?: string | null;
        };
        Update: {
          application_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          phone_e164?: string;
          relationship?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "application_referees_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          availability: string[];
          consent_at: string;
          consent_version: string;
          counties: string[];
          county: string;
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          decline_reason: string | null;
          delete_after: string | null;
          email: string;
          experience: string;
          extra_notes: string | null;
          first_aid: string;
          full_name: string;
          good_conduct: string;
          heard_from: string | null;
          highest_rank: string;
          id: string;
          idempotency_key: string | null;
          is_adult: boolean;
          main_activity_id: string | null;
          main_activity_other: string | null;
          open_role_id: string | null;
          phone_e164: string;
          ref: string;
          source: string | null;
          status: Database["public"]["Enums"]["application_status"];
          updated_at: string;
          utm: NonNullable<Json>;
          video_url: string | null;
          work_preference: string;
          years_coaching: number;
          years_practising: number;
        };
        ComputedFields: never;
        Insert: {
          availability?: string[];
          consent_at: string;
          consent_version: string;
          counties?: string[];
          county: string;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decline_reason?: string | null;
          delete_after?: string | null;
          email: string;
          experience: string;
          extra_notes?: string | null;
          first_aid: string;
          full_name: string;
          good_conduct: string;
          heard_from?: string | null;
          highest_rank: string;
          id?: string;
          idempotency_key?: string | null;
          is_adult: boolean;
          main_activity_id?: string | null;
          main_activity_other?: string | null;
          open_role_id?: string | null;
          phone_e164: string;
          ref?: string;
          source?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
          utm?: NonNullable<Json>;
          video_url?: string | null;
          work_preference: string;
          years_coaching: number;
          years_practising: number;
        };
        Update: {
          availability?: string[];
          consent_at?: string;
          consent_version?: string;
          counties?: string[];
          county?: string;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decline_reason?: string | null;
          delete_after?: string | null;
          email?: string;
          experience?: string;
          extra_notes?: string | null;
          first_aid?: string;
          full_name?: string;
          good_conduct?: string;
          heard_from?: string | null;
          highest_rank?: string;
          id?: string;
          idempotency_key?: string | null;
          is_adult?: boolean;
          main_activity_id?: string | null;
          main_activity_other?: string | null;
          open_role_id?: string | null;
          phone_e164?: string;
          ref?: string;
          source?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
          utm?: NonNullable<Json>;
          video_url?: string | null;
          work_preference?: string;
          years_coaching?: number;
          years_practising?: number;
        };
        Relationships: [
          {
            foreignKeyName: "applications_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_main_activity_id_fkey";
            columns: ["main_activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_open_role_id_fkey";
            columns: ["open_role_id"];
            isOneToOne: false;
            referencedRelation: "open_roles";
            referencedColumns: ["id"];
          },
        ];
      };
      inquiries: {
        Row: {
          anonymised_at: string | null;
          assigned_to: string | null;
          consent_at: string;
          consent_version: string;
          contact_name: string;
          contact_pref: string | null;
          contact_role: string | null;
          county: string | null;
          county_other: string | null;
          created_at: string;
          details_added_at: string | null;
          email: string | null;
          grades: string[];
          id: string;
          idempotency_key: string | null;
          institution_type: string | null;
          learners_band: string | null;
          lost_reason: string | null;
          message: string | null;
          next_action: string | null;
          next_action_due: string | null;
          phone_e164: string | null;
          preferred_days: string[];
          preferred_time: string | null;
          ref: string;
          school_name: string | null;
          sector: string | null;
          source: string | null;
          start_term: string | null;
          status: Database["public"]["Enums"]["inquiry_status"];
          type: Database["public"]["Enums"]["inquiry_type"];
          updated_at: string;
          utm: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          anonymised_at?: string | null;
          assigned_to?: string | null;
          consent_at: string;
          consent_version: string;
          contact_name: string;
          contact_pref?: string | null;
          contact_role?: string | null;
          county?: string | null;
          county_other?: string | null;
          created_at?: string;
          details_added_at?: string | null;
          email?: string | null;
          grades?: string[];
          id?: string;
          idempotency_key?: string | null;
          institution_type?: string | null;
          learners_band?: string | null;
          lost_reason?: string | null;
          message?: string | null;
          next_action?: string | null;
          next_action_due?: string | null;
          phone_e164?: string | null;
          preferred_days?: string[];
          preferred_time?: string | null;
          ref?: string;
          school_name?: string | null;
          sector?: string | null;
          source?: string | null;
          start_term?: string | null;
          status?: Database["public"]["Enums"]["inquiry_status"];
          type: Database["public"]["Enums"]["inquiry_type"];
          updated_at?: string;
          utm?: NonNullable<Json>;
        };
        Update: {
          anonymised_at?: string | null;
          assigned_to?: string | null;
          consent_at?: string;
          consent_version?: string;
          contact_name?: string;
          contact_pref?: string | null;
          contact_role?: string | null;
          county?: string | null;
          county_other?: string | null;
          created_at?: string;
          details_added_at?: string | null;
          email?: string | null;
          grades?: string[];
          id?: string;
          idempotency_key?: string | null;
          institution_type?: string | null;
          learners_band?: string | null;
          lost_reason?: string | null;
          message?: string | null;
          next_action?: string | null;
          next_action_due?: string | null;
          phone_e164?: string | null;
          preferred_days?: string[];
          preferred_time?: string | null;
          ref?: string;
          school_name?: string | null;
          sector?: string | null;
          source?: string | null;
          start_term?: string | null;
          status?: Database["public"]["Enums"]["inquiry_status"];
          type?: Database["public"]["Enums"]["inquiry_type"];
          updated_at?: string;
          utm?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "inquiries_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      inquiry_activities: {
        Row: {
          activity_id: string;
          created_at: string;
          id: string;
          inquiry_id: string;
        };
        ComputedFields: never;
        Insert: {
          activity_id: string;
          created_at?: string;
          id?: string;
          inquiry_id: string;
        };
        Update: {
          activity_id?: string;
          created_at?: string;
          id?: string;
          inquiry_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inquiry_activities_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inquiry_activities_inquiry_id_fkey";
            columns: ["inquiry_id"];
            isOneToOne: false;
            referencedRelation: "inquiries";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          entity_id: string;
          entity_type: Database["public"]["Enums"]["note_entity"];
          id: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          entity_id: string;
          entity_type: Database["public"]["Enums"]["note_entity"];
          id?: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: Database["public"]["Enums"]["note_entity"];
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      open_roles: {
        Row: {
          activity_id: string | null;
          counties: string[];
          created_at: string;
          description: string | null;
          employment_type: string | null;
          id: string;
          is_open: boolean;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          activity_id?: string | null;
          counties?: string[];
          created_at?: string;
          description?: string | null;
          employment_type?: string | null;
          id?: string;
          is_open?: boolean;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          activity_id?: string | null;
          counties?: string[];
          created_at?: string;
          description?: string | null;
          employment_type?: string | null;
          id?: string;
          is_open?: boolean;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "open_roles_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
        ];
      };
      partners: {
        Row: {
          created_at: string;
          id: string;
          logo_path: string | null;
          name: string;
          permission_confirmed: boolean;
          published: boolean;
          sort_order: number;
          updated_at: string;
          url: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          logo_path?: string | null;
          name: string;
          permission_confirmed?: boolean;
          published?: boolean;
          sort_order?: number;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          logo_path?: string | null;
          name?: string;
          permission_confirmed?: boolean;
          published?: boolean;
          sort_order?: number;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          active: boolean;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["staff_role"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id: string;
          role?: Database["public"]["Enums"]["staff_role"];
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["staff_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          count: number;
          key: string;
          window_start: string;
        };
        ComputedFields: never;
        Insert: {
          count?: number;
          key: string;
          window_start: string;
        };
        Update: {
          count?: number;
          key?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          alert_recipients: string[];
          counties: string[];
          created_at: string;
          email: string | null;
          email_alerts_enabled: boolean;
          id: string;
          phones: string[];
          required_checks: Database["public"]["Enums"]["check_type"][];
          response_time_text: string;
          singleton: boolean;
          socials: NonNullable<Json>;
          start_term_options: string[];
          updated_at: string;
          whatsapp_e164: string;
        };
        ComputedFields: never;
        Insert: {
          alert_recipients?: string[];
          counties?: string[];
          created_at?: string;
          email?: string | null;
          email_alerts_enabled?: boolean;
          id?: string;
          phones?: string[];
          required_checks?: Database["public"]["Enums"]["check_type"][];
          response_time_text: string;
          singleton?: boolean;
          socials?: NonNullable<Json>;
          start_term_options?: string[];
          updated_at?: string;
          whatsapp_e164: string;
        };
        Update: {
          alert_recipients?: string[];
          counties?: string[];
          created_at?: string;
          email?: string | null;
          email_alerts_enabled?: boolean;
          id?: string;
          phones?: string[];
          required_checks?: Database["public"]["Enums"]["check_type"][];
          response_time_text?: string;
          singleton?: boolean;
          socials?: NonNullable<Json>;
          start_term_options?: string[];
          updated_at?: string;
          whatsapp_e164?: string;
        };
        Relationships: [];
      };
      testimonials: {
        Row: {
          author_name: string;
          author_role: string | null;
          created_at: string;
          id: string;
          organisation: string | null;
          permission_confirmed: boolean;
          photo_path: string | null;
          published: boolean;
          quote: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author_name: string;
          author_role?: string | null;
          created_at?: string;
          id?: string;
          organisation?: string | null;
          permission_confirmed?: boolean;
          photo_path?: string | null;
          published?: boolean;
          quote: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          author_name?: string;
          author_role?: string | null;
          created_at?: string;
          id?: string;
          organisation?: string | null;
          permission_confirmed?: boolean;
          photo_path?: string | null;
          published?: boolean;
          quote?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      vetting_checks: {
        Row: {
          application_id: string;
          check_type: Database["public"]["Enums"]["check_type"];
          created_at: string;
          id: string;
          note: string | null;
          recorded_at: string | null;
          recorded_by: string | null;
          result: Database["public"]["Enums"]["check_result"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          check_type: Database["public"]["Enums"]["check_type"];
          created_at?: string;
          id?: string;
          note?: string | null;
          recorded_at?: string | null;
          recorded_by?: string | null;
          result?: Database["public"]["Enums"]["check_result"];
          updated_at?: string;
        };
        Update: {
          application_id?: string;
          check_type?: Database["public"]["Enums"]["check_type"];
          created_at?: string;
          id?: string;
          note?: string | null;
          recorded_at?: string | null;
          recorded_by?: string | null;
          result?: Database["public"]["Enums"]["check_result"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vetting_checks_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vetting_checks_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_settings: {
        Row: {
          counties: string[] | null;
          email: string | null;
          phones: string[] | null;
          response_time_text: string | null;
          socials: Json | null;
          start_term_options: string[] | null;
          whatsapp_e164: string | null;
        };
        ComputedFields: never;
        Insert: {
          counties?: string[] | null;
          email?: string | null;
          phones?: string[] | null;
          response_time_text?: string | null;
          socials?: Json | null;
          start_term_options?: string[] | null;
          whatsapp_e164?: string | null;
        };
        Update: {
          counties?: string[] | null;
          email?: string | null;
          phones?: string[] | null;
          response_time_text?: string | null;
          socials?: Json | null;
          start_term_options?: string[] | null;
          whatsapp_e164?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      add_inquiry_details: {
        Args: { p: Json; p_key: string; p_ref: string };
        Returns: boolean;
      };
      is_owner: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      log_event: {
        Args: {
          p_action: string;
          p_entity_id: string;
          p_entity_type: string;
          p_from: string;
          p_to: string;
        };
        Returns: undefined;
      };
      rate_limit_hit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      submit_application: { Args: { p: Json }; Returns: Json };
      submit_inquiry: { Args: { p: Json }; Returns: Json };
    };
    Enums: {
      activity_status: "available" | "soon" | "hidden";
      application_status:
        | "new"
        | "shortlisted"
        | "in_vetting"
        | "approved"
        | "on_hold"
        | "declined";
      check_result: "pending" | "passed" | "failed" | "waived";
      check_type:
        "interview" | "live_demo" | "good_conduct" | "references" | "first_aid";
      file_kind: "certificate" | "first_aid" | "good_conduct" | "other";
      inquiry_status:
        | "new"
        | "contacted"
        | "demo_scheduled"
        | "proposal_sent"
        | "won"
        | "lost"
        | "closed";
      inquiry_type: "demo" | "interest" | "general";
      note_entity: "inquiry" | "application";
      staff_role: "owner" | "staff";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      activity_status: ["available", "soon", "hidden"],
      application_status: [
        "new",
        "shortlisted",
        "in_vetting",
        "approved",
        "on_hold",
        "declined",
      ],
      check_result: ["pending", "passed", "failed", "waived"],
      check_type: [
        "interview",
        "live_demo",
        "good_conduct",
        "references",
        "first_aid",
      ],
      file_kind: ["certificate", "first_aid", "good_conduct", "other"],
      inquiry_status: [
        "new",
        "contacted",
        "demo_scheduled",
        "proposal_sent",
        "won",
        "lost",
        "closed",
      ],
      inquiry_type: ["demo", "interest", "general"],
      note_entity: ["inquiry", "application"],
      staff_role: ["owner", "staff"],
    },
  },
} as const;
