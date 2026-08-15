'use client';
import dynamic from 'next/dynamic';

const LiquidGame = dynamic(() =>
  import('@/games/liquid/LiquidGame').then((m) => m.LiquidGame),
  { ssr: false, loading: () => <GameLoading /> }
);

function GameLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(120%_120%_at_50%_0%,var(--color-pink-wash),var(--color-cream))]">
      <p className="font-hand text-3xl text-ink-soft">pouring something together . . .</p>
    </div>
  );
}

export default function LiquidPage() {
  return <LiquidGame />;
}