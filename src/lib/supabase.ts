import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config, getConfigError } from './config';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const problem = getConfigError();
  if (problem) throw new Error(problem);
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
