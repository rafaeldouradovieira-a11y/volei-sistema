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
      profiles: {
        Row: {
          id: string;
          name: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          phone: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          organizer_id: string;
          title: string | null;
          date: string;
          time: string;
          location: string;
          court: string | null;
          duration_hours: number;
          max_players: number;
          price_total: number | null;
          pix_key: string | null;
          status: "active" | "closed" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          title?: string | null;
          date: string;
          time: string;
          location: string;
          court?: string | null;
          duration_hours: number;
          max_players: number;
          price_total?: number | null;
          pix_key?: string | null;
          status?: "active" | "closed" | "cancelled";
          created_at?: string;
        };
        Update: {
          id?: string;
          organizer_id?: string;
          title?: string | null;
          date?: string;
          time?: string;
          location?: string;
          court?: string | null;
          duration_hours?: number;
          max_players?: number;
          price_total?: number | null;
          pix_key?: string | null;
          status?: "active" | "closed" | "cancelled";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "games_organizer_id_fkey";
            columns: ["organizer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      game_participants: {
        Row: {
          id: string;
          game_id: string;
          user_id: string;
          joined_at: string;
          payment_status: "pending" | "confirmed";
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          joined_at?: string;
          payment_status?: "pending" | "confirmed";
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string;
          joined_at?: string;
          payment_status?: "pending" | "confirmed";
        };
        Relationships: [
          {
            foreignKeyName: "game_participants_game_id_fkey";
            columns: ["game_id"];
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_participants_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      waiting_list: {
        Row: {
          id: string;
          game_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "waiting_list_game_id_fkey";
            columns: ["game_id"];
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "waiting_list_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Game = Database["public"]["Tables"]["games"]["Row"];
export type GameParticipant =
  Database["public"]["Tables"]["game_participants"]["Row"];
export type WaitingListEntry =
  Database["public"]["Tables"]["waiting_list"]["Row"];

export type GameWithDetails = Game & {
  profiles: Profile;
  game_participants: (GameParticipant & { profiles: Profile })[];
  waiting_list: (WaitingListEntry & { profiles: Profile })[];
};
