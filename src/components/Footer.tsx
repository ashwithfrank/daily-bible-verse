import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../lib/config';
import { shareWebsite } from '../lib/share';

const linkClass =
  'inline-flex min-h-[44px] items-center rounded-md px-1 text-sm font-medium text-brand underline-offset-4 hover:text-ink hover:underline';

export function Footer() {
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(t);
  }, [message]);

  const onShare = async () => {
    const result = await shareWebsite(`${config.siteUrl}/`);
    if (result === 'copied') setMessage('Website link copied to clipboard');
    else if (result === 'failed') setMessage('Sharing is not available here. Copy the link from the address bar.');
  };

  return (
    <footer className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-6">
      <div className="border-t border-line pt-8">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-ink">Daily Bible Verse</p>
            <p className="mt-1 text-sm text-muted">A little Scripture, a little peace, every day.</p>
            <figure className="mt-5 border-l-2 border-sage pl-4">
              <blockquote className="font-serif text-base leading-relaxed text-ink">
                <p>&ldquo;Your word is a lamp to my feet and a light to my path.&rdquo;</p>
              </blockquote>
              <figcaption className="mt-1 text-sm text-muted">Psalm 119:105</figcaption>
            </figure>
          </div>

          <nav aria-label="Footer" className="sm:justify-self-end">
            <ul className="flex flex-wrap gap-x-5 gap-y-1 sm:flex-col sm:gap-y-0">
              <li><Link to="/about" className={linkClass}>About</Link></li>
              <li><Link to="/privacy" className={linkClass}>Privacy Policy</Link></li>
              <li>
                <span className="relative inline-block">
                  <button type="button" onClick={() => void onShare()} className={linkClass}>Share Website</button>
                  <span role="status" aria-live="polite" className="absolute bottom-full left-0 mb-1 w-max max-w-[16rem] rounded-md bg-ink px-3 py-1.5 text-xs text-paper shadow empty:hidden">
                    {message}
                  </span>
                </span>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-1 border-t border-line pt-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Made with ♥ by AlphaOmega Studio</p>
          <p>&copy; {new Date().getFullYear()} AlphaOmega Studio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
