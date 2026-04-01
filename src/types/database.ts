export interface Database {
  public: {
    Tables: {
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
      };
    };
  };
}

export type Deposit = Database['public']['Tables']['deposits']['Row'];
export type DepositInsert = Database['public']['Tables']['deposits']['Insert'];
export type DepositUpdate = Database['public']['Tables']['deposits']['Update'];

export type Bet = Database['public']['Tables']['bets']['Row'];
export type BetInsert = Database['public']['Tables']['bets']['Insert'];
export type BetUpdate = Database['public']['Tables']['bets']['Update'];
