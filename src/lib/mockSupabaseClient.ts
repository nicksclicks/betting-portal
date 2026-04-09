import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

function resolved<T>(data: T, error: null = null) {
  return Promise.resolve({ data, error });
}

/**
 * Minimal stub so Bet Tracker, Deposits, Settings load without a real Supabase project.
 * All reads return empty; writes no-op with success.
 */
export function createMockSupabaseClient(): SupabaseClient<Database> {
  const mockFrom = () => ({
    select: () => ({
      order: () => resolved<unknown[]>([]),
      single: () => resolved<null>(null),
    }),
    insert: () => resolved<null>(null),
    update: () => ({
      eq: () => resolved<null>(null),
    }),
    delete: () => ({
      eq: () => resolved<null>(null),
    }),
  });

  return { from: mockFrom } as unknown as SupabaseClient<Database>;
}
