'use client';
import { useEffect, useState } from 'react';
import { persistence } from '@/lib/persistence';

/** First visit is true only the very first time the app is opened. */
export function useIsFirstVisit(): boolean {
  const [first, setFirst] = useState(true);
  useEffect(() => {
    const visited = persistence.get<boolean>('visited');
    if (visited) {
      setFirst(false);
    } else {
      persistence.set('visited', true);
      setFirst(true);
    }
  }, []);
  return first;
}