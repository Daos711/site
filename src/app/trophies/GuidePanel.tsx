'use client';
import { useState } from 'react';
import { checkpoint, evaluateRoute, routeEntity, type RouteDefinition, type RouteStep } from '@/lib/trophies/routes';
import { valueAt } from '@/lib/trophies/selectors';
import { readField, type TrackerEvent, type JsonValue } from '@/lib/trophies/events';
import type { GameCatalog } from '@/lib/trophies/types';
import type { ChangeInput } from '@/lib/trophies/preset';
import styles from './trophies.module.css';

const labels = { done: 'Выполнено', available: 'Доступно', blocked: 'Условия не выполнены', unavailable: 'Недоступно в этой ветке', check: 'Требует проверки', postponed: 'Отложено' };
export default function GuidePanel({ game, definition, events, runId, chapter, disabled, change, setChapter }: {
  game: GameCatalog; definition: RouteDefinition; events: readonly TrackerEvent[]; runId: string; chapter: number; disabled: boolean;
  change: (input: ChangeInput) => Promise<unknown>; setChapter: (chapter: number) => void;
}) {
  const [transition, setTransition] = useState<RouteStep | null>(null);
  const [mode, setMode] = useState('next'), [spoilers, setSpoilers] = useState(false), [query, setQuery] = useState('');
  const location = String(valueAt(events, game.id, runId, 'run', 'location') || '');
  const route = evaluateRoute({ game, definition, events, runId, chapter, location, spoilers });
  const campCell = readField(events, { gameId: game.id, runId, entityId: 'run', field: 'campMembership' });
  const campValue = campCell.conflict ? 'conflict' : String(campCell.value || 'none');
  const setRun = (field: string, value: JsonValue) => change({ gameId: game.id, runId, entityId: 'run', field, value });
  const byId = new Map(route.all.map(s => [s.node.id, s]));
  const rules = definition.nodes.filter(n => spoilers || (n.chapter || 0) <= chapter).flatMap(n => [...n.conditions || [], ...n.blockers || []]);
  const extraFields = [...new Set(rules.filter(r => !r.entityId && !r.field.startsWith('action:')).map(r => r.field))].filter(f => !['chapter','campMembership','difficulty','role','sleep','permadeath'].includes(f));
  const displayed = (mode === 'nearby' ? route.nearby : mode === 'missable' ? route.warnings : mode === 'next' ? route.nearby.filter(s => s.node.id !== route.next?.node.id).slice(0, 8) : route.visible)
    .filter(step => !query || [step.title, step.instruction, step.item?.teacher].join(' ').toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru')));
  const setStep = (step: RouteStep, field: string, value: JsonValue) => change({ gameId: game.id, runId: step.item?.scope === 'psn' || step.item?.scope === 'global' ? null : runId, entityId: routeEntity(step.node), field, value });
  function card(step: RouteStep, recommended = false) {
    const scope = step.item && step.item.scope !== 'run' ? null : runId;
    const postponed = valueAt(events, game.id, scope, routeEntity(step.node), 'postponed') === true;
    const hiddenDependency = (id: string) => { const dep = byId.get(id); return dep && !spoilers && (dep.node.chapter ?? dep.item?.spoilerChapter ?? dep.item?.chapter ?? 0) > chapter; };
    return <article key={step.node.id} className={recommended ? styles.nextStep : styles.routeStep} data-route-id={step.node.id} data-route-status={step.status}>
      <div className={styles.badges}><span>{recommended ? 'Следующий рекомендуемый шаг' : labels[step.status]}</span>{step.node.missable && <span className={styles.missable}>Можно пропустить</span>}{step.node.required && <span>Для платины</span>}</div>
      <h3>{step.title}</h3><p>{step.instruction}</p>
      {(step.item?.teacher || step.node.locationIds.length > 0) && <p className={styles.hint}>{[step.item?.teacher, ...step.node.locationIds.map(id => definition.locations.find(l => l.id === id)?.name)].filter(Boolean).join(' · ')}</p>}
      {step.item?.conditions && <p><strong>Условия:</strong> {step.item.conditions}</p>}
      {step.reasons.length > 0 && <ul>{step.reasons.map((reason, i) => <li key={i}>{reason.startsWith('Сначала:') && step.node.requires.some(hiddenDependency) ? 'Сначала выполните условие следующей главы (скрыто).' : reason}</li>)}</ul>}
      {step.node.rewards?.length ? <p>Награды: {step.node.rewards.join(', ')}</p> : null}
      {step.item?.steps?.map(stage => <label className={styles.checkline} key={stage.id}><input type="checkbox" aria-label={stage.label + ': ' + step.title} checked={valueAt(events, game.id, runId, routeEntity(step.node), 'stage:' + stage.id) === true} disabled={disabled} onChange={e => void setStep(step, 'stage:' + stage.id, e.target.checked)} />{stage.label}</label>)}
      <div className={styles.actions}>
        <button className={recommended ? styles.primary : ''} disabled={disabled} onClick={() => { if (step.node.transition && step.status !== 'done') setTransition(step); else void setStep(step, 'status', step.status === 'done' ? 'todo' : 'done'); }}>{step.status === 'done' ? 'Отменить выполнение' : ['blocked','unavailable','check'].includes(step.status) ? 'Подтвердить: уже выполнено в игре' : 'Подтвердить выполнение'}</button>
        {step.status !== 'done' && <button disabled={disabled} onClick={() => void setStep(step, 'postponed', !postponed)}>{postponed ? 'Вернуть в маршрут' : 'Отложить'}</button>}
      </div>
      {step.item && (step.item.category === 'lessons' || step.item.category === 'maps') && <p className={styles.hint}>Подтверждение меняет текущее сохранение. Общую историю изучения или покупки отмечайте отдельно в чек-листе.</p>}
      <details className={styles.instruction}><summary>Трофеи, альтернативы и источники</summary>
        <p>{step.node.trophyIds.length ? step.node.trophyIds.map(id => game.items.find(i => i.id === id)?.name || id).join(' · ') : 'Связь с конкретным трофеем ещё не установлена.'}</p>
        {(step.node.alternatives || []).map((text, i) => <p key={i}>{text}</p>)}
        {step.node.anyOf?.map((group,i) => <p key={i}>Вариант {i + 1}: {group.map(id => hiddenDependency(id) ? 'Шаг будущей главы' : byId.get(id)?.title || id).join(' → ')}</p>)}
        <p className={styles.hint}>{step.item?.gameVersion ? `Версия: ${step.item.gameVersion}` : 'Версия источника не установлена.'} Трофеи PSN подтверждаются отдельно.</p>
        <div className={styles.sourceLinks}>{(step.node.sources || step.item?.sources || []).map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name}{source.author ? ` · ${source.author}` : ''} ↗</a>)}</div>
      </details>
    </article>;
  }
  const checks = transition ? checkpoint({ game, definition, events, runId, chapter, location }) : null;
  return <section className={styles.guide} data-testid="interactive-guide">
    {route.contextConflicts.length > 0 && <div className={styles.alert} role="alert"><strong>Уточните состояние персонажа перед продолжением.</strong><p>Разные отметки: {route.contextConflicts.join(', ')}. Выберите актуальные значения в блоке расхождений. Рекомендация следующего шага приостановлена.</p></div>}
    {mode === 'next' && (route.next ? card(route.next, true) : <div className={styles.panel}><h3>Следующий шаг требует уточнения</h3><p>Доступные проверенные шаги выполнены или отложены. Проверьте главу, локацию и условия в полном маршруте. Это не подтверждает получение платины.</p></div>)}
    <details className={styles.guideContext}><summary>Глава {chapter} · {definition.locations.find(l => l.id === location)?.name || "Локация не выбрана"} · изменить</summary>
    <div className={styles.formGrid}>
      <label>Сейчас в главе<select aria-label="Глава в гайде" value={chapter} onChange={e => setChapter(Number(e.target.value))}>{game.chapters.map(n => <option key={n} value={n}>{n}</option>)}</select></label>
      <label>Где вы сейчас<select aria-label="Текущая локация" value={location} onChange={e => void setRun('location', e.target.value)}><option value="">Не выбрана</option>{definition.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
      <label>Лагерь персонажа в игре<select aria-label="Лагерь персонажа" value={campValue} onChange={e => void setRun('campMembership', e.target.value)}>{campCell.conflict && <option value="conflict" disabled>Нужно уточнить: разные отметки</option>}<option value="none">Пока не вступил</option><option value="old">Старый лагерь</option><option value="new">Новый лагерь</option><option value="swamp">Болотный лагерь</option></select></label>
    </div>
    <p className={styles.hint}>Выполнено {route.done} из {route.total} действий маршрута. Прогресс платины выше учитывает только вручную подтверждённые трофеи PSN. План вступления не меняет фактический лагерь.</p>
    {extraFields.length > 0 && <details className={styles.instruction}><summary>Проверить условия персонажа</summary>{extraFields.map(field => { const fieldRules = rules.filter(r => r.field === field); const values = [...new Set(fieldRules.map(r => r.value))]; return <label key={field}>{fieldRules[0].label}<select value={JSON.stringify(valueAt(events, game.id, runId, 'run', field) ?? null)} onChange={e => void setRun(field, JSON.parse(e.target.value))}><option value="null">Не проверено</option>{values.map(value => <option key={String(value)} value={JSON.stringify(value)}>{typeof value === 'boolean' ? value ? 'Да' : 'Нет' : String(value)}</option>)}{values.every(v => typeof v === 'boolean') && !values.includes(false) && <option value="false">Нет</option>}</select></label>; })}</details>}
    </details>
    {route.warnings.some(s => s.node.verified && s.status === 'unavailable') && <div className={styles.alert} role="alert">В этой ветке есть недоступные действия. Откройте пропускаемые шаги: причины указаны в карточках. Для альтернативной ветки используйте другое сохранение.</div>}
    {route.warnings.some(s => s.node.verified && s.status !== 'unavailable') && <div className={styles.notice}>До сюжетного перехода проверьте пропускаемые действия: {route.warnings.filter(s => s.node.verified && s.status !== 'unavailable').length}. <button onClick={() => setMode('missable')}>Посмотреть</button></div>}
    <nav className={styles.tabs} aria-label="Вид маршрута">{[['next','Продолжить'],['nearby','Рядом'],['all','Полный маршрут'],['missable','Пропускаемые']].map(([id,name]) => <button key={id} aria-pressed={mode === id} onClick={() => setMode(id)}>{name}</button>)}</nav>
    <label className={styles.checkline}><input type="checkbox" checked={spoilers} onChange={e => setSpoilers(e.target.checked)} />Показывать будущие главы</label>
    {mode !== 'next' && <input className={styles.routeSearch} aria-label="Поиск по маршруту" placeholder="Найти действие…" value={query} onChange={e => setQuery(e.target.value)} />}

    <h2>{mode === 'next' ? 'Полезное поблизости' : mode === 'nearby' ? 'Действия в текущей локации' : mode === 'missable' ? 'Пропускаемые действия' : 'Маршрут по главам и условиям'}</h2>
    {!displayed.length && <p className={styles.hint}>{!location && ['next','nearby'].includes(mode) ? 'Выберите локацию, чтобы увидеть действия рядом.' : 'Подходящих действий нет. Проверьте фильтр и скрытые главы.'}</p>}
    {displayed.map(step => card(step))}
    <details className={styles.panel}><summary>Накопительные достижения</summary>{game.items.filter(i => i.category === 'counters').map(item => { const count = Number(valueAt(events, game.id, null, item.id, 'count') || 0); return <div className={styles.backup} key={item.id}><span>{item.name}: <strong>{count}{item.target ? `/${item.target}` : ''}</strong></span><button disabled={disabled} aria-label={`Добавить к счётчику ${item.name}`} onClick={() => void change({ gameId: game.id, runId: null, entityId: item.id, field: 'count', value: 1, kind: 'increment' })}>+1</button></div>; })}</details>
    {transition && checks && <div className={styles.modalBackdrop}><section className={styles.modal} role="dialog" aria-modal="true" aria-label="Проверка перед сюжетным решением"><h2>Перед действием: {transition.title}</h2><p><strong>Сделайте отдельное сохранение на PS5.</strong> Выполнение может закрыть альтернативную ветку. Если решение уже принято в игре, здесь можно подтвердить факт.</p><p className={styles.hint}>Отсутствие отметки не доказывает, что пункт обязательно закрывается при этом решении. Сроки и спорные сведения указаны в карточках.</p><h3>Подтверждённые сроки этой главы</h3><ul>{checks.required.filter(s => s.node.id !== transition.node.id).map(s => <li key={s.node.id}>{s.title}{!s.node.verified ? ' — требует проверки' : ''}</li>)}</ul><h3>Пропускаемые предметы и цепочки</h3><ul>{checks.missable.filter(s => s.node.id !== transition.node.id).map(s => <li key={s.node.id}>{s.title}{s.reasons.length ? ': ' + s.reasons.join(' ') : ''}</li>)}</ul><details><summary>Уроки для сверки: {checks.lessons.length}</summary><ul>{checks.lessons.map(s => <li key={s.node.id}>{s.title}</li>)}</ul></details><p>Запись трофея PSN и состояние основного сохранения остаются отдельными. Отметьте полученный трофей в чек-листе, затем загрузите нужную ветку в игре и выберите её в трекере.</p><div className={styles.actions}><button className={styles.primary} disabled={disabled} onClick={() => { void setStep(transition, 'status', 'done'); setTransition(null); }}>Подтвердить выполненное действие</button><button onClick={() => setTransition(null)}>Вернуться к проверке</button></div></section></div>}
  </section>;
}
