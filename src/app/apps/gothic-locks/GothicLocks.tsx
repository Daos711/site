"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Castle, Check, ChevronRight, Compass, Copy, Download, KeyRound, LockKeyhole, MapPin, Mountain, Search, ShieldCheck, Sparkles, Trees } from "lucide-react";
import { LOCK_CATALOG as catalog, REGIONS, TYPE_NAMES, CATALOG_ALIASES, filterCatalog } from "@/lib/gothic-locks/catalog";
import type { LockEntry } from "@/lib/gothic-locks/catalog";
import type { LockConfig, Move } from "@/lib/gothic-locks/types";
import { groupMoves, simulateMove, validateConfig, verifySolution } from "@/lib/gothic-locks/simulator";
import { configForPrecision, PRECISION_BY_SKILL, resolveSkillConfig } from "@/lib/gothic-locks/skill";
import type { OrderedConnection } from "@/lib/gothic-locks/skill";
import { updateGothicApp } from "@/lib/gothic-locks/pwa-update";
import { readyFor, guidesFor, solutionCoverage, solutionSignature, restoredReadyStep } from "@/lib/gothic-locks/ready-solutions";
import type { ReadySolution } from "@/lib/gothic-locks/ready-solutions";
import styles from "./gothic-locks.module.css";

type Skill = "none" | "trained" | "master";
type Saved = { skill: Skill; opened: string[]; recent: string[]; changed: string[]; progress: Record<string, { signature: string; step: number }> };
type SolverResult = { status: string; moves?: Move[]; reason?: string };
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const STORAGE = "lab.gothic-locks.v1";
const EMPTY: Saved = { skill: "none", opened: [], recent: [], changed: [], progress: {} };
const skills: { id: Skill; label: string }[] = [{ id: "none", label: "Без навыка" }, { id: "trained", label: "Обучен" }, { id: "master", label: "Мастер" }];
const camps = [
  { id: "old", name: "Старый лагерь", detail: "За стенами замка", icon: Castle },
  { id: "new", name: "Новый лагерь", detail: "У озера и плотины", icon: Mountain },
  { id: "swamp", name: "Болотный лагерь", detail: "Поселение Братства", icon: Trees },
] as const;
const campNames: Record<string, string> = { old: "Старый лагерь", new: "Новый лагерь", swamp: "Болотный лагерь", other: "Другие места" };
const blankConfig = (n = 4): LockConfig => ({ positions: Array(n).fill(4), links: Array.from({ length: n }, () => Array(n).fill(0)), direction: "right-decreases" });
const physicalDirection = (delta: number, config: LockConfig) => (delta === 1) === (config.direction === "right-increases") ? "вправо" : "влево";

function readSaved(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE) || "null");
    if (!raw || typeof raw !== "object") return EMPTY;
    const ids = new Set(catalog.map((entry) => entry.id));
    const canonical = (id: string) => CATALOG_ALIASES[id] || id;
    const list = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string").map(canonical).filter(id=>ids.has(id)))] : [];
    const progress: Saved["progress"] = {};
    if (raw.progress && typeof raw.progress === "object") for (const [id, value] of Object.entries(raw.progress)) {
      const v = value as { signature?: unknown; step?: unknown };
      if (ids.has(canonical(id)) && v && typeof v.signature === "string" && Number.isInteger(v.step) && Number(v.step) >= 0) progress[canonical(id)] = { signature: v.signature, step: Number(v.step) };
    }
    return { skill: skills.some((skill) => skill.id === raw.skill) ? raw.skill : "none", opened: list(raw.opened), recent: list(raw.recent).slice(0, 6), changed: list(raw.changed), progress };
  } catch { return EMPTY; }
}

function SkillPicker({ value, onChange }: { value: Skill; onChange: (skill: Skill) => void }) {
  return <div className={styles.skill} role="group" aria-label="Уровень взлома">{skills.map((skill) => <button key={skill.id} aria-pressed={value === skill.id} onClick={() => onChange(skill.id)}>{skill.label}</button>)}</div>;
}

function PlateDiagram({ positions, active, onPosition }: { positions: number[]; active?: number; onPosition?: (plate: number, value: number) => void }) {
  return <figure className={styles.diagram}>
    <figcaption>Пластины считаются <strong>снизу вверх</strong>. № 1 — самая нижняя.</figcaption>
    <div className={styles.plateLegend}><span>Позиция 1 · левый край</span><span>7 · правый край</span></div>
    <div className={styles.plateStack}>{positions.map((_, index) => positions.length - 1 - index).map((plate) => <div key={plate} className={`${styles.plate} ${active === plate ? styles.activePlate : ""}`}>
      <span className={styles.plateNumber}>№ {plate + 1}</span>
      <div className={styles.track}>{Array.from({ length: 7 }, (_, index) => index + 1).map((position) => onPosition ? <button key={position} type="button" aria-label={`Пластина ${plate + 1}, позиция ${position}`} aria-pressed={positions[plate] === position} onClick={() => onPosition(plate, position)} className={`${styles.pin} ${position === 4 ? styles.center : ""} ${positions[plate] === position ? styles.selectedPin : ""}`}>{position}</button> : <span key={position} className={`${styles.pin} ${position === 4 ? styles.center : ""} ${positions[plate] === position ? styles.selectedPin : ""}`}>{positions[plate] === position ? position : "·"}</span>)}</div>
    </div>)}</div>
    <p className={styles.hint}>Все штифты должны оказаться в центре — в позиции 4.</p>
  </figure>;
}

function ManualEditor({ initial, skill, onSkill, onCalculate, onBack }: { initial?: LockConfig; skill:Skill; onSkill:(skill:Skill)=>void; onCalculate: (config: LockConfig) => void; onBack: () => void }) {
  const [config, setConfig] = useState<LockConfig>(() => initial ? structuredClone(initial) : blankConfig());
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [edgeOrder,setEdgeOrder]=useState("");
  const [fullGraph,setFullGraph]=useState(false);
  const [pruned,setPruned]=useState(false);
  // The selected skill describes the actual mechanism entered below. Changing
  // that label never silently rewrites or discards the user's observed matrix.
  useEffect(() => { setConfirmed(false); setFullGraph(false); setErrors([]); }, [skill]);
  const update = (next: LockConfig) => { setConfig(next); setConfirmed(false); setFullGraph(false); setErrors([]); };
  return <section className={styles.editor}>
    <button className={styles.back} onClick={onBack}><ArrowLeft size={17} /> Назад</button>
    <div className={styles.eyebrow}>СОБСТВЕННАЯ КОНФИГУРАЦИЯ</div>
    <h2>Фактическое состояние замка</h2><SkillPicker value={skill} onChange={(value) => { if (value !== skill) { setConfirmed(false); setFullGraph(false); onSkill(value); } }} />
    <p className={styles.muted}>Введите текущее состояние механизма при выбранном навыке. Смена навыка сохраняет введённые позиции и связи, но требует новой сверки с игрой. Если отмычка сломалась, проверьте механизм заново.</p>
    <div className={styles.editorControls}><label>Количество пластин<select value={config.positions.length} onChange={(event) => update(blankConfig(Number(event.target.value)))}>{[4, 5, 6, 7].map((count) => <option key={count} value={count}>{count}</option>)}</select></label><label>Движение вправо<select value={config.direction} onChange={(event) => update({ ...config, direction: event.target.value as LockConfig["direction"] })}><option value="right-increases">Увеличивает позицию (1 → 7)</option><option value="right-decreases">Уменьшает позицию (7 → 1)</option></select></label></div>
    <h3>1. Положения штифтов</h3>
    <p className={styles.hint}>Нажмите на позицию каждой пластины. Смотрите на механизм так же, как в игре.</p>
    <PlateDiagram positions={config.positions} onPosition={(plate, value) => update({ ...config, positions: config.positions.map((current, index) => index === plate ? value : current) })} />
    <h3>2. Направленные связи</h3>
    <p className={styles.hint}>Строка — какую пластину двигаете. Столбец — какая двигается вместе с ней. «+» — в ту же сторону, «−» — в обратную, «0» — не двигается. Обратная связь не подразумевается.</p>
    <div className={styles.matrixScroll} tabIndex={0} aria-label="Таблица связей, прокрутите в сторону при необходимости"><table className={styles.matrix}><thead><tr><th>Из ↓ / в →</th>{config.positions.map((_, index) => <th key={index}>№ {index + 1}</th>)}</tr></thead><tbody>{config.links.map((row, from) => <tr key={from}><th>№ {from + 1}</th>{row.map((value, to) => <td key={to}>{from === to ? <span className={styles.selfLink}>+</span> : <select aria-label={`Связь из пластины ${from + 1} в ${to + 1}`} value={value} onChange={(event) => update({ ...config, links: config.links.map((line, i) => line.map((v, j) => i === from && j === to ? Number(event.target.value) : v)) })}><option value={0}>0</option><option value={1}>+</option><option value={-1}>−</option></select>}</td>)}</tr>)}</tbody></table></div>
    <details className={styles.details}><summary>Если известен полный граф и авторский порядок связей</summary><p className={styles.hint}>Обычно достаточно ввести действующие связи из игры. Только для полного графа: уровень отключает первые 0 / 1 / 2 связи в авторском порядке. Порядок строк матрицы не является авторским порядком.</p><label className={styles.hint}>Авторский порядок (например, 1&gt;2, 3&gt;1)<input className={styles.orderInput} aria-label="Авторский порядок связей" value={edgeOrder} onChange={e=>{setEdgeOrder(e.target.value);setFullGraph(false);setConfirmed(false);}} /></label><label className={styles.checkLabel}><input type="checkbox" checked={fullGraph} onChange={e=>setFullGraph(e.target.checked)} /> Это полный граф до навыка; порядок подтверждён моим источником</label><button className={styles.secondary} disabled={!fullGraph||pruned} onClick={()=>{const edges=edgeOrder.trim() ? edgeOrder.split(/[,;\n]+/).map(part=>{const m=part.trim().match(/^(\d+)\s*>\s*(\d+)$/);const from=m?Number(m[1])-1:-1,to=m?Number(m[2])-1:-1;return [from,to,config.links[from]?.[to]] as OrderedConnection;}) : [];const next=configForPrecision(config,edges,PRECISION_BY_SKILL[skill]);if(next){update(next);setPruned(true);}else setErrors(["Порядок должен перечислять каждую существующую направленную связь ровно один раз."]);}}>Применить уровень к полному графу</button>{pruned&&<p className={styles.hint}>Уровень применён один раз. Повторное отключение в этом редакторе заблокировано, даже после изменения порядка или навыка. Теперь сверяйте и редактируйте фактические связи из игры.</p>}</details>
    <label className={styles.checkLabel}><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> Я сверил все позиции, связи и направление с механизмом в игре</label>
    {errors.length > 0 && <p role="alert" className={styles.notice}>{errors.join(" ")}</p>}
    <button className={styles.primary} disabled={!confirmed} onClick={() => { const issues = validateConfig(config); setErrors(issues); if (!issues.length) onCalculate(structuredClone(config)); }}><KeyRound size={18} /> Рассчитать безопасное решение</button>
  </section>;
}

function Practice({config,positions,onEdit}:{config:LockConfig;positions:number[];onEdit:(config:LockConfig)=>void}) {
 const [state,setState]=useState(positions);
 const [message,setMessage]=useState("");
 return <details className={styles.details}><summary>Симулятор: проверить отдельный ход</summary><p className={styles.hint}>Пробные ходы меняют только эту схему. Связи направленные; выход любой пластины за границу отклоняет весь ход.</p><PlateDiagram positions={state}/><div className={styles.practiceControls}>{state.map((_,plate)=><div key={plate}><span>№ {plate+1}</span>{([-1,1] as const).map(direction=><button className={styles.secondary} key={direction} onClick={()=>{const next=simulateMove(config,state,{plate,direction});if(next){setState(next);setMessage("Ход допустим; связанные пластины сдвинуты.");}else setMessage("Ход отклонён: одна из пластин выйдет за границу. Состояние сохранено.");}}>{physicalDirection(direction,config)}</button>)}</div>)}</div><p role="status" className={styles.hint}>{message}</p><button className={styles.secondary} onClick={()=>{setState(positions);setMessage("");}}>Сбросить пробные ходы</button><button className={styles.secondary} onClick={()=>onEdit({...config,positions:state})}>Пересчитать из этого состояния</button></details>;
}

function Solution({ config, entry, saved, setSaved, onEdit }: { config: LockConfig; entry?: LockEntry; saved: Saved; setSaved: (updater: (saved: Saved) => Saved) => void; onEdit: (config: LockConfig) => void }) {
  const [result, setResult] = useState<SolverResult | null>(null);
  const [step, setStep] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [resumed, setResumed] = useState(false);
  const signature = JSON.stringify({config,skill:saved.skill});
  const resumeRef = useRef(entry ? saved.progress[entry.id] : undefined);
  const groups = useMemo(() => groupMoves(result?.status === "solved" ? result.moves || [] : []), [result]);
  useEffect(() => {
    const issues = validateConfig(config);
    if (issues.length) { setResult({ status: "invalid", reason: issues.join(" ") }); return; }
    setResult(null); setStep(0);
    let worker: Worker;
    let timer: ReturnType<typeof setTimeout>;
    try {
      worker = new Worker("/apps/gothic-locks-worker.js", { type: "module" });
      timer = setTimeout(() => { worker.terminate(); setResult({ status: "limit", reason: "Расчёт занял слишком много времени. Попробуйте ещё раз или уточните связи." }); }, 25000);
      worker.onmessage = (event: MessageEvent<{ result?: SolverResult; error?: string }>) => {
        clearTimeout(timer);
        const value = event.data.result;
        if (value?.status === "solved" && value.moves && verifySolution(config, value.moves)) {
          setResult(value);
          const previous = resumeRef.current;
          const length = groupMoves(value.moves).length;
          if (attempt === 0 && previous?.signature === signature && previous.step <= length) { setStep(previous.step); setResumed(previous.step > 0); }
        } else setResult(value?.status === "solved" ? { status: "invalid", reason: "Последовательность не прошла проверку. Подсказки скрыты." } : value || { status: "invalid", reason: event.data.error || "Не удалось рассчитать решение." });
        worker.terminate();
      };
      worker.onerror = () => { clearTimeout(timer); worker.terminate(); setResult({ status: "invalid", reason: "Не удалось загрузить решатель. Откройте приложение онлайн и повторите попытку." }); };
      worker.postMessage({ config });
    } catch { setResult({ status: "invalid", reason: "Браузер не смог запустить решатель." }); }
    return () => { clearTimeout(timer); worker?.terminate(); };
  }, [config, signature, attempt]);
  const state = useMemo(() => {
    let positions = [...config.positions];
    for (const group of groups.slice(0, step)) for (let i = 0; i < group.count; i++) positions = simulateMove(config, positions, { plate: group.plate, direction: group.direction }) || positions;
    return positions;
  }, [config, groups, step]);
  const changeStep = (next: number) => {
    setStep(next); setResumed(false);
    if (entry) setSaved((current) => ({ ...current, progress: { ...current.progress, [entry.id]: { signature, step: next } } }));
  };
  const current = groups[step];
  const direction = current ? physicalDirection(current.direction, config) : "";
  const text = groups.map((group, index) => `${index + 1}. Пластина № ${group.plate + 1} — ${physicalDirection(group.direction, config)} ${group.count} раз.`).join("\n");
  return <section className={styles.solution}>
    <p className={styles.hint}>Уровень: <strong>{skills.find(s => s.id === saved.skill)?.label}</strong>. Расчёт только для сверенных вами положений и связей. Смена навыка может отключать связи; после изменения механизма нужна новая проверка.</p>
    <details className={styles.details}><summary>Сверить исходное состояние и связи</summary><PlateDiagram positions={config.positions} /><div className={styles.linkList}>{config.links.map((row, plate) => <p key={plate}><strong>№ {plate + 1}:</strong> {row.map((value, target) => target !== plate && value ? `№ ${target + 1} ${value === 1 ? "в ту же сторону" : "в обратную сторону"}` : "").filter(Boolean).join("; ") || "двигается отдельно"}</p>)}</div><p>Вправо — {config.direction === "right-increases" ? "к позиции 7" : "к позиции 1"}.</p></details>
    {!result && <div className={styles.calculating} role="status"><span className={styles.spinner} /> Проверяем каждый ход…</div>}
    {result && result.status !== "solved" && <div className={styles.notice} role="alert"><h3>{result.status === "unsolvable" ? "Безопасного решения нет" : result.status === "limit" ? "Расчёт не завершён" : "Не удалось выдать подсказку"}</h3><p>{result.reason || "Проверьте исходные положения и направленные связи. Решатель не предлагает ходы с повреждением отмычки."}</p><button className={styles.secondary} onClick={() => setAttempt((value) => value + 1)}>Повторить расчёт</button></div>}
    {result?.status === "solved" && <>
      {resumed && <p className={styles.notice}>Продолжение сохранённой инструкции. Убедитесь, что замок в игре остался в показанном ниже состоянии.</p>}
      <div className={styles.command} aria-live="polite" aria-atomic="true">
        <div className={styles.commandMeta}><span>{current ? `ШАГ ${step + 1} ИЗ ${groups.length}` : "ПОСЛЕДОВАТЕЛЬНОСТЬ ЗАВЕРШЕНА"}</span><span><ShieldCheck size={15} /> Без поломок</span></div>
        {current ? <><h3>Пластина № {current.plate + 1}</h3><div className={styles.motion}>{direction === "влево" ? <ArrowLeft size={34} /> : <ArrowRight size={34} />} {direction} <strong>{current.count}</strong> раз</div><p>№ 1 — нижняя пластина. Выполните всю команду, затем нажмите «Готово».</p></> : <><h3>{groups.length ? "Все штифты в центре" : "Замок уже в открытом состоянии"}</h3><p>Если состояние в игре совпадает, замок должен открыться.</p></>}
        <progress value={step} max={Math.max(groups.length, 1)} aria-label="Прогресс открытия" />
      </div>
      <div className={styles.stepActions}><button className={styles.secondary} disabled={step === 0} onClick={() => changeStep(Math.max(0, step - 1))}><ArrowLeft size={17} /> Назад</button>{current ? <button className={styles.primary} onClick={() => changeStep(step + 1)}>Готово, следующий шаг <ArrowRight size={17} /></button> : entry ? <button className={styles.primary} onClick={() => setSaved((current) => ({ ...current, opened: [...new Set([...current.opened, entry.id])] }))}><Check size={18} /> {saved.opened.includes(entry.id) ? "Отмечено: вскрыт" : "Отметить вскрытым"}</button> : null}</div>
      <PlateDiagram positions={state} active={current?.plate} />
      <p className={styles.hint}>На схеме — ожидаемое состояние <strong>до текущей команды</strong>.</p>
      <p className={styles.hint}>«Назад» и «Начать заново» меняют только инструкцию. Они не отменяют движения в игре.</p>
      <button className={styles.textButton} onClick={() => changeStep(0)}>Начать заново</button>
      <details className={styles.details}><summary>Вся комбинация · {result.moves?.length || 0} движений</summary><ol className={styles.moveList}>{groups.map((group, index) => <li key={index} className={index === step ? styles.currentMove : ""}>№ {group.plate + 1} — {physicalDirection(group.direction, config)} {group.count} раз</li>)}</ol><button className={styles.secondary} onClick={async () => { try { await navigator.clipboard.writeText(`${entry?.name || "Мой замок"}\nПластины снизу вверх. Только для состояния ${config.positions.join(", ")}.\n${text}`); setCopyStatus("Комбинация скопирована"); } catch { setCopyStatus("Копирование недоступно. Выделите текст комбинации вручную."); } }}><Copy size={16} /> Копировать комбинацию</button><p role="status">{copyStatus}</p></details>
    </>}
    <Practice key={`${signature}|${step}`} config={config} positions={state} onEdit={onEdit} />
    <button className={styles.changeState} onClick={() => onEdit({ ...config, positions: state })}>Положения изменились / отмычка сломалась</button>
    <p className={styles.hint}>Расчёт проверен симуляцией. Проверка этой комбинации в вашей версии игры на PS5 не выполнена.</p>
  </section>;
}

function ReadyPlayer({ solution, entry, saved, setSaved, onEdit }: { solution: ReadySolution; entry: LockEntry; saved: Saved; setSaved: (updater: (saved: Saved) => Saved) => void; onEdit: (config?: LockConfig) => void }) {
  const licensedGuide = solution.source.url.startsWith("https://landofgames.ru/");
  const groups = useMemo(() => groupMoves(solution.moves), [solution]);
  const signature = solutionSignature(solution);
  const [step, setStep] = useState(() => restoredReadyStep(solution, saved.progress[entry.id]));
  const [copyStatus, setCopyStatus] = useState("");
  const current = groups[step];
  const config = solution.config;
  const state = useMemo(() => {
    if (!config) return null;
    let positions = config.positions.slice();
    for (const group of groups.slice(0, step)) for (let n = 0; n < group.count; n++) {
      const next = simulateMove(config, positions, group);
      if (!next) return null;
      positions = next;
    }
    return positions;
  }, [config, groups, step]);
  const direction = (move: Move) => physicalDirection(move.direction, { direction: solution.direction } as LockConfig);
  const changeStep = (next: number) => {
    setStep(next);
    setSaved(value => ({ ...value, progress: { ...value.progress, [entry.id]: { signature, step: next } } }));
  };
  const currentConfig = config && state ? { ...config, positions: state } : undefined;
  return <section className={`${styles.solution} ${licensedGuide ? styles.attributedGuide : ""}`} data-testid="ready-solution" data-solution-id={solution.id}>
    <div className={styles.readyHeading}><h3>Готовая комбинация</h3><span>{skills.find(skill => skill.id === solution.skill)?.label}</span></div>
    {licensedGuide && <div className={styles.licensedCredit} data-testid="land-attribution"><a href={solution.source.url} target="_blank" rel="noreferrer">Land of Games</a><p>Автор: Zorthrus. Адаптация опубликованной инструкции для личного некоммерческого справочника.</p></div>}
    {(config || solution.configAlternatives?.[0]) && <p className={styles.hint} data-testid="initial-fingerprint">Исходные позиции снизу вверх: <strong>{(config || solution.configAlternatives![0]).positions.join("–")}</strong>.</p>}
    <p className={styles.hint}>{solution.verification === "simulated" ? solution.derivation === "universal" ? "Каждое нажатие допустимо во всех совместимых моделях связей, включая промежуточные положения и границы." : solution.derivation === "inferred" ? "Каждое нажатие проверено для математически выведенной модели, включая связанные пластины и границы." : "Каждое нажатие проверено симуляцией опубликованного механизма, включая связанные пластины и границы." : "Последовательность опубликована в руководстве. Без полной схемы связей проверить каждый ход симуляцией нельзя."} В вашей версии игры на PS5 нами не проверена.</p>
    {solution.derivation && solution.derivation !== "observed" && <p className={styles.hint}>Модель навыка восстановлена математически по опубликованным маршрутам. Сверьте исходные позиции с игрой.</p>}
    <p className={styles.hint}>№ 1 — ближайшая к отмычке, нижняя пластина; дальше считайте снизу вверх. Стрелка означает направление движения в игре.</p>
    {step > 0 && <p className={styles.notice}>Сохранён шаг {Math.min(step + 1, groups.length)}. Продолжайте, только если в игре вы остановились на том же месте.</p>}
    <div className={styles.command} aria-live="polite" aria-atomic="true">
      <div className={styles.commandMeta}><span>{current ? `ШАГ ${step + 1} ИЗ ${groups.length}` : "ПОСЛЕДОВАТЕЛЬНОСТЬ ЗАВЕРШЕНА"}</span><span>{solution.verification === "simulated" ? "Проверено расчётом" : "По руководству"}</span></div>
      {current ? <><h3>Пластина № {current.plate + 1}</h3><div className={styles.motion}>{direction(current) === "влево" ? <ArrowLeft size={34} /> : <ArrowRight size={34} />} {direction(current)} <strong>{current.count}</strong> раз</div><p>Одно нажатие — один сдвиг. Выполните команду в игре и переходите дальше.</p></> : <><h3>Все шаги выполнены</h3><p>Если замок открылся в игре, отметьте его вскрытым.</p></>}
      <progress value={step} max={groups.length} aria-label="Прогресс открытия" />
    </div>
    <div className={styles.stepActions}><button className={styles.secondary} disabled={step === 0} onClick={() => changeStep(step - 1)}><ArrowLeft size={17} /> Назад</button>{current ? <button className={styles.primary} onClick={() => changeStep(step + 1)}>Следующий шаг <ArrowRight size={17} /></button> : <button className={styles.primary} onClick={() => setSaved(value => ({ ...value, opened: [...new Set([...value.opened, entry.id])] }))}><Check size={18} />{saved.opened.includes(entry.id) ? "Отмечено: вскрыт" : "Замок открылся — отметить"}</button>}</div>
    <p className={styles.hint}>«Назад» и «Начать заново» меняют только подсказку, не отменяя ходов в игре.</p>
    <button className={styles.textButton} onClick={() => changeStep(0)}>Начать заново</button>
    {config && state && <><PlateDiagram positions={state} active={current?.plate} /><p className={styles.hint}>Ожидаемое состояние до текущей команды. Если оно не совпало с игрой, остановитесь и пересчитайте.</p><details className={styles.details}><summary>Исходное состояние и направленные связи</summary><PlateDiagram positions={config.positions} />{config.links.map((row, from) => <p key={from}>№ {from + 1}: {row.map((sign, to) => sign ? `№ ${to + 1} ${sign === 1 ? "в ту же сторону" : "в обратную сторону"}` : "").filter(Boolean).join("; ") || "без связей"}</p>)}<p>«Вправо» {config.direction === "right-decreases" ? "уменьшает" : "увеличивает"} номер позиции.</p></details><Practice key={`${signature}|${step}`} config={config} positions={state} onEdit={onEdit} /></>}
    {solution.verification === "published" && <p className={styles.notice}>Решение не подтверждено симуляцией. Исходные положения и связи не опубликованы. Если пластина упирается в край, не повторяйте нажатие — введите механизм для расчёта.</p>}
    <button className={styles.changeState} onClick={() => onEdit(currentConfig)}>Положения изменились / пересчитать решение</button>
    <details className={styles.details}><summary>Вся комбинация · {solution.moves.length} движений</summary><ol className={styles.moveList}>{groups.map((move, index) => <li key={index} className={index === step ? styles.currentMove : ""}>№ {move.plate + 1} — {direction(move)} {move.count} раз</li>)}</ol><button className={styles.secondary} onClick={async () => { try { await navigator.clipboard.writeText(`${entry.name}\n${skills.find(skill => skill.id === solution.skill)?.label}. № 1 — ближайшая нижняя пластина.\n${groups.map(move => `№ ${move.plate + 1} ${direction(move)} ×${move.count}`).join("\n")}\nИсточник: ${solution.source.name}\n${solution.source.url}\nЛицензия: ${solution.source.license}\n${solution.evidence.filter(source => source.url.includes("creativecommons.org/")).map(source => source.url).join("\n")}${solution.source.license === "CC-BY-NC-SA-4.0" ? "\nАдаптация: русские названия; нормализованные номера пластин, направления и отдельные нажатия." : ""}\nПроверка: ${solution.verification === "simulated" ? "математическая симуляция" : "опубликовано в руководстве; без полной симуляции"}. На PS5 нами не проверено.`); setCopyStatus("Комбинация скопирована"); } catch { setCopyStatus("Выделите текст комбинации для копирования."); } }}><Copy size={16} /> Копировать комбинацию</button><p role="status">{copyStatus}</p></details>
    {solution.configAlternatives && <details className={styles.details}><summary>Проверены все допустимые варианты связей</summary>{solution.modelCoverage ? <p>Граф связей неоднозначен{solution.modelCoverage.fullModelCount ? `: совместимы ${solution.modelCoverage.fullModelCount} моделей` : ""}. Проверка на {solution.modelCoverage.witnessCount} допустимых схемах покрывает все возможные влияния на каждую пластину. Поэтому каждое нажатие безопасно для всех совместимых моделей. Это математическое покрытие, а не выбор наиболее вероятной схемы.</p> : <p>Порядок отключения связей неоднозначен. Эта последовательность безопасна для каждой из {solution.configAlternatives.length} допустимых схем; приложение не выбирает одну из них произвольно.</p>}<p>При расхождении с игрой введите действующие связи вручную.</p><PlateDiagram positions={solution.configAlternatives[0].positions}/></details>}
    <details className={styles.details}><summary>Как получена и проверена комбинация</summary>{solution.notes.map(note=><p className={styles.hint} key={note}>{note}</p>)}</details>
    <p className={styles.sourceNote}>Источник: <a href={solution.source.url} target="_blank" rel="noreferrer">{solution.source.name} ↗</a> · {solution.source.license}. {solution.evidence.map(source => <span key={source.url}> <a href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a></span>)} {solution.gameVersion ? `Версия: ${solution.gameVersion}.` : "Версия игры источником не указана."}</p>
  </section>;
}


export default function GothicLocks() {
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [storageIssue, setStorageIssue] = useState(false);
  const [query, setQuery] = useState("");
  const [region,setRegion]=useState("");
  const [area,setArea]=useState("");
  const [objectType,setObjectType]=useState("");
  const [dataStatus,setDataStatus]=useState("");
  const [readyOnly,setReadyOnly]=useState(false);
  const [readyVariant,setReadyVariant]=useState("");
  const [confirmedState,setConfirmedState]=useState<string|null>(null);
  const [showMap,setShowMap]=useState(false);
  const [camp, setCamp] = useState<string | null>(null);
  const [valuable, setValuable] = useState(false);
  const [hideOpened, setHideOpened] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [draft, setDraft] = useState<LockConfig>();
  const [custom, setCustom] = useState<LockConfig>();
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [offline, setOffline] = useState(false);
  const [cacheReady, setCacheReady] = useState(false);
  const [updateAvailable,setUpdateAvailable]=useState(false);
  const [updating,setUpdating]=useState(false);
  const [updateError,setUpdateError]=useState("");
  const headingRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setSaved(readSaved()); setLoaded(true);
    const readHash = () => { const requestedId = new URLSearchParams(window.location.hash.slice(1)).get("lock"); const id = requestedId ? CATALOG_ALIASES[requestedId] || requestedId : null; setSelected(id && catalog.some((entry) => entry.id === id) ? id : null); setManual(false); setCustom(undefined); };
    readHash();
    const updateOnline = () => setOffline(!navigator.onLine);
    updateOnline();
    const onInstall = (event: Event) => { event.preventDefault(); setInstall(event as InstallEvent); };
    window.addEventListener("hashchange", readHash);
    window.addEventListener("online", updateOnline); window.addEventListener("offline", updateOnline);
    window.addEventListener("beforeinstallprompt", onInstall);
    let alive = true;
    const checkOffline = async () => {
      if (!("serviceWorker" in navigator)) return;
      const registration = await navigator.serviceWorker.getRegistration("/apps/gothic-locks");
      if (!registration?.active) { if (alive) setCacheReady(false); return; }
      const channel = new MessageChannel();
      const timer = setTimeout(() => { channel.port1.close(); if (alive) setCacheReady(false); }, 5000);
      channel.port1.onmessage = (event) => { clearTimeout(timer); channel.port1.close(); if (alive) setCacheReady(event.data?.ready === true); };
      registration.active.postMessage({ type: "GOTHIC_CHECK_OFFLINE" }, [channel.port2]);
    };
    let registration:ServiceWorkerRegistration|undefined;
    let watched:ServiceWorker|null=null;
    let lastUpdateCheck=0;
    const watchState=()=>{if(alive && registration?.waiting) setUpdateAvailable(true);};
    const watchUpdate=()=>{watched?.removeEventListener("statechange",watchState);watched=registration?.installing||null;watched?.addEventListener("statechange",watchState);watchState();};
    const hadController=!!navigator.serviceWorker?.controller;
    const refreshOffline = () => { void checkOffline().catch(() => { if (alive) setCacheReady(false); }); };
    const onFocus=()=>{refreshOffline();if(registration && Date.now()-lastUpdateCheck>60000){lastUpdateCheck=Date.now();void registration.update().catch(()=>{});}};
    const onControllerChange=()=>{refreshOffline();if(alive && hadController) setUpdateAvailable(true);};
    window.addEventListener("focus", onFocus);
    if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/apps/gothic-locks-sw.js", { scope: "/apps/gothic-locks", updateViaCache:"none" }).then((value) => { if(!alive)return;registration=value;registration.addEventListener("updatefound",watchUpdate);watchUpdate();return navigator.serviceWorker.ready; }).then(()=>{if(alive)return checkOffline();}).catch(() => { if (alive) setCacheReady(false); });
    }
    return () => { alive = false; registration?.removeEventListener("updatefound",watchUpdate);watched?.removeEventListener("statechange",watchState);window.removeEventListener("focus", onFocus); if ("serviceWorker" in navigator) navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange); window.removeEventListener("hashchange", readHash); window.removeEventListener("online", updateOnline); window.removeEventListener("offline", updateOnline); window.removeEventListener("beforeinstallprompt", onInstall); };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE, JSON.stringify(saved)); setStorageIssue(false); } catch { setStorageIssue(true); }
  }, [saved, loaded]);
  const entry = catalog.find((item) => item.id === selected);
  const readyOptions = entry ? readyFor(entry.id,saved.skill) : [];
  const readySolution = readyOptions.find(solution => solution.id === readyVariant) || readyOptions[0];
  const entryGuides = entry ? guidesFor(entry.id,saved.skill) : [];
  const previousProgress = entry ? saved.progress[entry.id] : undefined;
  const staleReadyProgress = !!(readySolution && previousProgress && previousProgress.step > 0 && previousProgress.signature !== solutionSignature(readySolution));
  const allReadySkills = entry ? [...new Set(readyFor(entry.id).map(solution => solution.skill))] : [];
  const coverage = solutionCoverage(catalog);
  const skillCoverage = solutionCoverage(catalog,saved.skill);
  const confirmedProfile = useMemo(() => { const profileEntry = catalog.find(item => item.id === selected); return profileEntry ? resolveSkillConfig(profileEntry.config,profileEntry.profiles,saved.skill) : null; }, [selected, saved.skill]);
  const confirmationKey = entry ? `${entry.id}|${saved.skill}|${JSON.stringify(entry.config)}` : null;
  const changeSkill = (skill: Skill) => {
    if (skill === saved.skill) return;
    setConfirmedState(null);
    setSaved((current) => ({ ...current, skill, changed: entry && (current.progress[entry.id]?.step || 0) > 0 ? [...new Set([...current.changed,entry.id])] : current.changed }));
  };
  const filtered = filterCatalog({query,camp,region,area,type:objectType,valuable,hideOpened,opened:saved.opened}).filter(item=>{
    const available=readyFor(item.id,saved.skill);
    const guides=guidesFor(item.id,saved.skill);
    const status=(item.access==="key"||item.access==="unlocked")?"not-required":available.length?'ready':guides.length?'external':'missing';
    return (!readyOnly||available.length>0)&&(!dataStatus||dataStatus===status||available.some(solution=>solution.verification===dataStatus));
  });
  const sectors = [...new Set(filtered.map((item) => `${item.camp}|${item.sector}`))];
  const openEntry = (item: LockEntry) => { setSelected(item.id); setManual(false); setCustom(undefined); window.history.pushState(null, "", `#lock=${encodeURIComponent(item.id)}`); setSaved((current) => ({ ...current, recent: [item.id, ...current.recent.filter((id) => id !== item.id)].slice(0, 6) })); headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const backToCatalog = () => { setSelected(null); setManual(false); setCustom(undefined); window.history.pushState(null, "", window.location.pathname); };
  const edit = (config?: LockConfig) => { setConfirmedState(null); if (entry) setSaved((current) => { const progress = { ...current.progress }; delete progress[entry.id]; return { ...current, progress, changed: [...new Set([...current.changed, entry.id])] }; }); setDraft(config); setCustom(undefined); setManual(true); headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return <div className={styles.app} ref={headingRef}>
    <header className={styles.header}><a href="/apps" className={styles.labLink}><ArrowLeft size={14} /> Приложения Lab</a><span className={styles.connection}><span className={cacheReady ? styles.readyDot : styles.statusDot} />{offline ? "Без интернета" : cacheReady ? "Доступно офлайн" : "Локальные сохранения"}</span></header>
    {updateAvailable && <div className={styles.notice} role="status"><strong>Доступна новая версия справочника.</strong><p>Отметки сохранятся. Текущий ручной ввод завершите перед обновлением.</p><button className={styles.primary} disabled={updating} onClick={async()=>{setUpdating(true);setUpdateError("");try{await updateGothicApp();window.location.reload();}catch(error){setUpdateError(error instanceof Error?error.message:"Не удалось обновить приложение.");setUpdating(false);}}}>{updating ? "Обновляем…" : "Обновить справочник"}</button>{updateError&&<p>{updateError}</p>}</div>}
    <div className={styles.brand}><div className={styles.brandIcon}><KeyRound size={28} strokeWidth={1.4} /></div><div><span className={styles.eyebrow}>СПРАВОЧНИК КОЛОНИИ</span><h1>Gothic Remake <span>— Замки</span></h1></div></div>
    {storageIssue && <p className={styles.notice} role="status">Браузер запретил сохранение. Отметки и настройки сохраняются только до закрытия страницы.</p>}
    {manual ? <ManualEditor initial={draft} skill={saved.skill} onSkill={changeSkill} onCalculate={(config) => { setCustom(config); setManual(false); }} onBack={() => { setManual(false); setDraft(undefined); }} /> : custom ? <section><button className={styles.back} onClick={backToCatalog}><ArrowLeft size={17} /> К каталогу</button><h2>Мой замок</h2><p className={styles.muted}>Решение для введённого вами состояния.</p><Solution key={JSON.stringify(custom)} config={custom} saved={saved} setSaved={setSaved} onEdit={edit} /></section> : entry ? <section className={styles.entry}>
      <button className={styles.back} onClick={backToCatalog}><ArrowLeft size={17} /> {camp ? campNames[camp] : "Все замки"}</button>
      <div className={styles.eyebrow}>{campNames[entry.camp]} · {TYPE_NAMES[entry.type].toLocaleUpperCase("ru")}</div>
      <div className={styles.entryTitle}><h2>{entry.name}</h2><button className={`${styles.openedButton} ${saved.opened.includes(entry.id) ? styles.isOpened : ""}`} aria-pressed={saved.opened.includes(entry.id)} onClick={() => setSaved((current) => ({ ...current, opened: current.opened.includes(entry.id) ? current.opened.filter((id) => id !== entry.id) : [...current.opened, entry.id] }))}><Check size={16} /> {saved.opened.includes(entry.id) ? "Уже вскрыт" : "Отметить вскрытым"}</button></div>
      <div className={styles.location}><MapPin size={20} /><div><strong>{entry.sector}</strong><p>{entry.route || "Точный маршрут пока не подтверждён. Сверьте название и исходное состояние замка."}{entry.floor ? ` Этаж: ${entry.floor}.` : ""}</p><a href={entry.mapUrl || "https://gothic1remake.th.gl/ru"} target="_blank" rel="noreferrer">{entry.mapUrl ? "Этот объект на внешней карте ↗" : "Открыть внешнюю карту ↗"}</a></div></div>
      <p className={styles.hint}>{entry.locationPrecision === "landmark" ? "Есть ориентир" : entry.locationPrecision === "area" ? "Известен только район" : "Местоположение не установлено"} · {entry.gameVersion ? `Версия ${entry.gameVersion}` : "Версия игры не указана"} · {entry.chapter ? `Глава: ${entry.chapter}` : "Глава не подтверждена"}.</p>
      <SkillPicker value={saved.skill} onChange={changeSkill} />
      {entry.identity === "uncertain" && <p className={styles.notice}>Идентификация объекта требует сверки. Сравните название, место и исходное положение пластин с игрой.</p>}
      {entry.id === "cor-galom-second-variant" && <p className={styles.notice}>Второй сундук Кор Галома: источники расходятся. Это вариант с позицией 5 у второй пластины; при несовпадении введите состояние вручную.</p>}
      <details className={styles.details}><summary>Добыча, источники и статус проверки</summary>
      {entry.locationSources && <p className={styles.sourceNote}>Ориентиры: {entry.locationSources.map((source, index) => <span key={source.url}>{index > 0 ? " · " : ""}<a href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a></span>)}</p>}<div className={styles.lootBlock} data-testid="loot-details" data-loot-status={entry.loot?.coverage || (entry.contents.length ? "partial" : "missing")}>
        {entry.loot?.coverage === "empty" ? <p className={styles.hint}>По сообщению источника сундук пуст.</p> : entry.contents.length > 0 ? <><p className={styles.loot}><Sparkles size={16} /> {entry.loot?.coverage === "listed" ? "Содержимое по источнику" : "Известная часть добычи"}:</p><ul className={styles.lootList}>{entry.contents.map((item, index) => <li key={index}>{item}</li>)}</ul></> : <p className={styles.hint}>Сверенный список добычи пока отсутствует.</p>}
        {entry.loot?.coverage === "partial" && <p className={styles.hint}>Список неполный или содержит неуточнённые сведения.</p>}
        {entry.loot?.note && <p className={styles.hint}>{entry.loot.note}</p>}
        {entry.loot?.sources.length ? <p className={styles.lootSources}>Источники добычи: {entry.loot.sources.map((source, index) => <span key={source.url}>{index > 0 ? " · " : ""}<a href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a>{source.author ? " (автор: " + source.author + ")" : ""}</span>)}.</p> : null}
        {entry.lootExternal?.length ? <p className={styles.lootSources}>Посмотреть добычу во внешнем справочнике: {entry.lootExternal.map((source, index) => <span key={source.url}>{index > 0 ? " · " : ""}<a href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a></span>)}.</p> : null}
        {entry.loot && <p className={styles.hint}>Сведения сверены {entry.loot.reviewedAt.split("-").reverse().join(".")}. В игре нами не проверено.</p>}
      </div>
      {entry.warnings.map((warning) => <p key={warning} className={styles.notice}>{warning}</p>)}
      <p className={styles.sourceNote}>Данные: <a href={entry.source.url} target="_blank" rel="noreferrer">{entry.source.name} ↗</a> · {entry.gameVersion ? `Версия ${entry.gameVersion}` : "Версия игры не указана"}. {entry.notes}</p>
      </details>
      {entryGuides.length > 0 && <details className={styles.details} open={!readySolution}><summary>Руководства для этого замка · {entryGuides.length}</summary><div className={styles.guideLinks}>{entryGuides.map(guide=><a key={guide.url+guide.skill} className={styles.secondary} href={guide.url} target="_blank" rel="noreferrer">{guide.name} · {guide.skill === "unknown" ? "навык не указан" : skills.find(skill=>skill.id===guide.skill)?.label} ↗</a>)}<p className={styles.hint}>Открывается конкретная карточка или раздел руководства. Для внешних страниц нужен интернет.</p></div></details>}
      {allReadySkills.length > 0 && !readySolution && <div className={styles.notice}><h3>Для выбранного навыка встроенной комбинации пока нет</h3><p>Есть готовые шаги для: {allReadySkills.map(skill=>skills.find(item=>item.id===skill)?.label).join(", ")}. Используйте их только при совпадении с навыком героя в игре.</p></div>}
      {readyOptions.length > 1 && <label className={styles.variantPicker}>Вариант исходного состояния<select aria-label="Вариант комбинации" value={readySolution?.id||""} onChange={event=>setReadyVariant(event.target.value)}>{readyOptions.map(solution=><option key={solution.id} value={solution.id}>{solution.variantName}</option>)}</select></label>}
      {entry.access === "key" || entry.access === "unlocked" ? <div className={styles.notice}><h3>{entry.access === "key" ? "Открывается ключом" : "Замок взламывать не нужно"}</h3><p>{entry.access === "key" ? "Источник указывает открытие ключом. Место и условия получения указаны в ориентирах, если известны." : "По источнику этот контейнер открыт. Комбинация отмычки ему не требуется."}</p></div> : loaded && readySolution ? (saved.changed.includes(entry.id) || staleReadyProgress) ? <div className={styles.notice}><h3>Состояние этого замка изменено</h3><p>Сохранённая инструкция относится к другому навыку, варианту или уже изменённому механизму. Введите текущее состояние или подтвердите, что вернули замок к началу.</p>{readySolution.config&&<PlateDiagram positions={readySolution.config.positions}/>}<button className={styles.primary} onClick={()=>edit(readySolution.config||undefined)}>Ввести текущее состояние</button><button className={styles.secondary} onClick={()=>setSaved(value=>{const progress={...value.progress};delete progress[entry.id];return {...value,progress,changed:value.changed.filter(id=>id!==entry.id)};})}>Механизм возвращён к исходному состоянию</button></div> : <ReadyPlayer key={readySolution.id} solution={readySolution} entry={entry} saved={saved} setSaved={setSaved} onEdit={edit}/> : (!loaded ? <p role="status">Загрузка сохранений…</p> : entry.config && saved.changed.includes(entry.id) ? <div className={styles.notice}><h3>Состояние этого замка изменено</h3><p>Прежняя инструкция сброшена. Введите текущие положения и связи или подтвердите, что механизм полностью возвращён к исходному состоянию из каталога.</p><PlateDiagram positions={entry.config.positions} /><details className={styles.details}><summary>Связи исходного состояния</summary>{entry.config.links.map((row, plate) => <p key={plate}>№ {plate + 1}: {row.map((value, target) => target !== plate && value ? `№ ${target + 1} ${value === 1 ? "в ту же сторону" : "в обратную"}` : "").filter(Boolean).join("; ") || "без связей"}</p>)}</details><button className={styles.primary} onClick={() => edit(entry.config || undefined)}>Ввести текущее состояние</button><button className={styles.secondary} onClick={() => { setConfirmedState(confirmationKey); setSaved((current) => ({ ...current, changed: current.changed.filter((id) => id !== entry.id) })); }}>Проверил: исходные позиции и связи совпадают</button></div> : confirmedProfile ? <Solution key={`${entry.id}|${saved.skill}|profile`} config={confirmedProfile} entry={entry} saved={saved} setSaved={setSaved} onEdit={edit} /> : entry.config && confirmedState !== confirmationKey ? <div className={styles.notice}><h3>Решение не подтверждено для выбранного навыка</h3><p>Есть наблюдение игрока, но его навык и версия неизвестны. Сравните все позиции и связи с текущим механизмом. Совпадение запускает расчёт с первого шага. Для продолжения изменённого замка введите фактическое состояние.</p><PlateDiagram positions={entry.config.positions} /><div className={styles.linkList}>{entry.config.links.map((row,plate)=><p key={plate}><strong>№ {plate+1}:</strong> {row.map((v,to)=>v ? `№ ${to+1} ${v===1 ? "в ту же сторону" : "в обратную сторону"}` : "").filter(Boolean).join("; ") || "без связей"}</p>)}</div><p>Кнопка «вправо» {entry.config.direction === "right-decreases" ? "уменьшает" : "увеличивает"} позицию.</p><button className={styles.primary} onClick={()=>{setConfirmedState(confirmationKey);setSaved(current=>{const progress={...current.progress};delete progress[entry.id];return {...current,progress};});}}>Проверил позиции и связи для выбранного навыка</button><button className={styles.secondary} onClick={()=>edit(entry.config || undefined)}>Ввести фактическое состояние</button></div> : entry.config ? <Solution key={`${entry.id}|${saved.skill}`} config={entry.config} entry={entry} saved={saved} setSaved={setSaved} onEdit={edit} /> : <div className={styles.notice}><h3>Решение не подтверждено</h3><p>{entry.plateCount ? `Источник указывает ${entry.plateCount} пластин. ` : ""}Нет разрешённого полного набора исходных положений и направленных связей для выбранного навыка. Введите механизм из игры для проверяемого расчёта.</p><button className={styles.primary} onClick={() => edit()}>Ввести состояние вручную</button></div>)}

    </section> : <>
      <p className={styles.intro}>Найдите свой замок. Выберите навык героя и откройте его шаг за шагом.</p>
      <div className={styles.coverage} data-testid="catalog-coverage"><strong>{coverage.total} карточек · {coverage.chests} сундуков</strong><span>Готовая комбинация: {coverage.ready}</span><span>Только внешнее руководство: {coverage.external}</span><span>Пока без решения: {coverage.missing}</span>{coverage.notRequired > 0 && <span>Открыто или нужен ключ: {coverage.notRequired}</span>}<small>Числа по всем навыкам; один объект считается один раз. Для вашего навыка готовые шаги: {skillCoverage.ready}. Проверка расчётом и публикация автора указаны отдельно от проверки в игре.</small></div>
      <section className={styles.catalogSkill}><span className={styles.eyebrow}>НАВЫК ГЕРОЯ В ИГРЕ</span><SkillPicker value={saved.skill} onChange={changeSkill}/><label className={styles.checkLabel}><input type="checkbox" checked={readyOnly} onChange={event=>setReadyOnly(event.target.checked)}/> Есть готовая комбинация для выбранного навыка</label></section>
      <label className={styles.search}><Search size={20} /><input aria-label="Поиск сундука или персонажа" placeholder="Имя, место или положения пластин…" value={query} onChange={(event) => { setQuery(event.target.value); if (event.target.value) setCamp(null); }} />{query && <button aria-label="Очистить поиск" onClick={() => setQuery("")}>×</button>}</label>
      <div className={styles.camps}>{camps.map(({ id, name, detail, icon: Icon }) => <button key={id} className={`${styles.camp} ${camp === id ? styles.selectedCamp : ""}`} aria-pressed={camp === id} onClick={() => { setCamp(camp === id ? null : id); setRegion(""); setQuery(""); }}><Icon className={styles.campIcon} size={35} strokeWidth={1.3} /><div><h2>{name}</h2><p>{detail}</p><span>Объектов: {catalog.filter((entry) => entry.camp === id).length} · сундуков: {catalog.filter((entry) => entry.camp === id && (entry.type === "chest" || entry.type === "underwater")).length}</span></div><ChevronRight size={18} /></button>)}</div>
      <div className={styles.browseBar}><button className={styles.textButton} aria-pressed={camp === "other"} onClick={() => { setCamp(camp === "other" ? null : "other"); setQuery(""); }}><Compass size={16} /> Другие места</button>{camp && <button className={styles.textButton} onClick={() => setCamp(null)}>Все лагеря</button>}<button className={styles.textButton} onClick={() => edit()}><KeyRound size={16} /> Моего сундука нет</button><span>{saved.opened.length} / {catalog.length} вскрыто</span></div>
      <div className={styles.regionFilters}><label>Район Колонии<select aria-label="Район Колонии" value={region} onChange={e=>{setRegion(e.target.value);setCamp(null);}}><option value="">Все районы</option>{REGIONS.map(r=><option key={r.id} value={r.id}>{r.name} ({catalog.filter(e=>e.region===r.id).length})</option>)}</select></label><label>Тип объекта<select aria-label="Тип объекта" value={objectType} onChange={e=>setObjectType(e.target.value)}><option value="">Все типы</option>{Object.entries(TYPE_NAMES).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>Местность<select aria-label="Местность" value={area} onChange={e=>setArea(e.target.value)}><option value="">Любая местность</option>{[["mine","Шахты"],["castle","Замки и крепости"],["tower","Башни"],["cave","Пещеры"],["dungeon","Подземелья"],["underwater","Под водой"]].map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label><label>Полнота данных<select aria-label="Полнота данных" value={dataStatus} onChange={e=>setDataStatus(e.target.value)}><option value="">Все статусы</option><option value="ready">Есть встроенная комбинация</option><option value="simulated">Проверено математически</option><option value="published">По опубликованному руководству</option><option value="external">Только внешнее руководство</option><option value="missing">Пока без готового решения</option><option value="not-required">Открыто или нужен ключ</option></select></label></div>
      <details className={styles.details}><summary>Карта всей Колонии · 386 сундуков + 16 подводных</summary><p className={styles.hint}>Внешняя карта TH.GL: координаты и добыча. Маркеры не равны запертым объектам и не прибавляются к числу наших карточек. Требуется интернет.</p>{showMap ? <iframe className={styles.worldMap} src="https://gothic1remake.th.gl/ru/embed/maps/Khorinis" title="Карта Колонии — TH.GL" loading="lazy" allowFullScreen /> : <button className={styles.secondary} onClick={()=>setShowMap(true)}>Загрузить карту TH.GL</button>}<p className={styles.hint}><a href="https://gothic1remake.th.gl/ru/maps/Khorinis" target="_blank" rel="noreferrer">Карта Gothic 1 Remake — The Hidden Gaming Lair ↗</a> · <a href="https://gothic1remake.th.gl/guides/Underwater%20Chest" target="_blank" rel="noreferrer">16 подводных сундуков ↗</a></p></details>
      <details className={styles.details}><summary>Другие каталоги всей Колонии</summary><p className={styles.hint}>Проверены 16.10.2026. Это отдельные внешние реестры: их записи не прибавляются к нашему счётчику, а полнота и проверка в игре различаются.</p><div className={styles.guideLinks}><a className={styles.secondary} href="https://www.planetofgothic.de/tools/atlas" target="_blank" rel="noreferrer">Planet of Gothic — 447 сундуков и 53 двери ↗</a><a className={styles.secondary} href="https://www.gothic.tools/chests" target="_blank" rel="noreferrer">Gothic.tools — 272 контейнера и останков ↗</a><a className={styles.secondary} href="https://gothic1remake.th.gl/ru" target="_blank" rel="noreferrer">TH.GL — 386 сундуков и 16 подводных ↗</a></div><p className={styles.hint}>Среди 447 сундуков Planet: 299 с отмычкой, 134 открытых, 2 с ключом и 12 без установленного способа открытия. Число сундуков не равно числу комбинаций.</p></details>
      <div className={styles.catalogLayout}><div>
        <div className={styles.listHeader}><h2>{query ? "Результаты поиска" : camp ? campNames[camp] : "Каталог замков"}<span>{filtered.length}</span></h2></div>
        <div className={styles.filters}><label><input type="checkbox" checked={hideOpened} onChange={(event) => setHideOpened(event.target.checked)} /> Скрыть вскрытые</label><label><input type="checkbox" checked={valuable} onChange={(event) => setValuable(event.target.checked)} /> Ценные предметы</label></div>
        {filtered.length === 0 && <div className={styles.empty}><Search size={25} /><h3>Пока ничего не найдено</h3><p>{valuable ? "В каталоге нет объектов с подтверждёнными ценными предметами по этим условиям." : "Попробуйте другое имя или введите замок вручную."}</p><button className={styles.secondary} onClick={() => { setQuery(""); setCamp(null); setRegion(""); setObjectType(""); setArea(""); setDataStatus(""); setReadyOnly(false); setValuable(false); setHideOpened(false); }}>Сбросить фильтры</button></div>}
        {sectors.map((sector) => <section className={styles.sector} key={sector}><h3>{!camp ? `${campNames[sector.split("|")[0]]} · ` : ""}{sector.split("|")[1]}</h3><div className={styles.lockList}>{filtered.filter((item) => `${item.camp}|${item.sector}` === sector).map((item) => <button className={styles.lockRow} data-lock-id={item.id} key={item.id} onClick={() => openEntry(item)}><span className={styles.lockIcon}>{saved.opened.includes(item.id) ? <Check size={19} /> : <LockKeyhole size={19} />}</span><span><strong>{item.name}</strong><small>{saved.opened.includes(item.id) ? "Уже вскрыт" : item.access === "key" ? "Открывается ключом" : item.access === "unlocked" ? "Открытый контейнер · взлом не нужен" : readyFor(item.id,saved.skill).length ? `Готовая комбинация · ${skills.find(skill=>skill.id===saved.skill)?.label}` : guidesFor(item.id,saved.skill).length ? "Есть внешнее руководство с решением" : item.config ? `${item.config.positions.length} пластин · требуется сверка` : `${TYPE_NAMES[item.type]} · ${item.locationPrecision === "landmark" ? "есть ориентир" : "известен район"} · решение не подтверждено`}</small></span><ChevronRight size={17} /></button>)}</div></section>)}
      </div><aside className={styles.aside}>
        <section className={styles.asideCard}><div className={styles.eyebrow}>ПОДСКАЗКИ ДЛЯ PS5</div><h3>Телефон рядом с игрой</h3><p>Навык выбирается над поиском. Выполняйте движения в игре; кнопки шагов сохраняют ваше место в инструкции.</p></section>
        <section className={styles.manualCard}><KeyRound size={24} /><h3>Моего сундука нет</h3><p>Задайте положения и связи. Решатель проверит каждый ход.</p><button className={styles.primary} onClick={() => edit()}>Ввести замок <ArrowRight size={17} /></button></section>
        {saved.recent.length > 0 && <section className={styles.asideCard}><div className={styles.eyebrow}>НЕДАВНО ПРОСМОТРЕННЫЕ</div>{saved.recent.map((id) => catalog.find((item) => item.id === id)).filter((item): item is LockEntry => !!item).map((item) => <button className={styles.recent} key={item.id} onClick={() => openEntry(item)}>{item.name}<ChevronRight size={15} /></button>)}</section>}
        <section className={styles.asideCard}><ShieldCheck size={22} /><h3>Сначала проверка</h3><p>Алгоритм учитывает границы и направленные связи. Данные из сообщества; сверяйте исходное состояние со своей игрой.</p></section>
      </aside></div>
    </>}
    <footer className={styles.footer}><details><summary>Об источниках, проверке и установке</summary><p>Неофициальный справочник Gothic 1 Remake. Алгоритм адаптирован из <a href="https://github.com/Murzav/gothic-lockpick-solver" target="_blank" rel="noreferrer">Murzav/gothic-lockpick-solver (MIT)</a>. Происхождение каждой записи указано в её карточке. <a href="/apps/gothic-locks-licenses.txt" target="_blank" rel="noreferrer">Лицензии и авторы</a>. Названия переведены для поиска; совпадение с русской локализацией игры не подтверждено.</p><p>Использованы разрешённые наблюдения Arminek, drvladis / Vladislav Durnev, Viacheslav Azarov и UnlockMyLoot; отдельно отмечены адаптации The Games Wiki и Land of Games. Маршруты Lorthiz и Steam используются для независимой сверки и ссылок. Готовые комбинации публикуются с отдельными источниками и условиями использования. 416 графов G1LockPickHelper включают 71 тестовый; игровые массивы не распространяются. Карта TH.GL встроена по разрешённым условиям, её база не скопирована. Безымянные сундуки различаются по ориентиру, помещению и исходным положениям. Совпадение механизма само по себе не считается доказательством, что это один объект.</p><p>Конфигурации проверяются математической симуляцией, не прохождением на PS5. После ошибки, изменения связей или обновления игры сверьте состояние и пересчитайте решение.</p><p>На Android откройте меню Chrome → «Добавить на главный экран» → «Установить». Дождитесь отметки «Доступно офлайн». Для установки нужен HTTPS; локальный предпросмотр работает на localhost.</p><p>Навык, недавние замки, отметки и шаги хранятся только в этом браузере. Очистка данных сайта удалит их. Карты и источники по внешним ссылкам требуют интернета.</p></details>{install && <button className={styles.secondary} onClick={async () => { await install.prompt(); await install.userChoice; setInstall(null); }}><Download size={17} /> Установить на телефон</button>}<span>Каталог: {catalog.length} карточек · выпуск 16.10.2026 · <a href="/apps/g/?update=1">Проверить обновление</a></span></footer>
  </div>;
}
