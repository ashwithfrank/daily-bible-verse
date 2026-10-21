import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { config } from '../lib/config';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function AboutPage() {
  useDocumentMeta({
    title: 'About Daily Bible Verse | AlphaOmega Studio',
    description: 'Daily Bible Verse is a simple place to pause, reflect, and find inspiration through the Word of God. A project by AlphaOmega Studio.',
    canonical: `${config.siteUrl}/about`,
  });
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-2 sm:px-6">
        <article className="rounded-2xl border border-line bg-surface p-5 sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight">About Daily Bible Verse</h1>
          <div className="mt-6 max-w-prose space-y-4 text-lg leading-relaxed">
            <p>Daily Bible Verse is a simple place to pause, reflect, and find inspiration through the Word of God.</p>
            <p>
              Our goal is to make reading and sharing a daily Bible verse simple and accessible. You can explore verses by date,
              read the translations that are available for each verse, and share meaningful passages with friends and family.
              Not every verse is available in every language, and translations are added as they are reviewed.
            </p>
            <p>Daily Bible Verse is a project by AlphaOmega Studio, created with the aim of making Scripture easier to discover and share in everyday life.</p>
            <p>Take a moment, read a verse, reflect on its message, and share the encouragement with someone who might need it.</p>
          </div>
          <Link to="/" className="btn mt-8"><ArrowLeft size={18} aria-hidden /> Back to today&apos;s verse</Link>
        </article>
      </main>
      <Footer />
    </>
  );
}
