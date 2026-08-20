'use client';
import { WorldShell } from '@/components/world/WorldShell';
import { NotebookShell } from '@/components/notebook/NotebookShell';

export default function NotebookPage() {
  return (
    <WorldShell kicker="paper & pen" title="the notebook" blurb="write something. draw something. keep it here.">
      <NotebookShell />
    </WorldShell>
  );
}
