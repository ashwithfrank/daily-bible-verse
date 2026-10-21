import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import { shareVerse, type ShareInput } from '../lib/share';

export function ShareButton({ input }: { input: ShareInput }) {
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(t);
  }, [message]);

  const onClick = async () => {
    const result = await shareVerse(input);
    if (result === 'copied') setMessage('Verse copied to clipboard');
    else if (result === 'failed') setMessage('Sharing is not available here. Copy the link from the address bar.');
  };

  return (
    <div className="relative">
      <button type="button" className="btn" onClick={onClick}>
        <Share2 size={18} aria-hidden />
        Share
      </button>
      <p role="status" aria-live="polite" className="absolute bottom-full right-0 mb-2 w-max max-w-[16rem] rounded-md bg-ink px-3 py-1.5 text-xs text-paper shadow empty:hidden">
        {message}
      </p>
    </div>
  );
}
