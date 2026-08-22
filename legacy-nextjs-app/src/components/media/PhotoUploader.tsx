'use client';
import { useRef, useState } from 'react';
import { sound } from '@/lib/sounds';
import { pushToast } from '@/lib/eggBus';

type Status = 'idle' | 'picked' | 'uploading' | 'error';

/** Adds a photo to the archive — resizes/archives it server-side (see
 * src/app/api/upload-photo/route.ts) and appends it to the manifest. Asks
 * for a caption up front rather than promising an automatic one: writing a
 * real caption means actually looking at the photo, which is honest work
 * worth doing deliberately (by whoever's uploading, or ask Claude to caption
 * a batch afterward the same way the rest of the archive was captioned),
 * not a background API call this site doesn't have wired up. */
export function PhotoUploader({ onUploaded }: { onUploaded?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const reset = () => {
    setFile(null);
    setCaption('');
    setStatus('idle');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const onPick = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setStatus('picked');
    setError('');
  };

  const upload = async () => {
    if (!file) return;
    setStatus('uploading');
    sound.tap();
    try {
      const form = new FormData();
      form.append('file', file);
      if (caption.trim()) form.append('caption', caption.trim());
      const res = await fetch('/api/upload-photo', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'upload failed');
      sound.success();
      pushToast('added to the wall.');
      reset();
      onUploaded?.();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'something went wrong');
    }
  };

  if (status === 'idle') {
    return (
      <label className="font-nebulica shrink-0 cursor-pointer rounded-full border border-brown-warm/50 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-parchment-dim transition-colors hover:bg-brown-warm/15">
        add a photo
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </label>
    );
  }

  return (
    <div className="card-tactile flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <p className="font-monigue min-w-0 flex-1 truncate text-sm italic text-muted">{file?.name}</p>
      <input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="a caption for this one (optional)"
        disabled={status === 'uploading'}
        className="w-full min-w-0 flex-1 rounded-full border border-brown-warm/30 bg-surface/60 px-3 py-1.5 text-sm text-parchment placeholder:text-muted-dim outline-none focus:border-royal-vivid/50 sm:w-56"
      />
      <div className="flex shrink-0 gap-2">
        <button
          onClick={upload}
          disabled={status === 'uploading'}
          className="font-nebulica rounded-full bg-royal-vivid/20 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-royal-vivid transition-colors hover:bg-royal-vivid/30 disabled:opacity-50"
        >
          {status === 'uploading' ? 'adding…' : 'add it'}
        </button>
        <button
          onClick={reset}
          disabled={status === 'uploading'}
          className="font-nebulica rounded-full border border-brown-warm/40 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-muted-dim transition-colors hover:bg-brown-warm/10 disabled:opacity-50"
        >
          cancel
        </button>
      </div>
      {status === 'error' && <p className="font-monigue text-sm italic text-brown-warm sm:basis-full">{error}</p>}
    </div>
  );
}
