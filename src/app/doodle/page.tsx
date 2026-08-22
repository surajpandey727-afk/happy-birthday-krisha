'use client';
import { WorldShell } from '@/components/world/WorldShell';
import { NotebookShell } from '@/components/notebook/NotebookShell';

export default function NotebookPage() {
  return (
    <WorldShell
      kicker="paper & pen"
      title="the notebook"
      blurb="write something. draw something. keep it here."
      headline="kicker"
      fullBleed={
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <NotebookShell />
        </div>
      }
    />
  );
}
