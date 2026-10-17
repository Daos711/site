'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';
import { createTrackerStore } from './storage';
import { createSupabaseEventAdapter, createSyncController } from './sync';
export function useTracker(workspaceId: string, ownerId: string | null) {
  const [store] = useState(() => createTrackerStore({ workspaceId }));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [controller, setController] = useState<ReturnType<typeof createSyncController> | null>(null);
  useEffect(() => {
    let alive = true;
    let sync: ReturnType<typeof createSyncController> | null = null;
    void store.init().then(() => {
      if (!alive || !ownerId) return;
      sync = createSyncController(store, createSupabaseEventAdapter(supabase), { ownerId });
      setController(sync); void sync.sync();
    }).catch(() => { /* The store exposes initialization errors. */ });
    return () => { alive = false; sync?.dispose(); store.dispose(); };
  }, [store, ownerId]);
  return { store, snapshot, syncNow: () => controller?.sync() };
}
