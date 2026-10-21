import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function NotFound() {
  useDocumentMeta({ title: 'Page not found — AlphaOmega Studio', noindex: true });
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">This page does not exist</h1>
        <p className="mt-3 text-muted"><Link className="underline" to="/">Read today&apos;s verse</Link></p>
      </main>
    </>
  );
}
