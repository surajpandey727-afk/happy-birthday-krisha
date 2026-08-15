'use client';
import dynamic from 'next/dynamic';

const UntangleGame = dynamic(() =>
  import('@/games/untangle/UntangleGame').then((m) => m.UntangleGame),
  { ssr: false, loading: () => <GameLoading /> }
);

function GameLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(120%_120%_at_50%_0%,var(--color-pink-wash),var(--color-cream))]">
      <p className="font-hand text-3xl text-ink-soft">untangling the day . . .</p>
    </div>
  );
}

export default function UntanglePage() {
  return <UntangleGame />;
}