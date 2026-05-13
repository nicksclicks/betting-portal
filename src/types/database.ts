export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'user';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deposits: {
        Row: {
          id: string;
          sportsbook: string;
          deposit_amount: number;
          deposit_date: string;
          bonus_received: number;
          rollover_multiplier: number;
          current_balance: number;
          status: 'active' | 'completed' | 'withdrawn';
          notes: string | null;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sportsbook: string;
          deposit_amount: number;
          deposit_date?: string;
          bonus_received?: number;
          rollover_multiplier?: number;
          current_balance?: number;
          status?: 'active' | 'completed' | 'withdrawn';
          notes?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sportsbook?: string;
          deposit_amount?: number;
          deposit_date?: string;
          bonus_received?: number;
          rollover_multiplier?: number;
          current_balance?: number;
          status?: 'active' | 'completed' | 'withdrawn';
          notes?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bets: {
        Row: {
          id: string;
          user_id: string | null;
          bet_name: string;
          sportsbook: string;
          odds: number;
          amount_staked: number;
          is_bonus_bet: boolean;
          is_odds_boost: boolean;
          tags: string[];
          status: 'pending' | 'won' | 'lost' | 'void';
          created_at: string;
          settled_at: string | null;
          group_id: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          bet_name: string;
          sportsbook: string;
          odds: number;
          amount_staked: number;
          is_bonus_bet?: boolean;
          is_odds_boost?: boolean;
          tags?: string[];
          status?: 'pending' | 'won' | 'lost' | 'void';
          created_at?: string;
          settled_at?: string | null;
          group_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          bet_name?: string;
          sportsbook?: string;
          odds?: number;
          amount_staked?: number;
          is_bonus_bet?: boolean;
          is_odds_boost?: boolean;
          tags?: string[];
          status?: 'pending' | 'won' | 'lost' | 'void';
          created_at?: string;
          settled_at?: string | null;
          group_id?: string | null;
        };
        Relationships: [];
      };
      odds: {
        Row: {
          id: string;
          sport: string;
          home_team: string;
          away_team: string;
          game_time: string;
          market_type: string;
          sportsbook: string;
          home_odds: number | null;
          away_odds: number | null;
          spread: number | null;
          total: number | null;
          external_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: { check_uid?: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type AppUser = Database['public']['Tables']['users']['Row'];
export type AppUserInsert = Database['public']['Tables']['users']['Insert'];
export type AppUserUpdate = Database['public']['Tables']['users']['Update'];

export type Deposit = Database['public']['Tables']['deposits']['Row'];
export type DepositInsert = Database['public']['Tables']['deposits']['Insert'];
export type DepositUpdate = Database['public']['Tables']['deposits']['Update'];

export type Bet = Database['public']['Tables']['bets']['Row'];
export type BetInsert = Database['public']['Tables']['bets']['Insert'];
export type BetUpdate = Database['public']['Tables']['bets']['Update'];

export type OddsRow = Database['public']['Tables']['odds']['Row'];
