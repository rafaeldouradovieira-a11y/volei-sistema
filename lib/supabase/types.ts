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
          name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      authorized_phones: {
        Row: {
          id: string;
          phone: string;
          is_admin: boolean;
          invited_by_id: string | null;
          display_name: string | null;
          auth_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          is_admin?: boolean;
          invited_by_id?: string | null;
          display_name?: string | null;
          auth_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          is_admin?: boolean;
          invited_by_id?: string | null;
          display_name?: string | null;
          auth_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "authorized_phones_invited_by_id_fkey";
            columns: ["invited_by_id"];
            referencedRelation: "authorized_phones";
            referencedColumns: ["id"];
          }
        ];
      };
      unauthorized_attempts: {
        Row: {
          id: string;
          phone: string;
          attempted_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          attempted_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          attempted_at?: string;
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
          proof_url: string | null;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          joined_at?: string;
          payment_status?: "pending" | "confirmed";
          proof_url?: string | null;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string;
          joined_at?: string;
          payment_status?: "pending" | "confirmed";
          proof_url?: string | null;
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
      game_guests: {
        Row: {
          id: string;
          game_id: string;
          invited_by: string;
          name: string;
          payment_status: "pending" | "confirmed";
          joined_at: string;
          proof_url: string | null;
          status: "active" | "waiting";
        };
        Insert: {
          id?: string;
          game_id: string;
          invited_by: string;
          name: string;
          payment_status?: "pending" | "confirmed";
          joined_at?: string;
          proof_url?: string | null;
          status?: "active" | "waiting";
        };
        Update: {
          id?: string;
          game_id?: string;
          invited_by?: string;
          name?: string;
          payment_status?: "pending" | "confirmed";
          joined_at?: string;
          proof_url?: string | null;
          status?: "active" | "waiting";
        };
        Relationships: [
          {
            foreignKeyName: "game_guests_game_id_fkey";
            columns: ["game_id"];
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_guests_invited_by_fkey";
            columns: ["invited_by"];
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
      matches: {
        Row: {
          id: string;
          game_id: string;
          started_by: string;
          team1: MatchPlayer[];
          team2: MatchPlayer[];
          score1: number;
          score2: number;
          winner: number | null;
          status: "live" | "finished";
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          game_id: string;
          started_by: string;
          team1: MatchPlayer[];
          team2: MatchPlayer[];
          score1?: number;
          score2?: number;
          winner?: number | null;
          status?: "live" | "finished";
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          game_id?: string;
          started_by?: string;
          team1?: MatchPlayer[];
          team2?: MatchPlayer[];
          score1?: number;
          score2?: number;
          winner?: number | null;
          status?: "live" | "finished";
          started_at?: string;
          ended_at?: string | null;
        };
        Relationships: [];
      };
      match_wins: {
        Row: {
          id: string;
          match_id: string;
          player_id: string;
          played_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          player_id: string;
          played_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string;
          played_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type MatchPlayer = {
  id: string;
  name: string;
  type: "participant" | "guest";
  profile_id: string | null;
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type GameGuest = Database["public"]["Tables"]["game_guests"]["Row"];
export type AuthorizedPhone = Database["public"]["Tables"]["authorized_phones"]["Row"];
export type UnauthorizedAttempt = Database["public"]["Tables"]["unauthorized_attempts"]["Row"];
export type Game = Database["public"]["Tables"]["games"]["Row"];
export type GameParticipant = Database["public"]["Tables"]["game_participants"]["Row"];
export type WaitingListEntry = Database["public"]["Tables"]["waiting_list"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type MatchWin = Database["public"]["Tables"]["match_wins"]["Row"];

export type GameWithDetails = Game & {
  profiles: Profile;
  game_participants: (GameParticipant & { profiles: Profile })[];
  waiting_list: (WaitingListEntry & { profiles: Profile })[];
  game_guests: (GameGuest & { profiles: Profile })[];
};
