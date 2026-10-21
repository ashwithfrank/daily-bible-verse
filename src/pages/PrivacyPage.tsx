import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { config } from '../lib/config';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export const PRIVACY_LAST_UPDATED = 'October 21, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  useDocumentMeta({
    title: 'Privacy Policy | Daily Bible Verse',
    description: 'How the Daily Bible Verse website by AlphaOmega Studio handles information.',
    canonical: `${config.siteUrl}/privacy`,
  });
  const ext = 'underline';
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-2 sm:px-6">
        <article className="rounded-2xl border border-line bg-surface p-5 sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted">Last updated: {PRIVACY_LAST_UPDATED}</p>
          <div className="max-w-prose">
            <Section title="Overview">
              <p>
                This policy explains how the Daily Bible Verse website, a project by AlphaOmega Studio, handles information. It covers the public
                website where you read verses. The administrator dashboard is described separately below because it is only for the people who run the site.
              </p>
              <p>You do not need an account to read, like or share verses, and the public website does not ask you for your name, email address or any other personal details.</p>
            </Section>

            <Section title="Information the website processes">
              <p>When you open the site, your browser loads the page from the hosting service and requests the verse for the chosen date from our database provider. Like any website, these services receive standard technical information that your browser sends with every request, such as your IP address, browser type and the page requested.</p>
              <p>The website itself does not record who you are or which verses you read. It does not use analytics, advertising or tracking services, and it does not load external fonts or scripts.</p>
            </Section>

            <Section title="How information is used">
              <p>Technical information is used only to deliver the page and the verse you asked for. Choices you make on the site (your liked verses and your light or dark theme) are used only to remember your preferences on your own device.</p>
            </Section>

            <Section title="Storage in your browser">
              <p>The website saves two small items in your browser&apos;s local storage:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li><strong>Liked verses:</strong> the dates of verses you have liked. Likes are kept only on your device. They are not sent to our database, and we cannot see them.</li>
                <li><strong>Theme choice:</strong> whether you chose light or dark mode. Until you choose, the site follows your device setting.</li>
              </ul>
              <p>The website does not set cookies of its own. You can clear this information at any time by clearing your browser&apos;s site data, and the site works if your browser blocks storage (your likes and theme choice simply will not be remembered).</p>
              <p>The Share buttons open your device&apos;s share options or copy text to your clipboard. What you share, and with whom, is up to you; the website does not receive it.</p>
            </Section>

            <Section title="Third-party services">
              <ul className="list-disc space-y-1 pl-6">
                <li><strong>GitHub Pages</strong> hosts the website. GitHub may process technical request information under its own privacy statement (<a className={ext} href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener noreferrer" target="_blank">GitHub Privacy Statement</a>).</li>
                <li><strong>Supabase</strong> provides the database that stores the verses and translations, and the sign-in service used by administrators. Supabase may process technical request information under its own policy (<a className={ext} href="https://supabase.com/privacy" rel="noopener noreferrer" target="_blank">Supabase Privacy Policy</a>).</li>
              </ul>
              <p>These providers operate independently, and we do not control their logs or how long they keep them.</p>
            </Section>

            <Section title="Administrator dashboard">
              <p>A separate dashboard lets authorized administrators add and edit verses and translations. Administrators sign in with an email address and password through Supabase Authentication. Their email address and sign-in details are held by Supabase, and their browser keeps a sign-in session in local storage while they are signed in. Visitors are never asked to sign in and cannot create accounts.</p>
              <p>The content stored in the database is Bible text, references, translations and optional internal notes written by administrators. It is not personal information about visitors.</p>
            </Section>

            <Section title="Data retention">
              <p>Likes and theme choice stay in your browser until you clear them. Verse content stays in the database until an administrator removes it. We cannot verify how long GitHub or Supabase keep their technical logs; that is set by those providers.</p>
            </Section>

            <Section title="Security and limitations">
              <p>The website is served over HTTPS, and the database is set up so that the public can only read verses while only authorized administrators can change content. No online service can be guaranteed completely secure, and we cannot promise that third-party services will always be available or error free.</p>
            </Section>

            <Section title="Children's privacy">
              <p>The website is open to readers of all ages. It does not ask visitors for personal information, and we do not knowingly collect personal information from children. If you are a parent or guardian and have a concern, please contact us using the method described below.</p>
            </Section>

            <Section title="Changes to this policy">
              <p>We may update this policy if the website changes, for example if features that handle information are added. The date at the top shows when it was last updated.</p>
            </Section>

            <Section title="Questions">
              <p>This website does not currently publish a contact address. Please raise privacy questions with AlphaOmega Studio through the channel where you found this website. A dedicated contact method will be listed here once available.</p>
            </Section>
          </div>
          <Link to="/" className="btn mt-8"><ArrowLeft size={18} aria-hidden /> Back to today&apos;s verse</Link>
        </article>
      </main>
      <Footer />
    </>
  );
}
