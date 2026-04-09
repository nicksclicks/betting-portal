import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { createMockSupabaseClient } from './mockSupabaseClient';

const useLocalMock = import.meta.env.VITE_LOCAL_MOCK === 'true';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient<Database> = useLocalMock
  ? createMockSupabaseClient()
  : (() => {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'Missing Supabase config: copy .env.example to .env, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (Supabase → Project Settings → API), or set VITE_LOCAL_MOCK=true for UI-only mock data, then restart `npm run dev`.'
        );
      }
      return createClient<Database>(supabaseUrl, supabaseAnonKey);
    })();

export const isLocalMockMode = useLocalMock;
