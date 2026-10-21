import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { isLiked, toggleLike } from '../lib/likes';

export function LikeButton({ verseDate }: { verseDate: string }) {
  const [liked, setLiked] = useState(() => isLiked(verseDate));
  useEffect(() => setLiked(isLiked(verseDate)), [verseDate]);
  return (
    <button type="button" className="btn" aria-pressed={liked} onClick={() => setLiked(toggleLike(verseDate))}>
      <Heart size={18} aria-hidden className={liked ? 'fill-brand text-brand' : ''} />
      {liked ? 'Liked' : 'Like'}
    </button>
  );
}
