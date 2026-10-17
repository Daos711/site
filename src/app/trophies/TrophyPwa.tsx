'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import styles from './trophies.module.css';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function TrophyPwa({ beforeReload }: { beforeReload?: () => Promise<void> }) {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [message, setMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const reloadRequested = useRef(false);

  useEffect(() => {
    let alive = true;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    const watchState = () => {
      if (alive && installing?.state === 'installed' && navigator.serviceWorker.controller) {
        setWaiting(registration?.waiting ?? installing);
      }
    };
    const watchUpdate = () => {
      installing?.removeEventListener('statechange', watchState);
      installing = registration?.installing ?? null;
      installing?.addEventListener('statechange', watchState);
    };
    const reload = () => {
      if (reloadRequested.current) window.location.reload();
    };
    const check = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) void registration?.update().catch(() => {});
    };
    const prompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const installed = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', prompt);
    window.addEventListener('appinstalled', installed);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.addEventListener('controllerchange', reload);
      // The root worker URL permits the clean /trophies path without a custom
      // Service-Worker-Allowed header. Its scope remains restricted to trophies.
      void navigator.serviceWorker.register('/trophies-sw.js', { scope: '/trophies', updateViaCache: 'none' }).then(value => {
        if (!alive) return;
        registration = value;
        setWaiting(value.waiting);
        value.addEventListener('updatefound', watchUpdate);
        watchUpdate();
        document.addEventListener('visibilitychange', check);
        window.addEventListener('online', check);
      }).catch(() => {
        if (alive && !navigator.serviceWorker.controller) setMessage('Офлайн-версия пока недоступна.');
      });
    }
    return () => {
      alive = false;
      window.removeEventListener('beforeinstallprompt', prompt);
      window.removeEventListener('appinstalled', installed);
      window.removeEventListener('online', check);
      document.removeEventListener('visibilitychange', check);
      installing?.removeEventListener('statechange', watchState);
      registration?.removeEventListener('updatefound', watchUpdate);
      if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('controllerchange', reload);
    };
  }, []);

  const update = async () => {
    if (!waiting || updating) return;
    setUpdating(true);
    setMessage('');
    try {
      await beforeReload?.();
      const event = new Event('trophies:before-reload', { cancelable: true });
      if (!window.dispatchEvent(event)) {
        setMessage('Сначала сохраните текущие изменения.');
        setUpdating(false);
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration('/trophies');
      reloadRequested.current = true;
      // Another tab may already have activated or superseded the waiting release.
      if (registration?.waiting) registration.waiting.postMessage({ type: 'TROPHIES_APPLY_UPDATE' });
      else window.location.reload();
    } catch {
      setMessage('Сохранение не завершено. Повторите обновление позже.');
      setUpdating(false);
    }
  };

  const install = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch {
      setMessage('Добавьте приложение через меню браузера.');
    } finally {
      setInstallPrompt(null);
    }
  };

  return <span>
    {waiting && <button type="button" className={styles.pwaButton} onClick={() => void update()} disabled={updating}><RefreshCw size={14} />{updating ? 'Обновляем…' : 'Обновить приложение'}</button>}
    {!waiting && installPrompt && <button type="button" className={styles.pwaButton} onClick={() => void install()}><Download size={14} />Установить</button>}
    {message && <span className={styles.hint} role="status">{message}</span>}
  </span>;
}
