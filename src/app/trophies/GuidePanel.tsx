'use client';

import { useState } from 'react';
import { checkpoint, evaluateRoute, routeEntity, type RouteDefinition, type RouteStep } from '@/lib/trophies/routes';
import { valueAt } from '@/lib/trophies/selectors';
import { readField, type TrackerEvent, type JsonValue } from '@/lib/trophies/events';
import type { GameCatalog } from '@/lib/trophies/types';
import type { ChangeInput } from '@/lib/trophies/preset';
import styles from './trophies.module.css';

const labels = {
  done: 'Выполнено', available: 'Условия выполнены', blocked: 'Сначала выполните условия',
  unavailable: 'Недоступно в этой ветке', check: 'Нужно уточнить условия', postponed: 'Отложено',
};

export default function GuidePanel({ game, definition, events, runId, chapter, disabled, change, complete, setChapter }: {
  game: GameCatalog; definition: RouteDefinition; events: readonly TrackerEvent[]; runId: string; chapter: number; disabled: boolean;
  change: (input: ChangeInput) => Promise<unknown>;
  complete: (step: RouteStep, done: boolean) => Promise<unknown>;
  setChapter: (chapter: number) => void;
}) {
  const [transition, setTransition] = useState<RouteStep | null>(null);
  const [completionError, setCompletionError] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [mode, setMode] = useState('nearby'), [spoilers, setSpoilers] = useState(false), [query, setQuery] = useState('');
  const location = String(valueAt(events, game.id, runId, 'run', 'location') || '');
  const route = evaluateRoute({ game, definition, events, runId, chapter, location, spoilers });
  const byId = new Map(route.all.map(step => [step.node.id, step]));
  const planId = valueAt(events, game.id, runId, 'run', 'nextAction');
  const planned = typeof planId === 'string' ? byId.get(planId) : undefined;
  const visibleInChapter = (step: RouteStep) => (step.node.chapter ?? step.item?.spoilerChapter ?? step.item?.chapter ?? 0) <= chapter;
  const isPostponed = (step: RouteStep) => valueAt(events, game.id, step.item && step.item.scope !== 'run' ? null : runId, routeEntity(step.node), 'postponed') === true;
  const primary = route.contextConflicts.length === 0 && planned && planned.status !== 'done' && !isPostponed(planned) && (spoilers || visibleInChapter(planned)) ? planned : route.next;
  const campCell = readField(events, { gameId: game.id, runId, entityId: 'run', field: 'campMembership' });
  const campValue = campCell.conflict ? 'conflict' : String(campCell.value || 'none');
  const setRun = (field: string, value: JsonValue) => change({ gameId: game.id, runId, entityId: 'run', field, value });
  const rules = definition.nodes.filter(node => spoilers || (node.chapter || 0) <= chapter).flatMap(node => [...node.conditions || [], ...node.blockers || []]);
  const extraFields = [...new Set(rules.filter(rule => !rule.entityId && !rule.field.startsWith('action:')).map(rule => rule.field))]
    .filter(field => !['chapter', 'campMembership', 'difficulty', 'role', 'sleep', 'permadeath'].includes(field));
  const nearbyWithRecommendation = route.next ? [route.next, ...route.nearby.filter(step => step.node.id !== route.next!.node.id)] : route.nearby;
  const displayed = (mode === 'nearby' ? nearbyWithRecommendation : mode === 'missable' ? route.warnings : route.visible)
    .filter(step => step.node.id !== primary?.node.id)
    .filter(step => !query || [step.title, step.instruction, step.item?.teacher].join(' ').toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru')));
  const setStep = (step: RouteStep, field: string, value: JsonValue) => change({
    gameId: game.id, runId: step.item?.scope === 'psn' || step.item?.scope === 'global' ? null : runId,
    entityId: routeEntity(step.node), field, value,
  });
  const hiddenDependency = (id: string) => { const dependency = byId.get(id); return dependency && !spoilers && !visibleInChapter(dependency); };
  const reasonText = (step: RouteStep, reason: string) => reason.startsWith('Сначала:') && step.node.requires.some(hiddenDependency)
    ? 'Сначала выполните условие следующей главы (скрыто).' : reason;

  async function finish(step: RouteStep, done: boolean) {
    setCompletionError('');
    try {
      const saved = await complete(step, done);
      if (saved === false) { setCompletionError('Не удалось сохранить отметку. Повторите попытку.'); return; }
      setTransition(null);
    }
    catch (error) { setCompletionError(error instanceof Error ? error.message : 'Не удалось сохранить отметку. Повторите попытку.'); }
  }

  function card(step: RouteStep, recommended = false) {
    const scope = step.item && step.item.scope !== 'run' ? null : runId;
    const postponed = isPostponed(step);
    const needsCheck = ['blocked', 'unavailable', 'check'].includes(step.status);
    return <article key={step.node.id} className={recommended ? styles.nextStep : styles.routeStep}
      data-testid={recommended ? 'next-action' : undefined} data-route-id={step.node.id} data-route-status={step.status} data-route-postponed={postponed ? 'true' : undefined}>
      <div className={styles.badges}><span>{recommended ? planId === step.node.id ? 'Ваш следующий шаг' : 'Следующий шаг' : labels[step.status]}</span>{postponed && step.status !== 'done' && step.status !== 'postponed' && <span>Отложено</span>}{step.node.missable && <span className={styles.missable}>Можно пропустить</span>}</div>
      <h3>{step.title}</h3>
      <p>{step.instruction}</p>
      {(step.item?.teacher || step.node.locationIds.length > 0) && <p className={styles.hint}>{[
        step.item?.teacher, ...step.node.locationIds.map(id => definition.locations.find(place => place.id === id)?.name),
      ].filter(Boolean).join(' · ')}</p>}
      {needsCheck && <p className={styles.warning}>{labels[step.status]}.{step.reasons[0] ? ' ' + reasonText(step, step.reasons[0]) : ''}</p>}
      {step.item?.steps?.map(stage => <label className={styles.checkline} key={stage.id}>
        <input type="checkbox" aria-label={stage.label + ': ' + step.title}
          checked={valueAt(events, game.id, scope, routeEntity(step.node), 'stage:' + stage.id) === true} disabled={disabled}
          onChange={event => void setStep(step, 'stage:' + stage.id, event.target.checked)} />{stage.label}
      </label>)}
      {step.status !== 'done' && <div className={styles.actions}><button className={recommended ? styles.primary : ''} disabled={disabled}
        onClick={() => { if (step.node.transition) { setCompletionError(''); setTransition(step); } else void finish(step, true); }}>
        {needsCheck ? 'Уже сделал в игре' : 'Сделал'}
      </button></div>}
      <details className={styles.instruction}><summary>Другие действия</summary><div className={styles.actions}>
        {step.status === 'done'
          ? <button disabled={disabled} onClick={() => void finish(step, false)}>Отменить отметку</button>
          : <button disabled={disabled} onClick={() => void setStep(step, 'postponed', !postponed)}>{postponed ? 'Вернуть в маршрут' : 'Отложить'}</button>}
        {step.status !== 'done' && <button disabled={disabled} onClick={() => void setRun('nextAction', planId === step.node.id ? null : step.node.id)}>
          {planId === step.node.id ? 'Убрать из моего плана' : 'Выбрать своим планом'}
        </button>}
      </div></details>
      <details className={styles.instruction}><summary>Условия, подсказки и источники</summary>
        {step.item?.conditions && <p><strong>Условия:</strong> {step.item.conditions}</p>}
        {step.reasons.length > 0 && <ul>{step.reasons.map((reason, index) => <li key={index}>{reasonText(step, reason)}</li>)}</ul>}
        {step.node.rewards?.length ? <p>Награды: {step.node.rewards.join(', ')}</p> : null}
        <p>{step.node.trophyIds.length ? 'Трофеи: ' + step.node.trophyIds.map(id => game.items.find(item => item.id === id)?.name || id).join(' · ') : 'Связь с конкретным трофеем ещё не установлена.'}</p>
        {(step.node.alternatives || []).map((text, index) => <p key={index}>{text}</p>)}
        {step.node.anyOf?.map((group, index) => <p key={index}>Вариант {index + 1}: {group.map(id => hiddenDependency(id) ? 'Шаг будущей главы' : byId.get(id)?.title || id).join(' → ')}</p>)}
        <p className={styles.hint}>{step.item?.gameVersion ? `Версия: ${step.item.gameVersion}` : 'Версия источника не установлена.'} Получение трофея PSN подтверждается отдельно.</p>
        <div className={styles.sourceLinks}>{(step.node.sources || step.item?.sources || []).map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
          {source.name}{source.author ? ` · ${source.author}` : ''} ↗
        </a>)}</div>
      </details>
    </article>;
  }

  const checks = transition ? checkpoint({ game, definition, events, runId, chapter, location }) : null;
  const currentLocation = definition.locations.find(place => place.id === location)?.name || 'место не выбрано';
  return <section className={styles.guide} data-testid="interactive-guide">
    {route.contextConflicts.length > 0 && <div className={styles.alert} role="alert"><strong>Уточните состояние персонажа.</strong><p>Разные отметки: {route.contextConflicts.join(', ')}. Выберите актуальное значение в блоке расхождений. До этого следующий шаг не предлагается.</p></div>}
    {completionError && !transition && <p className={styles.alert} role="alert">{completionError}</p>}
    {primary ? card(primary, true) : <div className={styles.panel}><h3>Уточним, что делать дальше</h3><p>Проверьте главу и место ниже. Другой шаг можно выбрать в полном маршруте.</p></div>}

    <details className={styles.guideContext}><summary>Глава {chapter} · {currentLocation} · изменить</summary>
      <div className={styles.formGrid}>
        <label>Глава<select aria-label="Глава в гайде" value={chapter} disabled={disabled} onChange={event => setChapter(Number(event.target.value))}>{game.chapters.map(number => <option key={number} value={number}>{number}</option>)}</select></label>
        <label>Место<select aria-label="Текущая локация" value={location} disabled={disabled} onChange={event => void setRun('location', event.target.value)}><option value="">Не выбрано</option>{definition.locations.map(place => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label>
        <label>Лагерь этого персонажа<select aria-label="Лагерь персонажа" value={campValue} disabled={disabled} onChange={event => void setRun('campMembership', event.target.value)}>
          {campCell.conflict && <option value="conflict" disabled>Нужно уточнить: разные отметки</option>}
          <option value="none">Пока не вступил</option><option value="old">Старый лагерь</option><option value="new">Новый лагерь</option><option value="swamp">Болотный лагерь</option>
        </select></label>
      </div>
      <p className={styles.hint}>Трофей за лагерь мог быть получен в другой ветке. Здесь укажите лагерь текущего персонажа.</p>
      {extraFields.length > 0 && <details className={styles.instruction}><summary>Другие условия персонажа</summary>{extraFields.map(field => {
        const fieldRules = rules.filter(rule => rule.field === field), values = [...new Set(fieldRules.map(rule => rule.value))];
        return <label key={field}>{fieldRules[0].label}<select disabled={disabled} value={JSON.stringify(valueAt(events, game.id, runId, 'run', field) ?? null)}
          onChange={event => void setRun(field, JSON.parse(event.target.value))}>
          <option value="null">Не проверено</option>{values.map(value => <option key={String(value)} value={JSON.stringify(value)}>{typeof value === 'boolean' ? value ? 'Да' : 'Нет' : String(value)}</option>)}
          {values.every(value => typeof value === 'boolean') && !values.includes(false) && <option value="false">Нет</option>}
        </select></label>;
      })}</details>}
    </details>

    <details className={styles.guideContext} open={showMore} onToggle={event => setShowMore(event.currentTarget.open)} data-testid="guide-more">
      <summary>Другие шаги и полный маршрут</summary>
      {showMore && <>
        <p className={styles.hint}>Можно идти в своём порядке. Выполнено {route.done} из {route.total} действий; получение платины подтверждается отдельно.</p>
        <nav className={styles.tabs} aria-label="Вид маршрута">{[['nearby', 'Рядом'], ['all', 'Полный маршрут'], ['missable', 'Можно пропустить']].map(([id, name]) => <button key={id} aria-pressed={mode === id} onClick={() => setMode(id)}>{name}</button>)}</nav>
        <input className={styles.routeSearch} aria-label="Поиск по маршруту" placeholder="Найти действие…" value={query} onChange={event => setQuery(event.target.value)} />
        <label className={styles.checkline}><input type="checkbox" checked={spoilers} onChange={event => setSpoilers(event.target.checked)} />Показывать будущие главы</label>
        {mode === 'missable' && <p className={styles.hint}>У каждого шага указаны сроки и причины блокировки. Неподтверждённые сведения помечены отдельно.</p>}
        {!displayed.length && <p className={styles.hint}>{!location && mode === 'nearby' ? 'Выберите место, чтобы увидеть действия рядом.' : 'Подходящих действий нет. Проверьте поиск и скрытые главы.'}</p>}
        {displayed.map(step => card(step))}
        <details className={styles.panel}><summary>Накопительные достижения</summary>{game.items.filter(item => item.category === 'counters').map(item => {
          const count = Number(valueAt(events, game.id, null, item.id, 'count') || 0);
          return <div className={styles.backup} key={item.id}><span>{item.name}: <strong>{count}{item.target ? `/${item.target}` : ''}</strong></span>
            <button disabled={disabled} aria-label={`Добавить к счётчику ${item.name}`} onClick={() => void change({ gameId: game.id, runId: null, entityId: item.id, field: 'count', value: 1, kind: 'increment' })}>+1</button>
          </div>;
        })}</details>
      </>}
    </details>

    {transition && checks && <div className={styles.modalBackdrop}><section className={styles.modal} role="dialog" aria-modal="true" aria-label="Проверка перед сюжетным решением">
      <h2>Перед действием: {transition.title}</h2>
      <p><strong>Сделайте отдельное сохранение на PS5.</strong> Решение может закрыть другую ветку. Если действие уже выполнено в игре, подтвердите это ниже.</p>
      {transition.reasons.length > 0 && <p className={styles.warning}>{transition.reasons.map(reason => reasonText(transition, reason)).join(' ')}</p>}
      {checks.required.some(step => step.node.id !== transition.node.id) && <><h3>Подтверждённые сроки этой главы</h3><ul>{checks.required.filter(step => step.node.id !== transition.node.id).map(step => <li key={step.node.id}>{step.title}</li>)}</ul></>}
      <details><summary>Пропускаемые действия: {checks.missable.filter(step => step.node.id !== transition.node.id).length}</summary>
        <p className={styles.hint}>Не каждый пункт закрывается именно сейчас. Сверьте срок и условия каждого действия.</p>
        <ul>{checks.missable.filter(step => step.node.id !== transition.node.id).map(step => <li key={step.node.id}>{step.title}{step.reasons.length ? ': ' + step.reasons.map(reason => reasonText(step, reason)).join(' ') : ''}</li>)}</ul>
      </details>
      <details><summary>Уроки для сверки: {checks.lessons.length}</summary><ul>{checks.lessons.map(step => <li key={step.node.id}>{step.title}</li>)}</ul></details>
      <details><summary>Незавершённые цепочки: {checks.chains.length}</summary><ul>{checks.chains.map(step => <li key={step.node.id}>{step.title}</li>)}</ul></details>
      <p className={styles.hint}>Полученный трофей PSN отмечайте в «Моём прогрессе». Возврат к основному сохранению не отменяет этот трофей.</p>
      {completionError && <p className={styles.alert} role="alert">{completionError}</p>}
      <div className={styles.actions}><button className={styles.primary} disabled={disabled} onClick={() => void finish(transition, true)}>Сделал — сохранить отметку</button><button disabled={disabled} onClick={() => setTransition(null)}>Вернуться к проверке</button></div>
    </section></div>}
  </section>;
}
