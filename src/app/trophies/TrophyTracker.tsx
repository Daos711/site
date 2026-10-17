'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, Check, CheckCheck, ChevronRight, Cloud, Download, Flag, History, Info, Map as MapIcon, Plus, RotateCcw, Search, ShieldCheck, Trophy, Upload } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { PageHeader } from '@/components/PageHeader';
import { GAME_CATALOGS, getGame } from '@/lib/trophies/catalog';
import { readField, parseImport, type JsonValue, type TrackerEvent } from '@/lib/trophies/events';
import { createTrackerStore } from '@/lib/trophies/storage';
import { useTracker } from '@/lib/trophies/useTracker';
import { chapterWarnings, customItems, filterItems, gameSummary, itemStatus, listRuns, valueAt } from '@/lib/trophies/selectors';
import { gothicPreset, runInputs, type ChangeInput } from '@/lib/trophies/preset';
import { CATEGORY_NAMES, type GameCatalog, type TrackerItem } from '@/lib/trophies/types';
import TrophyPwa from './TrophyPwa';
import GuidePanel from './GuidePanel';
import AutosaveInput from './AutosaveInput';
import { getGuide } from '@/lib/trophies/guides';
import { checkpoint } from '@/lib/trophies/routes';
import { activeSave, listSaves, saveView, saveAddress, forkSaveInputs, selectSaveInput } from '@/lib/trophies/saves';
import styles from './trophies.module.css';

const DraftContext = createContext<{ workspaceId: string; gameId: string; runId: string; saveId: string; events: readonly TrackerEvent[]; write: (input: ChangeInput) => Promise<string> } | null>(null);
const gradeNames = { bronze: 'Бронза', silver: 'Серебро', gold: 'Золото', platinum: 'Платина' };
const fieldNames: Record<string, string> = { status: 'Отметка', observed: 'История получения', count: 'Счётчик', text: 'Заметка', chapter: 'Глава', sleep: 'Без сна', name: 'Название', difficulty: 'Сложность', camp: 'Путь', role: 'Роль', reportedLessons: 'Счётчик уроков в игре', reportedMaps: 'Счётчик карт в игре' };
function pretty(value: JsonValue | undefined): string {
  if (value === true) return 'Да'; if (value === false) return 'Нет'; if (value === undefined || value === null) return 'Не указано';
  if (typeof value === 'object') return JSON.stringify(value);
  return ({ done: 'Выполнено', todo: 'Не выполнено', verify: 'Нужно подтвердить', active: 'Идёт', planned: 'Не начато', finished: 'Завершено', intact: 'Не нарушено', broken: 'Нарушено', unknown: 'Не проверено' } as Record<string, string>)[String(value)] || String(value);
}
function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function TrophyTracker({ gameId }: { gameId?: string }) {
  const auth = useAuth();
  if (auth.loading) return <div className={styles.loading} role="status">Открываем ваш трекер…</div>;
  const workspaceId = auth.user ? `user:${auth.user.id}` : 'guest';
  return <Workspace key={workspaceId} workspaceId={workspaceId} ownerId={auth.user?.id || null} game={gameId ? getGame(gameId) : undefined} signIn={auth.signIn} />;
}

function Workspace({ workspaceId, ownerId, game, signIn }: { workspaceId: string; ownerId: string | null; game?: GameCatalog; signIn: (url?: string) => Promise<void> }) {
  const { store, snapshot, syncNow } = useTracker(workspaceId, ownerId);
  const runPreferenceKey = 'lab-trophies:run:' + workspaceId + ':' + (game?.id || 'catalog');
  const [selectedRun, setSelectedRun] = useState(() => { try { return typeof window === 'undefined' ? '' : window.localStorage.getItem(runPreferenceKey) || ''; } catch { return ''; } });
  useEffect(() => { if (selectedRun) { try { window.localStorage.setItem(runPreferenceKey, selectedRun); } catch { /* A UI preference never blocks durable progress. */ } } }, [selectedRun, runPreferenceKey]);
  const [tab, setTab] = useState('guide');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(game?.categories.some(cat => cat.id === 'lessons') ? 'lessons' : game?.categories[0]?.id || '');
  const [chapterFilter, setChapterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [spoilers, setSpoilers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastChange, setLastChange] = useState<string | null>(null);
  const [nextChapter, setNextChapter] = useState<number | null>(null);
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof parseImport> | null>(null);
  const [backups, setBackups] = useState<Awaited<ReturnType<typeof store.listBackups>>>([]);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [newRunName, setNewRunName] = useState('');
  const [newSaveName, setNewSaveName] = useState('');
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const rawEvents = snapshot.events;
  const runs = useMemo(() => game ? listRuns(rawEvents, game.id) : [], [rawEvents, game]);
  const runId = runs.includes(selectedRun) ? selectedRun : runs[0] || '';
  const saveId = game && runId ? activeSave(rawEvents, game.id, runId, snapshot.deviceId) : 'main';
  const saves = game && runId ? listSaves(rawEvents, game.id, runId) : [];
  const events = useMemo(() => game && runId ? saveView(rawEvents, game.id, runId, saveId) : rawEvents, [rawEvents, game, runId, saveId]);
  const guide = game ? getGuide(game.id) : undefined;
  const currentChapter = game && runId ? Number(valueAt(events, game.id, runId, 'run', 'chapter') || 1) : 1;
  const summary = game ? gameSummary(events, game) : null;
  const allItems = useMemo(() => game ? [...game.items, ...customItems(events, game.id)] : [], [events, game]);
  const statusFor = (item: TrackerItem) => itemStatus(events, game!.id, runId || null, item);
  const items = game ? filterItems(allItems, { query, category, chapter: chapterFilter, status: statusFilter, spoilers, currentChapter, statusFor }) : [];
  const warnings = game && runId ? chapterWarnings(events, game, runId, currentChapter) : [];
  const checks = game && guide && runId ? checkpoint({ game, definition: guide, events, runId, chapter: currentChapter, location: String(valueAt(events, game.id, runId, 'run', 'location') || '') }) : null;
  const conflicts = useMemo(() => {
    const addresses = new Map<string, TrackerEvent>();
    for (const event of events) addresses.set(JSON.stringify([event.gameId, event.runId, event.entityId, event.field]), event);
    return [...addresses.values()].map(event => ({ event, cell: readField(events, event) })).filter(row => row.cell.conflict && (!game || row.event.gameId === game.id));
  }, [events, game]);
  async function perform(action: () => Promise<unknown>, success = 'Сохранено на этом устройстве') {
    setBusy(true); setError('');
    try { await action(); setMessage(success); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось сохранить изменение. Повторите попытку.'); }
    finally { setBusy(false); }
  }
  async function write(input: ChangeInput): Promise<string> {
    setBusy(true); setError('');
    try { const event = await store.dispatch(saveAddress(input, runId, saveId)); setLastChange(event.id); setMessage('Сохранено на этом устройстве'); return event.id; }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось сохранить'); throw reason; }
    finally { setBusy(false); }
  }
  async function change(input: ChangeInput) { try { await write(input); } catch { /* The error remains visible; an explicit retry is safe. */ } }
  const runValue = (field: string) => game ? valueAt(events, game.id, runId, 'run', field) : undefined;
  const setRun = (field: string, value: JsonValue) => game && change({ gameId: game.id, runId, entityId: 'run', field, value });
  const syncLabel = !ownerId ? 'На этом устройстве' : snapshot.sync.status === 'syncing' ? 'Синхронизация…' : snapshot.sync.status === 'offline' ? 'Нет сети · изменения в очереди' : snapshot.sync.status === 'error' ? 'Облако недоступно' : snapshot.pendingIds.length ? `Ожидают отправки: ${snapshot.pendingIds.length}` : snapshot.sync.lastSyncedAt ? 'Сохранено в облаке' : 'Подключаем облако…';
  const ready = snapshot.status === 'ready';
  const cloudChecked = !ownerId || !!snapshot.sync.lastSyncedAt;
  const canInitialize = ready && cloudChecked && !busy;

  return <DraftContext.Provider value={{ workspaceId, gameId: game?.id || '', runId, saveId, events, write }}><div className={styles.app} data-testid="trophy-tracker" data-workspace={ownerId ? 'account' : 'guest'}>
    <div className={styles.topline}><a href={game ? '/trophies' : '/apps'}><ArrowLeft size={16} /> {game ? 'Все игры' : 'Приложения Lab'}</a><TrophyPwa /></div>
    <div className={styles.syncbar} role="status"><span>{ownerId ? <Cloud size={16} /> : <ShieldCheck size={16} />}{syncLabel}</span>
      {ownerId ? <button onClick={() => void syncNow()} disabled={!ready || busy}>Синхронизировать</button> : <button onClick={() => void signIn(window.location.origin + window.location.pathname)}>Войти через Google</button>}
    </div>
    {!ownerId && <p className={styles.hint}>Без входа прогресс хранится в этом браузере. Для синхронизации устройств войдите через Google.</p>}
    {(snapshot.error || error) && <p role="alert" className={styles.alert}>{error || snapshot.error}</p>}
    {snapshot.sync.error && <details className={styles.alert}><summary>Не удалось синхронизировать. Местные изменения сохранены.</summary><p>{snapshot.sync.error}</p><button onClick={() => void syncNow()}>Повторить</button></details>}
    {snapshot.status === 'loading' && <p role="status">Загружаем сохранения…</p>}
    {message && <div className={styles.feedback} role="status"><Check size={16} /> {message}{lastChange && <button onClick={() => void perform(async () => { await store.undo(lastChange); setLastChange(null); }, 'Изменение отменено')}>Отменить</button>}</div>}

    {!game ? <>
      <PageHeader title="Трофеи и прохождения" description="Ваш путь к платине. Отметки, коллекции и планы на следующее прохождение." />
      <div className={styles.gameGrid}>{GAME_CATALOGS.map(catalog => {
        const progress = gameSummary(events, catalog);
        return <a className={styles.gameCard} href={`/trophies/${catalog.id}`} key={catalog.id}>
          {/* An original local illustration, not a copied game asset. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={catalog.cover} width="720" height="420" alt="" />
          <div><span className={styles.eyebrow}>{catalog.platform} · Ручной трекер</span><h2>{catalog.title}</h2><p>{catalog.description}</p>
          <div className={styles.flex}><strong>{progress.earned}/{progress.trophies} трофеев</strong><span>{progress.percent}%</span></div><progress value={progress.earned} max={progress.trophies || 1} aria-label={`Прогресс ${catalog.title}`} /><span className={styles.cardLink}>Открыть прохождение <ChevronRight size={18} /></span></div>
        </a>;
      })}</div>
      <p className={styles.hint}>Трофеи PSN отмечаются вами вручную. Выполненный пункт в списке сам по себе не подтверждает получение трофея.</p>
    </> : <>
      <section className={styles.hero}>
        <div><span className={styles.eyebrow}>{game.platform} · Журнал прохождения</span><h1>{game.title}</h1><p>Помнить важное. Играть в своём темпе.</p></div>
        <div className={styles.platinum}><Trophy size={26} /><strong>{summary!.earned}<span> / {summary!.trophies}</span></strong><small>трофеев PSN отмечено</small><progress aria-label="Полученные трофеи PSN" value={summary!.earned} max={summary!.trophies} /></div>
      </section>
      {ready && !runs.length && <section className={styles.onboarding} data-testid="onboarding"><h2>С чего продолжим?</h2><p>Можно перенести заданные вами отметки первого прохождения: глава 1, «Новичок», путь мага Огня, семь подтверждённых вами уроков (7/46).</p>
        <div className={styles.actions}><button className={styles.primary} disabled={!canInitialize} onClick={() => void perform(() => store.batchDispatch(gothicPreset()), 'Начальный прогресс записан: 7/46 уроков. Две карты у Грэма оставлены неопознанными.')}>Загрузить мой начальный прогресс</button>
        <button disabled={!canInitialize} onClick={() => void perform(() => store.batchDispatch(runInputs(game.id, crypto.randomUUID(), 'Первое прохождение')))}>Начать с чистого листа</button></div>
        <p className={styles.hint}>{!cloudChecked ? "Сначала проверим облачные сохранения. При недоступном облаке можно работать в гостевом режиме. " : ""}Начальные отметки применяются только по этой кнопке. Существующая история не заменяется.</p>
      </section>}
      {runs.length > 0 && <>
        <details className={styles.saveControls}><summary>Глава {currentChapter} · {saves.find(save => save.id === saveId)?.name || "Сохранение"} · сменить</summary><div className={styles.runbar}><label>Прохождение<select aria-label="Прохождение" value={runId} onChange={event => { setSelectedRun(event.target.value); setSpoilers(false); }}>{runs.map(id => <option key={id} value={id}>{String(valueAt(rawEvents, game.id, id, 'run', 'name') || 'Прохождение')}{valueAt(rawEvents, game.id, id, 'run', 'status') === 'planned' ? ' · план' : ''}</option>)}</select></label><span className={styles.runmeta}>Глава {currentChapter} · {String(runValue('difficulty') || 'Сложность не указана')}</span><button onClick={() => setTab('runs')}>Настроить</button></div>
        <div className={styles.runbar}><label>Состояние персонажа<select aria-label="Сохранение персонажа" value={saveId} onChange={event => void perform(() => store.dispatch(selectSaveInput(game.id, runId, event.target.value, snapshot.deviceId)), 'Состояние персонажа переключено. Трофеи PSN сохранены.')}>{saves.map(save => <option key={save.id} value={save.id}>{save.name}</option>)}</select></label><button onClick={() => setTab('runs')}>Создать ветку</button></div>
        </details>
        {runValue('status') === 'planned' && <p className={styles.notice}>Это прохождение ещё не начато. Его отметки хранятся отдельно.<button onClick={() => void setRun('status', 'active')}>Начать прохождение</button></p>}
        <div className={styles.stats}>
          <button onClick={() => { setCategory('lessons'); setTab('items'); }}><BookOpen size={21} /><span><strong>{summary!.lessons}/{game.lessonTarget || game.items.filter(item => item.category === 'lessons').length}</strong><small>уроков в истории</small></span></button>
          <button onClick={() => { setCategory('maps'); setTab('items'); }}><MapIcon size={21} /><span><strong>{summary!.maps}/{game.items.filter(item => item.category === 'maps').length}</strong><small>вариантов карт отмечено</small></span></button>
          <button onClick={() => { setCategory(''); setStatusFilter('missable'); setTab('items'); }}><Flag size={21} /><span><strong>{warnings.length}</strong><small>действий для сверки</small></span></button>
        </div>
        <nav className={styles.tabs} aria-label="Раздел трекера">{[['guide', 'Гайд к платине'], ['items', 'Чек-лист'], ['runs', 'Прохождения'], ['notes', 'Заметки'], ['history', 'История'], ['data', 'Сохранения']].map(([id, label]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</nav>

        {conflicts.length > 0 && <section className={styles.notice}><h2>Есть расхождения между устройствами: {conflicts.length}</h2><p>Оба варианта сохранены в истории. Выберите актуальное значение.</p>{conflicts.map(({ event, cell }) => {
          const item = allItems.find(item => item.id === event.entityId);
          const title = item && (!spoilers && (item.spoilerChapter ?? item.chapter) !== null && Number(item.spoilerChapter ?? item.chapter) > currentChapter) ? 'Пункт следующей главы' : item?.name || fieldNames[event.field] || 'Запись';
          return <div className={styles.conflict} key={event.id}><strong>{title} · {fieldNames[event.field] || event.field}</strong>{cell.alternatives.map((value, index) => <button key={index} disabled={busy} onClick={() => void change({ gameId: event.gameId, runId: event.runId, entityId: event.entityId, field: event.field, value })}>Оставить: {pretty(value).slice(0, 200)}</button>)}</div>;
        })}</section>}

        {tab === 'guide' && guide && <GuidePanel key={runId + saveId} game={game} definition={guide} events={events} runId={runId} chapter={currentChapter} disabled={busy || !ready} change={change} setChapter={value => { if (value > currentChapter) setNextChapter(value); else void setRun('chapter', value); }} />}
        {tab === 'items' && <>
          <div className={styles.filters}>
            <label className={styles.search}><Search size={18} /><input aria-label="Поиск по названию, учителю или месту" placeholder="Навык, предмет, учитель…" value={query} onChange={event => setQuery(event.target.value)} /></label>
            <div className={styles.filterRow}><label>Категория<select aria-label="Категория" value={category} onChange={event => setCategory(event.target.value)}><option value="">Все категории</option>{game.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}<option value="custom">Мои пункты</option></select></label>
            <label>Глава<select aria-label="Фильтр главы" value={chapterFilter} onChange={event => setChapterFilter(event.target.value)}><option value="">Все доступные</option>{game.chapters.filter(n => spoilers || n <= currentChapter).map(n => <option key={n} value={n}>Глава {n}</option>)}<option value="null">Не установлена</option></select></label>
            <label>Статус<select aria-label="Статус пунктов" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">Все</option><option value="todo">Не выполнено</option><option value="done">Выполнено</option><option value="verify">Нужно подтвердить</option><option value="missable">Можно пропустить</option><option value="check">Требует проверки источников</option></select></label></div>
            <label className={styles.checkline}><input type="checkbox" checked={spoilers} onChange={event => setSpoilers(event.target.checked)} />Показывать спойлеры следующих глав</label>
          </div>
          {category === 'lessons' && <section className={styles.context}><strong>Подтверждено по названиям: {summary!.lessons}/{game.lessonTarget}</strong><p>В игровом счётчике этого прохождения: {runValue('reportedLessons') == null ? 'не указано' : `${runValue('reportedLessons')}/${game.lessonTarget}`}.</p>{Number(runValue('reportedLessons') || 0) !== summary!.lessons && <p className={styles.warning} data-testid="lesson-discrepancy">Расхождение: {Math.abs(Number(runValue('reportedLessons') || 0) - summary!.lessons)}. Неизвестный урок не подставляется в список автоматически.</p>}<p>«Изучение записано» — история действий между прохождениями. «Есть в сохранении» — текущий персонаж. Загрузка старого сохранения не подтверждает зачёт урока в игре.</p></section>}
          {category === 'maps' && <section className={styles.context}><strong>Поимённо отмечено {summary!.maps}; по вашему счётчику — {runValue('reportedMaps') == null ? 'не указано' : String(runValue('reportedMaps'))}.</strong><p>{game.mapTargetNote}</p><p>Разные варианты маршрутов сохранены отдельными пунктами. Две неопознанные покупки у Грэма не выбраны за вас.</p></section>}
          {category === 'trophies' && <p className={styles.context}>Отмечайте трофей только после того, как увидели его полученным в PSN. Чек-листы и счётчики не ставят эти отметки автоматически.</p>}
          {category === 'counters' && <p className={styles.context}>Это ваш накопительный журнал действий. Он не считывает PS5 и не доказывает, что игра засчитала действия после загрузки сохранения.</p>}
          <div className={styles.listTitle}><h2>{category ? CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES] : 'Все пункты'}</h2><span>{items.length} показано</span></div>
          <div className={styles.items}>{items.map(item => <ItemCard key={saveId + item.id} item={item} game={game} runId={runId} events={events} disabled={busy || !ready} change={change} />)}</div>
          {!items.length && <div className={styles.empty}><Search size={28} /><h3>Подходящих пунктов нет</h3><p>Измените поиск или фильтры. Пункты следующих глав скрыты, пока выключены спойлеры.</p><button onClick={() => { setQuery(''); setStatusFilter(''); setChapterFilter(''); }}>Сбросить поиск и фильтры</button></div>}
        </>}

        {tab === 'runs' && <section className={styles.panel}><h2>Сохранения персонажа</h2><p>Ветка копирует текущее состояние персонажа. После получения трофея PSN вернитесь к основному сохранению через переключатель. Сохранения в самой игре создавайте и загружайте отдельно на PS5.</p><form className={styles.inlineForm} onSubmit={event => { event.preventDefault(); if (!newSaveName.trim()) return; void perform(async () => { await store.batchDispatch(forkSaveInputs(store.getSnapshot().events, game.id, runId, saveId, crypto.randomUUID(), newSaveName, snapshot.deviceId)); setNewSaveName(''); }, 'Ветка сохранения создана и открыта'); }}><input aria-label="Название ветки сохранения" value={newSaveName} maxLength={120} placeholder="Например, вступление в Новый лагерь" onChange={e => setNewSaveName(e.target.value)} /><button disabled={!newSaveName.trim() || busy}>Создать ветку из текущей</button></form><hr /><h2>Настройки текущего сохранения</h2><div className={styles.formGrid}>
          <DraftInput key={runId + saveId + '-name'} label="Название прохождения" value={String(runValue('name') || '')} field="name" />
          <label>Текущая глава<select aria-label="Текущая глава" value={currentChapter} onChange={event => { const value = Number(event.target.value); if (value > currentChapter) setNextChapter(value); else void setRun('chapter', value); }}>{game.chapters.map(n => <option key={n} value={n}>{n}</option>)}</select></label>
          <DraftInput key={runId + saveId + '-difficulty'} label="Сложность" value={String(runValue('difficulty') || '')} field="difficulty" />
          <DraftInput key={runId + saveId + '-camp'} label="Лагерь или план вступления" value={String(runValue('camp') || '')} field="camp" />
          <DraftInput key={runId + saveId + '-role'} label="Роль персонажа" value={String(runValue('role') || '')} field="role" />
          <label>Статус прохождения<select value={String(runValue('status') || 'active')} onChange={event => void setRun('status', event.target.value)}><option value="planned">Не начато</option><option value="active">Идёт</option><option value="finished">Завершено</option></select></label>
          <label>Прохождение без сна<select aria-label="Условие без сна" value={String(runValue('sleep') || 'unknown')} onChange={event => void setRun('sleep', event.target.value)}><option value="unknown">Не проверено</option><option value="intact">Пока не нарушено</option><option value="broken">Нарушено</option></select></label>
          <label className={styles.checkline}><input aria-label="Режим перманентной смерти" type="checkbox" checked={runValue('permadeath') === true} onChange={event => void setRun('permadeath', event.target.checked)} />Перманентная смерть</label>
          <DraftInput key={runId + saveId + '-reported-lessons'} label="Уроки: счётчик в игре" type="number" value={runValue('reportedLessons') == null ? '' : String(runValue('reportedLessons'))} field="reportedLessons" transform={value => value === '' ? null : Math.max(0, Math.min(1000, Number(value)))} />
          <DraftInput key={runId + saveId + '-reported-maps'} label="Карты: счётчик в игре" type="number" value={runValue('reportedMaps') == null ? '' : String(runValue('reportedMaps'))} field="reportedMaps" transform={value => value === '' ? null : Math.max(0, Math.min(1000, Number(value)))} />
        </div><p className={styles.hint}>Отметки сохраняются автоматически. Смена главы не удаляет историю и не получает трофеи за вас.</p><hr /><h3>Добавить прохождение</h3><form onSubmit={event => { event.preventDefault(); if (!newRunName.trim()) return; const id = crypto.randomUUID(); void perform(async () => { await store.batchDispatch(runInputs(game.id, id, newRunName.trim(), { status: 'planned' })); setSelectedRun(id); setNewRunName(''); }, 'Новое прохождение создано'); }} className={styles.inlineForm}><input aria-label="Название нового прохождения" maxLength={120} placeholder="Например, охота за платиной" value={newRunName} onChange={event => setNewRunName(event.target.value)} /><button className={styles.primary} disabled={!newRunName.trim() || busy}><Plus size={18} /> Создать</button></form></section>}

        {tab === 'notes' && <section className={styles.panel}><h2>Заметки этого прохождения</h2><DraftInput key={runId + saveId + '-journal'} label="Заметки" multiline value={String(valueAt(events, game.id, runId, 'journal', 'text') || '')} entityId="journal" field="text" /><p className={styles.hint}>Сохраняются автоматически во время ввода; черновик защищён при перезагрузке. История сохраняет прежние версии, а одновременные правки с двух устройств будут предложены для выбора.</p><hr /><h3>Собственный пункт</h3><form onSubmit={event => { event.preventDefault(); if (!customName.trim()) return; void perform(async () => { await store.dispatch({ gameId: game.id, runId: null, entityId: 'custom-' + crypto.randomUUID(), field: 'definition', value: { name: customName.trim(), description: customDescription.trim(), chapter: currentChapter, missable: 'unknown' } }); setCustomName(''); setCustomDescription(''); setCategory('custom'); setTab('items'); }, 'Свой пункт добавлен'); }} className={styles.formGrid}><label>Название<input aria-label="Название собственного пункта" required maxLength={180} value={customName} onChange={event => setCustomName(event.target.value)} /></label><label>Как выполнить<textarea maxLength={4000} value={customDescription} onChange={event => setCustomDescription(event.target.value)} /></label><button className={styles.primary} disabled={!customName.trim() || busy}><Plus size={18} /> Добавить в чек-лист</button></form></section>}

        {tab === 'history' && <section className={styles.panel}><h2><History size={22} /> История изменений</h2><p className={styles.hint}>Все действия остаются в истории, включая отмену. Загрузка сохранения в самой игре не изменяет этот журнал.</p><ol className={styles.history}>{events.filter(event => event.gameId === game.id).slice().sort((a, b) => b.clock - a.clock || b.id.localeCompare(a.id)).slice(0, 120).map(event => {
          const item = allItems.find(item => item.id === event.entityId);
          const title = item && !spoilers && (item.spoilerChapter ?? item.chapter) !== null && Number(item.spoilerChapter ?? item.chapter) > currentChapter ? 'Пункт следующей главы' : item?.name || (event.entityId === 'run' ? 'Прохождение' : 'Заметка');
          return <li key={event.id}><div><strong>{title}</strong><p>{fieldNames[event.field] || 'Изменение'}: {pretty(event.value).slice(0, 140)}</p><small>{event.runId ? String(valueAt(events, game.id, event.runId, 'run', 'name') || 'Прохождение') : 'Общая история'} · {new Date(event.createdAt).toLocaleString('ru-RU')}</small></div><button aria-label={`Отменить изменение ${title}`} disabled={busy} onClick={() => void perform(() => store.undo(event.id), 'Изменение отменено')}><RotateCcw size={17} /></button></li>;
        })}</ol><p className={styles.hint}>Показаны последние 120 действий. Экспорт содержит полную историю.</p></section>}
      </>}
    </>}

    {(tab === 'data' || !game || !runs.length) && <section className={styles.panel}><h2>Сохранения и резервные копии</h2><p>Экспорт сохраняет все игры, прохождения и историю. Импорт объединяет записи по уникальным ID, не заменяя существующий прогресс.</p><div className={styles.actions}><button disabled={!ready || busy} onClick={() => download(`trophy-tracker-${new Date().toISOString().slice(0, 10)}.json`, store.exportData())}><Download size={18} /> Экспорт JSON</button><label className={styles.fileButton}><Upload size={18} /> Выбрать JSON<input aria-label="Импорт JSON" type="file" accept=".json,application/json" disabled={!ready || busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; void perform(async () => { if (file.size > 16 * 1024 * 1024) throw new Error('Файл слишком большой: предел 16 МБ.'); setPendingImport(parseImport(await file.text())); }, 'Импорт подготовлен. Проверьте число записей ниже.'); }} /></label><button disabled={!ready || busy} onClick={() => void perform(async () => { setBackups(await store.listBackups()); }, 'Список местных резервных копий обновлён')}>Резервные копии</button></div>
      {ownerId && <button className={styles.transfer} disabled={!ready || busy} onClick={() => void perform(async () => { const guest = createTrackerStore({ workspaceId: 'guest' }); try { await guest.init(); const data = guest.exportData(); if (!data.events.length) throw new Error('В гостевом режиме этого браузера пока нет отметок.'); setPendingImport(parseImport(data)); } finally { guest.dispose(); } }, 'Подготовлен перенос гостевых отметок. Подтвердите объединение ниже.')}>Перенести отметки из гостевого режима этого браузера</button>}
      {pendingImport && <div className={styles.notice}><strong>Подготовлено к объединению: {pendingImport.events.length} записей</strong><p>Ваша история сохранится. Перед импортом будет создана местная резервная копия; расхождения будут показаны отдельно.</p><div className={styles.actions}><button className={styles.primary} disabled={busy} onClick={() => void perform(async () => { await store.importData(pendingImport, { mode: 'merge' }); setPendingImport(null); }, 'История объединена')}>Объединить с моей историей</button><button onClick={() => setPendingImport(null)}>Отмена</button></div></div>}
      {backups.map(backup => <div className={styles.backup} key={backup.id}><span>{new Date(backup.createdAt).toLocaleString('ru-RU')}</span><button disabled={busy} onClick={() => setRestoreId(backup.id)}>Восстановить эту копию</button></div>)}
      <p className={styles.hint}>Местные копии защищают от ошибочных правок. JSON храните отдельно от браузера. Для переноса между устройствами войдите в один Google-аккаунт и дождитесь статуса «Сохранено в облаке».</p>
    </section>}
    {game && <details className={styles.sources}><summary><Info size={17} /> Версии игры и источники</summary><p>Источники сверены {game.reviewedAt.split('-').reverse().join('.')}. Это ручной журнал; связи с PSN нет. Сведения, не подтверждённые для PS5 или текущего патча, отмечены «Требует проверки».</p>{game.patches.map(patch => <p key={patch.version}><strong>{patch.version}.</strong> {patch.description} <a href={patch.sourceUrl} target="_blank" rel="noreferrer">Изменения разработчиков ↗</a></p>)}<a href="/apps/gothic-locks">Открыть справочник замков Gothic ↗</a></details>}

    {nextChapter !== null && game && <div className={styles.modalBackdrop}><section className={styles.modal} role="dialog" aria-modal="true" aria-label="Перед переходом в следующую главу"><h2>Перед главой {nextChapter}</h2><p>Проверьте доступные пропускаемые действия. Не каждый пункт закрывается сразу при смене главы; точные условия есть в инструкции.</p><p><strong>Создайте отдельное сохранение на PS5 перед переходом.</strong> В трекере ветку можно создать в разделе «Прохождения».</p>{checks && <><h3>Подтверждённые сроки этой главы: {checks.required.length}</h3><ul>{checks.required.map(step => <li key={step.node.id}>{step.title}{!step.node.verified ? ' — требует проверки' : ''}</li>)}</ul><h3>Уроки для проверки: {checks.lessons.length}</h3><details><summary>Посмотреть уроки</summary><ul>{checks.lessons.map(step => <li key={step.node.id}>{step.title}{!step.node.verified ? ' — требует проверки' : ''}</li>)}</ul></details><h3>Незавершённые цепочки: {checks.chains.length}</h3><ul>{checks.chains.map(step => <li key={step.node.id}>{step.title}</li>)}</ul></>}<h3>Пропускаемые действия</h3><ul>{(checks?.missable || warnings.map(item => ({ node: { id: item.id }, title: item.name, reasons: [] }))).map(step => <li key={step.node.id}>{step.title}{step.reasons.length > 0 ? ': ' + step.reasons.join(' ') : ''}</li>)}</ul>{!warnings.length && <p>В текущем списке нет незакрытых пропускаемых пунктов этой главы. Это не гарантия отсутствия скрытых условий игры.</p>}<div className={styles.actions}><button className={styles.primary} onClick={() => { void setRun('chapter', nextChapter); setNextChapter(null); setSpoilers(false); }}>Подтвердить главу {nextChapter}</button><button onClick={() => setNextChapter(null)}>Остаться в главе {currentChapter}</button></div></section></div>}
    {restoreId && <div className={styles.modalBackdrop}><section className={styles.modal} role="dialog" aria-modal="true" aria-label="Восстановить резервную копию"><h2>Вернуться к состоянию копии?</h2><p>Будут добавлены обратные изменения. Полная история останется доступна; изменения синхронизируются с вашим аккаунтом.</p><div className={styles.actions}><button className={styles.primary} disabled={busy} onClick={() => void perform(async () => { await store.restoreBackup(restoreId); setRestoreId(null); }, 'Состояние резервной копии восстановлено')}>Восстановить</button><button onClick={() => setRestoreId(null)}>Отмена</button></div></section></div>}
  </div></DraftContext.Provider>;
}

function DraftInput({ label, value, field, entityId = 'run', scope, transform, multiline = false, type = 'text' }: { label: string; value: string; field: string; entityId?: string; scope?: string | null; transform?: (value: string) => JsonValue; multiline?: boolean; type?: string }) {
  const context = useContext(DraftContext);
  if (!context) return null;
  const address = { gameId: context.gameId, runId: scope === undefined ? context.runId : scope, entityId, field };
  const heads = readField(context.events, address).heads.map(e => e.id);
  return <AutosaveInput label={label} value={value} heads={heads} storageKey={JSON.stringify([context.workspaceId, context.gameId, address.runId, address.runId ? context.saveId : null, entityId, field])} multiline={multiline} type={type} save={(text, basis) => context.write({ ...address, value: transform ? transform(text) : text, basis })} />;
}

function ItemCard({ item, game, runId, events, disabled, change }: { item: TrackerItem; game: GameCatalog; runId: string; events: readonly TrackerEvent[]; disabled: boolean; change: (input: ChangeInput) => Promise<void> }) {
  const scope = item.scope === 'run' ? runId : null;
  const status = itemStatus(events, game.id, runId, item);
  const observed = readField(events, { gameId: game.id, runId: null, entityId: item.id, field: 'observed' });
  const isCollectionHistory = item.category === 'lessons' || item.category === 'maps';
  const count = Number(valueAt(events, game.id, null, item.id, 'count') || 0);
  const set = (field: string, value: JsonValue, history = false) => change({ gameId: game.id, runId: history ? null : scope, entityId: item.id, field, value });
  return <article className={`${styles.item} ${status === 'done' ? styles.done : ''}`} data-item-id={item.id} data-status={status}>
    <div className={styles.itemHead}>
      {item.category !== 'counters' && <label className={styles.bigCheck}><input type="checkbox" aria-label={`${item.category === 'trophies' ? 'Трофей PSN получен' : 'Выполнено'}: ${item.name}`} checked={status === 'done'} disabled={disabled} onChange={event => void set('status', event.target.checked ? 'done' : 'todo')} /><span><Check size={22} /></span></label>}
      <div className={styles.itemTitle}><div className={styles.badges}>{item.grade && <span className={styles[item.grade]}>{gradeNames[item.grade]}</span>}{item.chapter !== null && <span>Глава {item.chapter}</span>}{item.missable === 'yes' && <span className={styles.missable}>Можно пропустить</span>}{item.confidence === 'check' && <span className={styles.uncertain}>Требует проверки</span>}</div><h3>{item.name}</h3>{(item.teacher || item.location) && <p>{[item.teacher, item.location].filter(Boolean).join(' · ')}</p>}{isCollectionHistory && <small>Верхняя отметка: есть в текущем сохранении</small>}</div>
    </div>
    {isCollectionHistory && <label className={styles.historyCheck}><input type="checkbox" aria-label={`${item.category === 'lessons' ? 'Изучение записано' : 'Покупка записана'}: ${item.name}`} checked={observed.value === true && !observed.conflict} disabled={disabled} onChange={event => void set('observed', event.target.checked, true)} /><span><CheckCheck size={17} />{item.category === 'lessons' ? 'Изучение записано в общую историю' : 'Получение записано в общую историю'}</span></label>}
    {item.category === 'counters' && <div className={styles.counter}><button aria-label={`Уменьшить счётчик: ${item.name}`} disabled={disabled || count <= 0} onClick={() => void change({ gameId: game.id, runId: null, entityId: item.id, field: 'count', kind: 'increment', value: -1 })}>−</button><strong>{count}{item.target ? <small> / {item.target}</small> : null}</strong><button aria-label={`Увеличить счётчик: ${item.name}`} disabled={disabled} onClick={() => void change({ gameId: game.id, runId: null, entityId: item.id, field: 'count', kind: 'increment', value: 1 })}>+</button><button disabled={disabled} onClick={() => void change({ gameId: game.id, runId: null, entityId: item.id, field: 'count', kind: 'increment', value: 10 })}>+10</button>{item.target && <progress aria-label={`Прогресс счётчика ${item.name}`} value={Math.max(0, Math.min(count, item.target))} max={item.target} />}</div>}
    <details className={styles.instruction}><summary>Как получить <ChevronRight size={16} /></summary><p>{item.description}</p>{item.steps?.map(step => <label className={styles.checkline} key={step.id}><input type="checkbox" aria-label={step.label + ": " + item.name} checked={valueAt(events, game.id, scope, item.id, "stage:" + step.id) === true} disabled={disabled} onChange={event => void set("stage:" + step.id, event.target.checked)} />{step.label}</label>)}<p><strong>Условия:</strong> {item.conditions || 'Не установлены'}</p><p><strong>Пропускаемость:</strong> {item.missable === 'yes' ? 'Можно пропустить; сверяйте условия до необратимого решения.' : item.missable === 'no' ? 'Источник не отмечает как пропускаемое.' : 'Требует проверки.'}</p>{item.notes && <p className={styles.notice}>{item.notes}</p>}<p className={styles.hint}>{item.gameVersion ? `Версия/патч: ${item.gameVersion}` : 'Версия игры в источнике не установлена.'} {item.confidence === 'documented' ? 'Условие подтверждено указанным источником.' : 'Сведения сообщества; собственной проверки в игре не было.'}</p><div className={styles.sourceLinks}>{item.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name}{source.author ? " · " + source.author : ""} <ArrowUpRight size={13} /></a>)}</div><DraftInput label={`Заметка к пункту «${item.name}»`} value={String(valueAt(events, game.id, scope, item.id, 'note') || '')} entityId={item.id} scope={scope} field="note" /></details>
    {item.category !== 'counters' && <button className={`${styles.verify} ${status === 'verify' ? styles.verifyActive : ''}`} disabled={disabled} onClick={() => void set('status', status === 'verify' ? 'todo' : 'verify')}>{status === 'verify' ? <><Flag size={14} /> Требует подтверждения действия</> : 'Нужно проверить действие'}</button>}
  </article>;
}
