# AlphaOmega Studio — Daily Bible Verse

A mobile-first site that shows one Bible verse per date, with language switching, date selection, like and share, plus a separate `/admin` dashboard for managing verses. React + TypeScript + Vite + Tailwind, with Supabase (PostgreSQL, Row Level Security, Auth). There is no custom backend server.

## What is verified, and what is not

| Check | Status |
|---|---|
| Unit and component tests (Vitest + React Testing Library), 41 tests | Run, all pass |
| TypeScript check and production build | Run, pass |
| Database security (RLS, grants, atomic save RPC) against a real local PostgreSQL | Run, 20 checks pass (`supabase/tests/`) |
| Live Supabase project, real sign-in, deployed site | **Not tested.** Needs your credentials. Follow the steps below. |
| Visual check in real browsers at 320/375/430/768/1024/1440 px | **Not tested.** The layout uses responsive utilities and wrapping text, but please check it yourself. |
| Social link previews for individual dates | See "SEO and sharing" below |

## 1. Install tools (Windows 11)

1. Install Node.js 20 or newer (LTS) from https://nodejs.org. Check with `node -v`.
2. Optional: Git from https://git-scm.com.

## 2. Install and configure

```powershell
# extract the ZIP, then:
cd daily-bible-verse
npm install
copy .env.example .env
```

Edit `.env` (see section 3 for where the values come from):

| Variable | Meaning |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | The anon (or new publishable `sb_publishable_...`) key. Public by design. |
| `VITE_PRIMARY_TIMEZONE` | Decides what "today" is. Default `Asia/Kolkata`. |
| `VITE_SITE_URL` | Your public address, used for share links, canonical URLs and the sitemap |

**Never** put the `service_role` key in `.env` or anywhere in this project. It is not needed. If a variable is missing, the site shows a setup message instead of crashing.

## 3. Create the Supabase project and database

1. Create a free project at https://supabase.com.
2. Project Settings → API: copy the Project URL and the anon/publishable key into `.env`.
3. SQL Editor: run these files **in order**, each pasted in full:
   1. `supabase/migrations/001_init.sql` (tables, constraints, indexes, RLS, grants)
   2. `supabase/migrations/003_admin_save_verse.sql` (atomic save function)
   3. Optional: `supabase/migrations/002_seed_demo.sql` (the Luke 12:40 demo verse for 2026-10-20)
4. Authentication → Providers: keep Email enabled, and **turn off "Allow new users to sign up"** so nobody can self-register.

### Create the first administrator

1. Authentication → Users → Add user → enter your email and a strong password, tick Auto Confirm User.
2. Open `supabase/seed_first_admin.sql`, replace `you@example.com` with that email, and run it in the SQL Editor.
3. Only users listed in `public.admin_users` can write. Being signed in is not enough. To add another admin, create the user, then repeat step 2 for that email.

## 4. Run, test, build

```powershell
npm run dev        # http://localhost:5173  (admin: /admin)
npm test           # 41 automated tests
npm run build      # type check, bundle, sitemap -> dist/
npm run preview    # serve the production build locally
```

Database security check (Linux, macOS or WSL; it starts a throwaway local PostgreSQL):
`bash supabase/tests/run_local_rls_check.sh`

## 5. Daily use

- **Add a verse:** `/admin` → Add verse. Date, reference and English quotation are required. "Save and add another" moves to the next day. One verse per date; saving an existing date's record updates it.
- **Edit or delete:** Verses → search by reference, filter by date, sort, page through. Delete asks for confirmation.
- **Calendar:** filled days have a verse, `+` days are empty, the ringed day is today. Click a day to edit or add.
- **CSV import:** Import → choose a file or paste text. Columns `date,reference,english_quote`, dates as `YYYY-MM-DD`. A preview marks invalid rows, repeated dates and dates that already exist (those are skipped, never overwritten). Up to 500 rows, saved all together or not at all. Sample: `public/sample-verses.csv`.

## 6. Translations

- English is the canonical text in `daily_verses.english_quote` and is never altered.
- Translations are typed in by an admin in the verse form and stored in `verse_translations`. Nothing is machine-translated. If a language has no entry for a date, readers see a clear note and the English original.
- **Versioning:** a translation is unique per verse + language + version label. Two Hindi Bibles are two rows with different version labels, and readers get a version picker when more than one exists. "Reviewed and visible to readers" (the `approved` flag) hides a draft from the public while keeping it for admins.
- **Add a language:** add one line to `src/lib/languages.ts`.
- **Add a licensed Bible API later:** implement `TranslationProvider` in `src/lib/translations.ts` on a trusted server (for example a Supabase Edge Function holding the API key as a secret), write results into `verse_translations`, and keep the browser reading only from the database. No API is integrated or tested in this version, and no API key belongs in frontend code. Check each API's languages, rate limits and licence first.
- **Licensing:** the demo verse (Luke 12:40) uses World English Bible wording, which is public domain. No other translation text is bundled. You are responsible for the licence of anything you enter. Many modern translations (NIV, ESV and others) are copyrighted. Add an attribution line on the site if a translation's licence requires it.

## 7. Deploy (free tiers)

Vercel (config in `vercel.json`) or Netlify (`netlify.toml` and `public/_redirects`):

1. Push the project to a GitHub repository (`.env` is git-ignored).
2. Import it in Vercel or Netlify. Build command `npm run build`, output `dist`.
3. Add the four `VITE_` variables in the host's environment settings, with `VITE_SITE_URL` set to your final address. Redeploy.
4. Custom domain: add it in the host's Domains settings and follow its DNS instructions. Update `VITE_SITE_URL` and redeploy.
5. In Supabase → Authentication → URL Configuration, set the Site URL to your domain.

Free-tier limits to know: Supabase free projects pause after about a week of no activity (the first visit after a pause fails until you resume the project in the dashboard) and have database and bandwidth caps. Vercel's free Hobby plan is for non-commercial use. Check each provider's current terms.

### Verify after deploying

1. `/admin` while signed out redirects to the login page.
2. A non-admin Supabase user who signs in sees "not an administrator".
3. Sign in as admin, add and delete a test verse.
4. In the browser console, a signed-out insert is refused:
   `await fetch(URL + '/rest/v1/daily_verses', {method:'POST', headers:{apikey:KEY,'Content-Type':'application/json'}, body: JSON.stringify({verse_date:'2031-01-01',reference:'x',english_quote:'y'})})` returns a 401/403.

## 8. Logo

The supplied logo was processed into `public/aos-mark.png`, `aos-mark-small.png` (header and admin), `aos-logo-full.png`, and the favicons `favicon.ico`, `icon-32/180/192/512.png`. To replace it, overwrite those files with your own versions of the same names. In dark mode the single-colour mark is lightened with a CSS filter (`.logo-mark`).

## 9. Privacy

No accounts for readers and no analytics or third-party scripts. The only data the browser stores is a list of liked verse dates in `localStorage` (key `aos-liked-verses-v1`), used only to remember your own likes. If storage is blocked, reading and sharing still work. There is no global like count.

## 10. SEO and sharing

Each date has a clean URL, `/YYYY-MM-DD` (with `?lang=kn` for a translation). The page title, description and canonical link update per date in the browser. Crawlers that do not run JavaScript, including many chat and social link previews, see only the generic tags in `index.html`, so individual verses will not always preview correctly. Fixing that needs server-side rendering or an edge function, which is not included. `robots.txt` blocks `/admin`, pages send `noindex`, and `npm run build` writes `sitemap.xml` (it lists every scheduled date if the Supabase variables are set at build time, up to 1000). Rebuild periodically to refresh it. Use an absolute URL for `og:image` once your domain is known.

## 11. Structure

```
src/pages, components, hooks, lib, types   public site
src/admin                                  admin dashboard (lazy-loaded, separate chunk)
supabase/migrations                        SQL: schema, RLS, atomic save function
supabase/tests                             local RLS verification
tests                                      Vitest suites
scripts/postbuild.mjs                      sitemap and robots
```

## 12. Known limitations

- Likes are per browser only.
- The date picker uses the browser's native date control, so its look varies by device.
- Admin screens were verified through component tests and the database through the local PostgreSQL check, not by clicking through a live deployment.

## Future dates, footer, About/Privacy, theme toggle

- **Future verses are hidden from the public.** Readers can open today and earlier dates only. "Today" is the calendar date in `VITE_PRIMARY_TIMEZONE` (default Asia/Kolkata), not the device date. The rule lives in `getVerseByDate` (`src/lib/verses.ts`), which refuses future or invalid dates before any request is made, and the query also adds `verse_date <= today`. The date picker has `max`, the next-day button is disabled at today, and a future URL such as `/2099-01-01` shows a message with a "Go to today's verse" button. The admin dashboard uses `src/admin/api.ts`, which has no such limit, so administrators can still schedule ahead.
- **Optional database enforcement:** run `supabase/migrations/004_optional_hide_future_verses.sql` in the Supabase SQL editor to make the database itself refuse to return future verses to anyone but administrators. Without it, someone calling the Supabase REST API directly with the public key could still read future verses. Verify locally with `bash supabase/tests/run_local_rls_check.sh supabase/tests/local_rls_future_check.sql`. If you change the timezone, change it in that file too.
- **Theme:** `data-theme="light|dark"` on `<html>`. An inline script in `index.html` applies the saved choice (`localStorage` key `aos-theme`) or, on a first visit, the system preference, before the page paints. The header toggle saves an explicit choice, which then takes priority over the system setting. Blocked storage is tolerated (the choice applies for that visit).
- **Privacy policy:** `src/pages/PrivacyPage.tsx` describes only what the code does. It publishes no contact address because none exists in the project; add one there when you have it.
