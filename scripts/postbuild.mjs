// Generates dist/sitemap.xml. If Supabase env vars are present, every scheduled date is listed;
// otherwise only the home page. Uses only the public anon key via the REST API.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

function loadEnv() {
  const env = { ...process.env };
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const site = (env.VITE_SITE_URL || '').replace(/\/$/, '');
const tz = env.VITE_PRIMARY_TIMEZONE || 'Asia/Kolkata';
const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const urls = [`${site}/`, `${site}/about`, `${site}/privacy`];
if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
  try {
    const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/daily_verses?select=verse_date&order=verse_date&verse_date=lte.${today}&limit=1000`, {
      headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` },
    });
    if (res.ok) for (const r of await res.json()) urls.push(`${site}/${r.verse_date}`);
    else console.warn('sitemap: Supabase responded', res.status, '- listing home page only');
  } catch (e) {
    console.warn('sitemap: could not reach Supabase - listing home page only');
  }
}
if (!site) console.warn('sitemap: VITE_SITE_URL is empty; set it so sitemap URLs are absolute.');
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`;
writeFileSync('dist/sitemap.xml', xml);
if (site) writeFileSync('dist/robots.txt', readFileSync('public/robots.txt', 'utf8') + `\nSitemap: ${site}/sitemap.xml\n`);
console.log(`sitemap: ${urls.length} URL(s)`);
