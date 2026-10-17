'use client';

import { useEffect, useId, useState, useSyncExternalStore, type InputHTMLAttributes } from 'react';
import { createDraftController } from '@/lib/trophies/drafts';

export interface AutosaveInputProps {
  label: string;
  value: string;
  heads: string[];
  save: (value: string, basis: string[]) => Promise<string>;
  storageKey: string;
  multiline?: boolean;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
}

function Editor({ label, value, heads, save, storageKey, multiline, type = 'text' }: AutosaveInputProps) {
  const id = useId();
  const [controller] = useState(() => createDraftController({ storageKey, value, heads, save }));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => { controller.updateSource(value, heads, save); }, [controller, value, heads, save]);
  useEffect(() => {
    controller.init();
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!controller.hasUnsaved()) return;
      event.preventDefault(); event.returnValue = '';
    };
    const beforeReload = (event: Event) => { if (controller.hasUnsaved()) event.preventDefault(); };
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('trophies:before-reload', beforeReload);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('trophies:before-reload', beforeReload);
      controller.dispose();
    };
  }, [controller]);
  const fieldStyle = { display: 'block', width: '100%', minHeight: 44, boxSizing: 'border-box' as const, border: '1px solid var(--border, #394253)', borderRadius: 10, padding: '10px 12px', background: 'var(--background, #111722)', color: 'inherit', font: 'inherit' };
  const status = state.pending ? 'Сохраняется…' : state.phase === 'error' ? 'Не сохранено' : state.dirty ? 'Есть несохранённый текст' : state.phase === 'saved' ? 'Сохранено на устройстве' : 'Сохраняется автоматически';
  return <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
    <label htmlFor={id}>{label}</label>
    {multiline
      ? <textarea id={id} aria-describedby={id + '-status'} rows={4} value={state.text} disabled={!state.ready} maxLength={32768} onChange={event => controller.edit(event.target.value)} onBlur={() => { void controller.flush(); }} style={{ ...fieldStyle, resize: 'vertical' }} />
      : <input id={id} aria-describedby={id + '-status'} type={type} value={state.text} disabled={!state.ready} maxLength={32768} onChange={event => controller.edit(event.target.value)} onBlur={() => { void controller.flush(); }} style={fieldStyle} />}
    <small id={id + '-status'} role="status" aria-live="polite" style={{ color: state.phase === 'error' ? '#ffb4b4' : 'var(--muted, #a9b3c5)' }}>{status}</small>
    {(state.error || state.recoveryError) && <div role="alert" style={{ color: '#ffb4b4', fontSize: 13 }}>{state.error || state.recoveryError}</div>}
    {state.phase === 'error' && <button type="button" onClick={() => { void controller.flush(); }} style={{ minHeight: 44, justifySelf: 'start', border: '1px solid currentColor', borderRadius: 8, padding: '8px 12px', color: 'inherit', background: 'transparent' }}>Повторить сохранение</button>}
  </div>;
}

export default function AutosaveInput(props: AutosaveInputProps) {
  // Switching a run/save/account cannot reuse another field's editing basis.
  return <Editor key={props.storageKey} {...props} />;
}
