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
  const selectChain = {
    eq: () => ({
      order: () => resolved<unknown[]>([]),
      single: () => resolved<null>(null),
      maybeSingle: () => resolved<null>(null),
    }),
    order: () => resolved<unknown[]>([]),
    single: () => resolved<null>(null),
    maybeSingle: () => resolved<null>(null),
  };

  const mockFrom = () => ({
    select: () => selectChain,
    insert: () => resolved<null>(null),
    update: () => ({
      eq: () => resolved<null>(null),
    }),
    delete: () => ({
      eq: () => resolved<null>(null),
    }),
  });

  return {
    from: mockFrom,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
      signInWithPassword: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: null,
        }),
      resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null }),
      signUp: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: null,
        }),
      signOut: () => Promise.resolve({ error: null }),
      updateUser: () =>
        Promise.resolve({
          data: { user: null },
          error: null,
        }),
    },
    functions: {
      invoke: () => Promise.resolve({ data: null, error: null }),
    },
  } as unknown as SupabaseClient<Database>;
}
