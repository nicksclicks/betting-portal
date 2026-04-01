import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase config: copy .env.example to .env, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (Supabase → Project Settings → API), then restart `npm run dev`.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
