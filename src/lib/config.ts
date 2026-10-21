const env = import.meta.env;

export const config = {
  supabaseUrl: (env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '',
  supabaseKey: (env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '',
  timezone: (env.VITE_PRIMARY_TIMEZONE as string | undefined)?.trim() || 'Asia/Kolkata',
  siteUrl: ((env.VITE_SITE_URL as string | undefined)?.trim() || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, ''),
};

/** Returns a human-readable setup problem, or null when configuration is usable. */
export function getConfigError(): string | null {
  const missing: string[] = [];
  if (!config.supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!config.supabaseKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (missing.length) {
    return `Setup incomplete: ${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} missing. Copy .env.example to .env, fill the values from your Supabase project, then restart the dev server.`;
  }
  return null;
}
