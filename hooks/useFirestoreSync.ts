import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useAuth } from '../context/AuthContext';
import { syncFromFirestore } from '../services/firestoreService';

/** Имя события, которое рассылается после успешной синхронизации (экраны перечитывают данные). */
export const SYNC_EVENT = 'compass:sync';

const SYNC_INTERVAL_MS = 60_000;

/**
 * Фоновая синхронизация с Firestore, чтобы данные профиля (граф/стрик/профиль) были
 * актуальны на всех устройствах. Запускается при входе/смене аккаунта, при возврате
 * приложения на передний план и периодически (каждые 60 с). После каждой синхронизации
 * рассылает `compass:sync`, чтобы открытые экраны молча перечитали данные.
 */
export const useFirestoreSync = (): void => {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const lastUid = useRef<string | null>(null);

  useEffect(() => {
    if (!uid || uid === 'guest') return;

    let cancelled = false;

    const run = async () => {
      try {
        await syncFromFirestore(uid);
        if (!cancelled) window.dispatchEvent(new Event(SYNC_EVENT));
      } catch (e) {
        console.warn('[sync] failed:', e);
      }
    };

    // Первичная синхронизация при входе и при смене аккаунта.
    if (lastUid.current !== uid) {
      lastUid.current = uid;
      void run();
    }

    // Периодическая синхронизация.
    const interval = setInterval(() => void run(), SYNC_INTERVAL_MS);

    // Возврат на передний план: веб — focus/visibilitychange, нативно — resume.
    const onFocus = () => void run();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void run();
    };
    const appListener = Capacitor.isNativePlatform()
      ? App.addListener('resume', onFocus)
      : null;

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      appListener?.then((listener) => listener.remove()).catch(() => {});
    };
  }, [uid]);
};
