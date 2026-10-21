import { Link } from 'react-router-dom';

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="AlphaOmega Studio — home">
        <img src="/aos-mark-small.png" alt="" width={40} height={38} className="logo-mark h-9 w-auto shrink-0" />
        <span className="truncate text-lg font-bold tracking-tight text-ink sm:text-xl">AlphaOmega Studio</span>
      </Link>
      {children}
    </header>
  );
}
