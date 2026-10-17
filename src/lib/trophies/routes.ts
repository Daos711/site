import { readField, type TrackerEvent } from './events';
import { itemStatus, valueAt } from './selectors';
import type { GameCatalog, SourceReference, TrackerItem } from './types';

export interface RouteRule { field: string; entityId?: string; scope?: 'global' | 'run'; op: 'eq' | 'neq' | 'gte' | 'lte'; value: string | number | boolean; label: string; verified: boolean }
export interface RouteNode {
  id: string; itemId?: string; title?: string; instruction?: string; chapter?: number | null;
  locationIds: string[]; requires: string[]; anyOf?: string[][];
  conditions?: RouteRule[]; blockers?: RouteRule[]; trophyIds: string[];
  required: boolean; missable: boolean; deadlineChapter?: number; verified: boolean;
  priority?: number; alternatives?: string[]; rewards?: string[]; sources?: SourceReference[];
  preferredRole?: string; preferredDifficulty?: string; transition?: boolean;
}
export interface RouteDefinition { gameId: string; locations: { id: string; name: string }[]; nodes: RouteNode[] }
export type RouteStatus = 'done' | 'available' | 'blocked' | 'unavailable' | 'check' | 'postponed';
export interface RouteStep { node: RouteNode; item?: TrackerItem; title: string; instruction: string; status: RouteStatus; reasons: string[]; score: number; nearby: boolean }
export interface RouteContext { game: GameCatalog; definition: RouteDefinition; events: readonly TrackerEvent[]; runId: string; chapter: number; location: string; spoilers?: boolean }
function ruleMatch(rule: RouteRule, value: unknown): boolean | null {
  if (value === undefined || value === null || value === '') return null;
  if (rule.op === 'eq') return value === rule.value;
  if (rule.op === 'neq') return value !== rule.value;
  if (typeof value !== 'number' || typeof rule.value !== 'number') return null;
  return rule.op === 'gte' ? value >= rule.value : value <= rule.value;
}
export function routeEntity(node: RouteNode) { return node.itemId || `route:${node.id}`; }
export function evaluateRoute(context: RouteContext) {
  const { game, definition, events, runId, chapter, location } = context;
  const byItem = new Map(game.items.map(item => [item.id, item]));
  const completed = new Set(definition.nodes.filter(node => {
    const item = node.itemId ? byItem.get(node.itemId) : undefined;
    return item ? itemStatus(events, game.id, runId, item) === 'done' : valueAt(events, game.id, runId, routeEntity(node), 'status') === 'done';
  }).map(node => node.id));
  const contextConflicts = new Set<string>();
  const contextLabels: Record<string, string> = { chapter: 'глава', campMembership: 'лагерь', difficulty: 'сложность', role: 'специализация', sleep: 'прохождение без сна', permadeath: 'перманентная смерть', location: 'текущая локация' };
  for (const [field, label] of Object.entries(contextLabels)) if (readField(events, { gameId: game.id, runId, entityId: 'run', field }).conflict) contextConflicts.add(label);
  for (const node of definition.nodes) for (const rule of [...node.conditions || [], ...node.blockers || []]) {
    const action = rule.field.startsWith('action:') ? definition.nodes.find(candidate => candidate.id === rule.field.slice('action:'.length)) : undefined;
    const actionItem = action?.itemId ? byItem.get(action.itemId) : undefined;
    const address = action
      ? { gameId: game.id, runId: actionItem && actionItem.scope !== 'run' ? null : runId, entityId: routeEntity(action), field: 'status' }
      : { gameId: game.id, runId: rule.scope === 'global' ? null : runId, entityId: rule.entityId || 'run', field: rule.field };
    if (readField(events, address).conflict) {
      const item = node.itemId ? byItem.get(node.itemId) : undefined;
      const future = (node.chapter ?? item?.spoilerChapter ?? item?.chapter ?? 0) > chapter;
      contextConflicts.add(future && !context.spoilers ? 'условие будущей главы' : rule.label || contextLabels[rule.field] || 'условие персонажа');
    }
  }
  const ruleValue = (rule: RouteRule) => {
    if (!rule.field.startsWith('action:')) return valueAt(events, game.id, rule.scope === 'global' ? null : runId, rule.entityId || 'run', rule.field);
    const target = definition.nodes.find(n => n.id === rule.field.slice('action:'.length));
    if (!target) return undefined;
    const item = target.itemId ? byItem.get(target.itemId) : undefined;
    const cell = readField(events, { gameId: game.id, runId: item && item.scope !== 'run' ? null : runId, entityId: routeEntity(target), field: 'status' });
    return cell.conflict || cell.incomplete || cell.value === 'verify' ? undefined : completed.has(target.id);
  };
  const all: RouteStep[] = definition.nodes.map(node => {
    const item = node.itemId ? byItem.get(node.itemId) : undefined;
    const reasons: string[] = [];
    let status: RouteStatus = node.verified ? 'available' : 'check';
    if (!node.verified) reasons.push('Требует проверки: сведения не используются для строгого маршрута.');
    if (node.deadlineChapter !== undefined && chapter > node.deadlineChapter && node.verified) { status = 'unavailable'; reasons.push(`Подтверждённый срок: до конца главы ${node.deadlineChapter}.`); }
    for (const rule of node.blockers || []) {
      const matched = ruleMatch(rule, ruleValue(rule));
      if (matched === true && rule.verified) { status = 'unavailable'; reasons.push(rule.label); }
      else if (matched === true || matched === null) { if (status === 'available') status = 'check'; reasons.push(rule.label + ' — проверьте состояние.'); }
    }
    for (const rule of node.conditions || []) {
      const matched = ruleMatch(rule, ruleValue(rule));
      if (matched !== true) { if (status !== 'unavailable') status = rule.verified && matched === false ? 'blocked' : 'check'; reasons.push(rule.label); }
    }
    const missing = node.requires.filter(id => !completed.has(id));
    if (missing.length || (node.anyOf?.length && !node.anyOf.some(group => group.every(id => completed.has(id))))) {
      if (status !== 'unavailable') status = node.verified ? 'blocked' : 'check';
      for (const id of missing) { const dependency = definition.nodes.find(n => n.id === id); reasons.push('Сначала: ' + (dependency?.title || byItem.get(dependency?.itemId || '')?.name || id)); }
      if (node.anyOf?.length && !node.anyOf.some(group => group.every(id => completed.has(id)))) reasons.push('Нужно выполнить один из альтернативных наборов условий.');
    }
    const scope = item && item.scope !== 'run' ? null : runId;
    const cell = readField(events, { gameId: game.id, runId: scope, entityId: routeEntity(node), field: 'status' });
    if (cell.conflict) { status = 'check'; reasons.push('Есть разные отметки на устройствах.'); }
    else if (cell.value === 'verify') { status = 'check'; reasons.push('Вы отметили это действие для проверки в игре.'); }
    if (valueAt(events, game.id, scope, routeEntity(node), 'postponed') === true && status === 'available') status = 'postponed';
    if (completed.has(node.id)) status = 'done';
    const nearby = !!location && node.locationIds.includes(location);
    const urgent = node.verified && node.missable && node.deadlineChapter !== undefined && chapter === node.deadlineChapter;
    let score = (urgent ? 10000 : 0) + (node.required ? 1000 : 0) + (nearby ? 100 : 0) + (node.priority || 0);
    if (node.preferredRole && String(valueAt(events, game.id, runId, 'run', 'role') || '').includes(node.preferredRole)) score += 30;
    if (node.preferredDifficulty && valueAt(events, game.id, runId, 'run', 'difficulty') === node.preferredDifficulty) score += 30;
    return { node, item, title: node.title || item?.name || node.id, instruction: node.instruction || item?.description || '', status, reasons, score, nearby };
  });
  const inCurrentChapter = (step: RouteStep) => (step.node.chapter ?? step.item?.spoilerChapter ?? step.item?.chapter ?? 0) <= chapter;
  const visible = all.filter(step => context.spoilers || inCurrentChapter(step));
  const sorted = visible.slice().sort((a,b) => b.score - a.score || a.node.id.localeCompare(b.node.id));
  return { all, visible: sorted, contextConflicts: [...contextConflicts], next: contextConflicts.size ? undefined : sorted.find(step => inCurrentChapter(step) && step.status === 'available'), nearby: sorted.filter(step => inCurrentChapter(step) && step.nearby && step.status !== 'done' && step.status !== 'unavailable'), warnings: sorted.filter(step => step.node.missable && step.status !== 'done'), done: all.filter(step => step.status === 'done').length, total: all.length };
}
export function checkpoint(context: RouteContext) {
  const route = evaluateRoute(context);
  return { required: route.visible.filter(s => s.node.required && s.node.verified && s.node.deadlineChapter !== undefined && s.node.deadlineChapter <= context.chapter && !['done','unavailable'].includes(s.status)),
    missable: route.warnings, lessons: route.visible.filter(s => s.item?.category === 'lessons' && ['available','check','postponed'].includes(s.status)),
    chains: route.visible.filter(s => s.node.requires.some(id => route.all.some(dep => dep.node.id === id && dep.status === 'done')) && s.status !== 'done' && s.status !== 'unavailable'), separateSave: true };
}
export function validateRoute(definition: RouteDefinition, game: GameCatalog): string[] {
  const errors: string[] = [], ids = new Set<string>(), items = new Set(game.items.map(i => i.id)), locations = new Set(definition.locations.map(l => l.id));
  for (const node of definition.nodes) {
    if (ids.has(node.id)) errors.push(`Повтор ID: ${node.id}`); ids.add(node.id);
    if (node.itemId && !items.has(node.itemId)) errors.push(`Нет пункта: ${node.itemId}`);
    if (node.locationIds.some(id => !locations.has(id))) errors.push(`Неизвестная локация: ${node.id}`);
    if (node.trophyIds.some(id => !game.items.some(i => i.id === id && i.category === 'trophies'))) errors.push(`Неизвестный трофей: ${node.id}`);
    for (const condition of node.conditions || []) if ((node.blockers || []).some(b => b.field === condition.field && (b.entityId || 'run') === (condition.entityId || 'run') && (b.scope || 'run') === (condition.scope || 'run') && b.op === condition.op && b.value === condition.value && b.verified && condition.verified)) errors.push(`Противоречивое условие: ${node.id}`);
    const conditionGroups = new Map<string, RouteRule[]>();
    for (const rule of node.conditions || []) {
      if (!rule.verified) continue;
      const address = JSON.stringify(rule.field.startsWith('action:') ? ['action', rule.field] : [rule.scope || 'run', rule.entityId || 'run', rule.field]);
      const group = conditionGroups.get(address) || [];
      group.push(rule); conditionGroups.set(address, group);
    }
    for (const group of conditionGroups.values()) {
      const equality = group.find(rule => rule.op === 'eq');
      const lower = Math.max(-Infinity, ...group.filter(rule => rule.op === 'gte' && typeof rule.value === 'number').map(rule => Number(rule.value)));
      const upper = Math.min(Infinity, ...group.filter(rule => rule.op === 'lte' && typeof rule.value === 'number').map(rule => Number(rule.value)));
      const impossible = equality
        ? group.some(rule => ruleMatch(rule, equality.value) !== true)
        : lower > upper || (Number.isFinite(lower) && lower === upper && group.some(rule => rule.op === 'neq' && rule.value === lower));
      if (impossible) errors.push(`Противоречивые условия: ${node.id} (${group[0].entityId || 'run'}/${group[0].field})`);
    }
    const mins = (node.conditions || []).filter(r => r.field === 'chapter' && (!r.entityId || r.entityId === 'run') && r.scope !== 'global' && r.op === 'gte' && r.verified).map(r => Number(r.value));
    if (node.deadlineChapter !== undefined && mins.some(min => min > node.deadlineChapter!)) errors.push(`Противоречивые главы: ${node.id}`);
  }
  for (const node of definition.nodes) for (const rule of [...node.conditions || [], ...node.blockers || []]) {
    if (rule.entityId && rule.entityId !== 'run') {
      const item = game.items.find(candidate => candidate.id === rule.entityId);
      if (!item && !definition.nodes.some(candidate => routeEntity(candidate) === rule.entityId)) errors.push(`Нет объекта в условии: ${node.id} → ${rule.entityId}`);
      if (rule.field.startsWith('stage:') && !item?.steps?.some(step => step.id === rule.field.slice('stage:'.length))) errors.push(`Нет стадии в условии: ${node.id} → ${rule.entityId}/${rule.field}`);
    }
    if (rule.field.startsWith('action:')) {
      const action = rule.field.slice('action:'.length);
      if (!ids.has(action)) errors.push(`Нет действия в условии: ${node.id} → ${action}`);
      if (!['eq','neq'].includes(rule.op) || typeof rule.value !== 'boolean') errors.push(`Некорректное условие действия: ${node.id}`);
    }
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) { errors.push(`Циклическая зависимость: ${id}`); return; }
    if (visited.has(id)) return;
    const node = definition.nodes.find(n => n.id === id); if (!node) { errors.push(`Нет зависимости: ${id}`); return; }
    const conditions = (node.conditions || []).filter(rule => rule.verified && rule.op === 'eq' && (rule.value === true || rule.value === 'done'));
    const conditionDependencies = conditions.flatMap(rule => {
      if (rule.field.startsWith('action:')) return [rule.field.slice('action:'.length)];
      if (!rule.entityId || rule.field !== 'status') return [];
      return definition.nodes.filter(candidate => routeEntity(candidate) === rule.entityId).map(candidate => candidate.id);
    });
    // A book stage is an independent observation. Requiring a delivered stage
    // does not require completion of every objective for that book.
    visiting.add(id); for (const dep of [...node.requires, ...(node.anyOf || []).flat(), ...conditionDependencies]) visit(dep); visiting.delete(id); visited.add(id);
  }
  for (const id of ids) visit(id);
  return [...new Set(errors)];
}
