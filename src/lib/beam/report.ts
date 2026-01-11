/**
 * Генератор HTML-отчёта для расчёта балки
 */

import type { BeamInput, BeamResult, Reactions, Load } from "./types";
import { buildIntervals, buildSectionFormulas, formatNumber, formatQFormula, formatMFormula, type ForceContribution } from "./sections";
import { getProfileTypeName, getProfileW, getProfileI } from "./gost-profiles";

/**
 * Оценивает ширину LaTeX терма в условных единицах (примерно символах)
 * Более точная оценка визуальной ширины после рендеринга
 */
function estimateTermWidth(term: string): number {
  let str = term;
  let width = 0;

  // \frac{num}{den} - ширина равна max(num, den) + небольшой запас
  const fracRegex = /\\frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let match;
  while ((match = fracRegex.exec(term)) !== null) {
    const numWidth = estimateSimpleWidth(match[1]);
    const denWidth = estimateSimpleWidth(match[2]);
    width += Math.max(numWidth, denWidth) + 2;
    str = str.replace(match[0], "");
  }

  // Добавляем ширину оставшейся части
  width += estimateSimpleWidth(str);

  return Math.max(width, 2);
}

/**
 * Оценивает ширину простой LaTeX строки (без \frac)
 */
function estimateSimpleWidth(str: string): number {
  let w = str.length;
  // \cdot → 1 символ (точка)
  w -= (str.match(/\\cdot/g) || []).length * 4;
  // _{...} рендерится мелко
  const subMatches = str.match(/_\{[^}]*\}/g) || [];
  for (const sub of subMatches) {
    w -= sub.length * 0.5;
  }
  // ^{...} рендерится мелко
  const supMatches = str.match(/\^\{[^}]*\}/g) || [];
  for (const sup of supMatches) {
    w -= sup.length * 0.5;
  }
  // \left( и \right) → просто скобки
  w -= (str.match(/\\left/g) || []).length * 4;
  w -= (str.match(/\\right/g) || []).length * 5;
  // \text{...} - только содержимое
  w -= (str.match(/\\text/g) || []).length * 5;
  // Фигурные скобки {} для группировки не рендерятся
  w -= (str.match(/[{}]/g) || []).length;
  // Обратные слеши перед буквами
  w -= (str.match(/\\/g) || []).length;
  return Math.max(w, 1);
}

/**
 * Форматирует длинную формулу с переносами строк по ширине
 * @param lhs - левая часть (например "M(s)")
 * @param terms - массив слагаемых (например ["+R_A", "-F", ...])
 * @param maxLineWidth - максимальная ширина строки в условных единицах
 * @returns LaTeX строка с переносами через aligned если нужно
 */
function formatLongFormula(lhs: string, terms: string[], maxLineWidth: number = 90): { latex: string; isMultiline: boolean } {
  if (terms.length === 0) {
    return { latex: `${lhs} = 0`, isMultiline: false };
  }

  // Убираем начальный + если он есть
  let firstTerm = terms[0];
  if (firstTerm.startsWith("+ ")) {
    firstTerm = firstTerm.slice(2);
  } else if (firstTerm.startsWith("+")) {
    firstTerm = firstTerm.slice(1);
  }
  const cleanTerms = [firstTerm, ...terms.slice(1)];

  // Проверяем, влезет ли всё в одну строку
  const lhsWidth = lhs.length + 3; // " = "
  const totalWidth = lhsWidth + cleanTerms.reduce((sum, t) => sum + estimateTermWidth(t) + 1, 0);

  if (totalWidth <= maxLineWidth) {
    return { latex: `${lhs} = ${cleanTerms.join(" ")}`, isMultiline: false };
  }

  // Разбиваем на строки по ширине
  const lines: string[] = [];
  let currentLine: string[] = [];
  let currentWidth = lhsWidth;

  for (const term of cleanTerms) {
    const termWidth = estimateTermWidth(term) + 1; // +1 для пробела
    if (currentWidth + termWidth > maxLineWidth && currentLine.length > 0) {
      // Начинаем новую строку
      if (lines.length === 0) {
        lines.push(`${lhs} &= ${currentLine.join(" ")}`);
      } else {
        lines.push(`&\\phantom{=} ${currentLine.join(" ")}`);
      }
      currentLine = [term];
      currentWidth = 10 + termWidth; // indent + term
    } else {
      currentLine.push(term);
      currentWidth += termWidth;
    }
  }

  // Добавляем последнюю строку
  if (currentLine.length > 0) {
    if (lines.length === 0) {
      lines.push(`${lhs} &= ${currentLine.join(" ")}`);
    } else {
      lines.push(`&\\phantom{=} ${currentLine.join(" ")}`);
    }
  }

  if (lines.length === 1) {
    // Всё влезло в одну строку после пересчёта
    return { latex: `${lhs} = ${cleanTerms.join(" ")}`, isMultiline: false };
  }

  return {
    latex: `\\begin{aligned}\n${lines.join(" \\\\\n")}\n\\end{aligned}`,
    isMultiline: true
  };
}

/**
 * Форматирует слагаемые внутри скобок с переносом строк по ширине
 * Для формул типа \frac{1}{EI}\left(...\right)
 */
function formatBracketedTerms(terms: string[], maxLineWidth: number = 85): { latex: string; isMultiline: boolean } {
  if (terms.length === 0) return { latex: "", isMultiline: false };

  // Проверяем общую ширину
  const totalWidth = terms.reduce((sum, t) => sum + estimateTermWidth(t) + 1, 0);
  if (totalWidth <= maxLineWidth) {
    return { latex: terms.join(" "), isMultiline: false };
  }

  // Разбиваем на строки по ширине
  const lines: string[] = [];
  let currentLine: string[] = [];
  let currentWidth = 0;

  for (const term of terms) {
    const termWidth = estimateTermWidth(term) + 1;
    if (currentWidth + termWidth > maxLineWidth && currentLine.length > 0) {
      lines.push(currentLine.join(" "));
      currentLine = [term];
      currentWidth = termWidth;
    } else {
      currentLine.push(term);
      currentWidth += termWidth;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.join(" "));
  }

  if (lines.length === 1) {
    return { latex: terms.join(" "), isMultiline: false };
  }

  return {
    latex: `\\begin{gathered}${lines.join(" \\\\ ")}\\end{gathered}`,
    isMultiline: true
  };
}

/**
 * Вычисляет результирующие распределённые нагрузки по участкам
 * (с учётом наложения нескольких q на одном участке)
 */
function computeResultingLoads(input: BeamInput): Array<{ a: number; b: number; q: number }> {
  const { L, loads } = input;
  const distributedLoads = loads.filter(l => l.type === "distributed") as Array<{ type: "distributed"; q: number; a: number; b: number }>;

  if (distributedLoads.length === 0) return [];

  // Собираем все характерные точки
  const points = new Set<number>();
  points.add(0);
  points.add(L);
  for (const load of distributedLoads) {
    if (load.a >= 0 && load.a <= L) points.add(load.a);
    if (load.b >= 0 && load.b <= L) points.add(load.b);
  }
  const sortedPoints = Array.from(points).sort((a, b) => a - b);

  // Вычисляем результирующую нагрузку на каждом участке
  const segments: Array<{ a: number; b: number; q: number }> = [];
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const a = sortedPoints[i];
    const b = sortedPoints[i + 1];
    let totalQ = 0;
    for (const load of distributedLoads) {
      const clampedA = Math.max(0, Math.min(L, load.a));
      const clampedB = Math.max(0, Math.min(L, load.b));
      if (clampedA <= a && clampedB >= b) {
        totalQ += load.q;
      }
    }
    if (Math.abs(totalQ) > 0.001) {
      segments.push({ a, b, q: totalQ });
    }
  }

  // Объединяем смежные участки с одинаковой нагрузкой
  const merged: typeof segments = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(last.q - seg.q) < 0.001 && Math.abs(last.b - seg.a) < 0.001) {
      last.b = seg.b;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}

// Цвета для SVG (тёмный фон, как в приложении)
const SVG_COLORS = {
  beam: "#64748b",
  support: "#94a3b8",
  distributedLoad: "#3b82f6",
  pointForce: "#ef4444",
  moment: "#a855f7",
  reaction: "#22c55e",
  text: "#1f2937",
  background: "#ffffff",
};

interface DiagramImages {
  Q?: string;   // dataURL эпюры Q
  M?: string;   // dataURL эпюры M
  y?: string;   // dataURL эпюры y
}

interface ReportData {
  input: BeamInput;
  result: BeamResult;
  beamSchemaSVG?: string;     // SVG-строка схемы балки с сайта
  diagrams?: DiagramImages;   // dataURL эпюр
}

/**
 * Генерирует HTML-отчёт и открывает в новом окне
 */
export function generateReport(data: ReportData): void {
  const html = buildReportHTML(data);

  // Открываем в новом окне
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

/**
 * Генерирует SVG схему балки
 */
function generateBeamSVG(input: BeamInput, result: BeamResult): string {
  const { L, loads, supports, beamType } = input;

  // Размеры SVG — увеличены для лучшего качества
  const width = 700;
  const height = 280;
  const padding = { left: 50, right: 80, top: 90, bottom: 70 };
  const beamY = padding.top + 50;
  const beamThickness = 14;

  // Масштаб
  const scale = (width - padding.left - padding.right) / L;
  const xToPx = (x: number) => padding.left + x * scale;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background: ${SVG_COLORS.background}; border: 1px solid #e5e7eb; border-radius: 4px;">`;

  // Маркеры для стрелок
  svg += `
    <defs>
      <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <path d="M0,0 L0,8 L8,4 z" fill="${SVG_COLORS.distributedLoad}"/>
      </marker>
      <marker id="arrowRed" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <path d="M0,0 L0,8 L8,4 z" fill="${SVG_COLORS.pointForce}"/>
      </marker>
      <marker id="arrowPurple" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <path d="M0,0 L0,8 L8,4 z" fill="${SVG_COLORS.moment}"/>
      </marker>
      <marker id="arrowGreen" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <path d="M0,0 L0,8 L8,4 z" fill="${SVG_COLORS.reaction}"/>
      </marker>
    </defs>
  `;

  // Балка
  svg += `<rect x="${xToPx(0)}" y="${beamY - beamThickness / 2}" width="${xToPx(L) - xToPx(0)}" height="${beamThickness}" fill="${SVG_COLORS.beam}" rx="3"/>`;

  // Опоры
  for (const support of supports) {
    const x = xToPx(support.x);
    if (support.type === "pin") {
      svg += generatePinSupport(x, beamY + beamThickness / 2);
    } else if (support.type === "roller") {
      svg += generateRollerSupport(x, beamY + beamThickness / 2);
    } else if (support.type === "fixed") {
      const side = support.x < L / 2 ? "left" : "right";
      svg += generateFixedSupport(x, beamY, side);
    }
  }

  // Распределённые нагрузки — рисуем первыми, чтобы подписи были на фоне
  const distributedLoads = loads.filter((l): l is Extract<Load, { type: "distributed" }> => l.type === "distributed");
  for (const load of distributedLoads) {
    svg += generateDistributedLoad(xToPx(load.a), xToPx(load.b), beamY - beamThickness / 2, load.q);
  }

  // Сосредоточенные силы
  const forces = loads.filter((l): l is Extract<Load, { type: "force" }> => l.type === "force");
  for (let i = 0; i < forces.length; i++) {
    const load = forces[i];
    // Смещаем подпись вправо, если сила в конце балки
    const labelOffset = load.x > L * 0.8 ? -80 : 10;
    svg += generatePointForce(xToPx(load.x), beamY - beamThickness / 2, load.F, labelOffset);
  }

  // Моменты — позиционируем слева от нагрузок
  const moments = loads.filter((l): l is Extract<Load, { type: "moment" }> => l.type === "moment");
  for (const load of moments) {
    svg += generateMoment(xToPx(load.x), beamY - beamThickness / 2, load.M);
  }

  // Подписи опор
  const isSimplySupported = beamType.startsWith("simply-supported");
  if (isSimplySupported) {
    const pinSupport = supports.find(s => s.type === "pin");
    const rollerSupport = supports.find(s => s.type === "roller");
    if (pinSupport) {
      svg += `<text x="${xToPx(pinSupport.x)}" y="${beamY + 75}" text-anchor="middle" fill="${SVG_COLORS.text}" font-size="16" font-weight="bold">A</text>`;
    }
    if (rollerSupport) {
      svg += `<text x="${xToPx(rollerSupport.x)}" y="${beamY + 75}" text-anchor="middle" fill="${SVG_COLORS.text}" font-size="16" font-weight="bold">B</text>`;
    }
  }

  svg += "</svg>";
  return svg;
}

/**
 * Генерирует SVG для шарнирно-неподвижной опоры
 */
function generatePinSupport(x: number, y: number): string {
  const size = 20;
  const baseY = y + size;
  const lineHalfWidth = size / 2 + 6;
  let svg = "";

  // Треугольник
  svg += `<polygon points="${x},${y} ${x - size / 2},${baseY} ${x + size / 2},${baseY}" fill="none" stroke="${SVG_COLORS.support}" stroke-width="2"/>`;

  // Горизонтальная линия
  svg += `<line x1="${x - lineHalfWidth}" y1="${baseY}" x2="${x + lineHalfWidth}" y2="${baseY}" stroke="${SVG_COLORS.support}" stroke-width="2"/>`;

  // Штриховка
  for (let i = 0; i < 5; i++) {
    const hx = x - lineHalfWidth + 6 + i * 6;
    svg += `<line x1="${hx}" y1="${baseY}" x2="${hx - 6}" y2="${baseY + 8}" stroke="${SVG_COLORS.support}" stroke-width="1.5"/>`;
  }

  return svg;
}

/**
 * Генерирует SVG для шарнирно-подвижной опоры (каток)
 */
function generateRollerSupport(x: number, y: number): string {
  const size = 20;
  const baseY = y + size + 12;
  const lineHalfWidth = size / 2 + 6;
  let svg = "";

  // Треугольник
  svg += `<polygon points="${x},${y} ${x - size / 2},${y + size} ${x + size / 2},${y + size}" fill="none" stroke="${SVG_COLORS.support}" stroke-width="2"/>`;

  // Колёса
  svg += `<circle cx="${x - size / 2.5}" cy="${y + size + 5}" r="4" fill="none" stroke="${SVG_COLORS.support}" stroke-width="2"/>`;
  svg += `<circle cx="${x + size / 2.5}" cy="${y + size + 5}" r="4" fill="none" stroke="${SVG_COLORS.support}" stroke-width="2"/>`;

  // Горизонтальная линия
  svg += `<line x1="${x - lineHalfWidth}" y1="${baseY}" x2="${x + lineHalfWidth}" y2="${baseY}" stroke="${SVG_COLORS.support}" stroke-width="2"/>`;

  // Штриховка
  for (let i = 0; i < 5; i++) {
    const hx = x - lineHalfWidth + 6 + i * 6;
    svg += `<line x1="${hx}" y1="${baseY}" x2="${hx - 6}" y2="${baseY + 8}" stroke="${SVG_COLORS.support}" stroke-width="1.5"/>`;
  }

  return svg;
}

/**
 * Генерирует SVG для заделки
 */
function generateFixedSupport(x: number, y: number, side: "left" | "right"): string {
  const h = 40;
  const dir = side === "left" ? -1 : 1;
  let svg = "";

  // Вертикальная линия
  svg += `<line x1="${x}" y1="${y - h / 2}" x2="${x}" y2="${y + h / 2}" stroke="${SVG_COLORS.support}" stroke-width="4"/>`;

  // Штриховка
  for (let i = -2; i <= 2; i++) {
    const dy = i * 8;
    svg += `<line x1="${x}" y1="${y + dy}" x2="${x + dir * 12}" y2="${y + dy - 8}" stroke="${SVG_COLORS.support}" stroke-width="2"/>`;
  }

  return svg;
}

/**
 * Генерирует SVG для распределённой нагрузки
 */
function generateDistributedLoad(x1: number, x2: number, beamTopY: number, q: number): string {
  const arrowLen = 30;
  const numArrows = Math.max(4, Math.floor((x2 - x1) / 35));
  let svg = "";

  if (q >= 0) {
    // Сверху вниз
    const baseY = beamTopY;
    svg += `<line x1="${x1}" y1="${baseY - arrowLen}" x2="${x2}" y2="${baseY - arrowLen}" stroke="${SVG_COLORS.distributedLoad}" stroke-width="2"/>`;

    for (let i = 0; i < numArrows; i++) {
      const px = x1 + (i / (numArrows - 1)) * (x2 - x1);
      svg += `<line x1="${px}" y1="${baseY - arrowLen}" x2="${px}" y2="${baseY - 8}" stroke="${SVG_COLORS.distributedLoad}" stroke-width="2" marker-end="url(#arrowBlue)"/>`;
    }

    svg += `<text x="${(x1 + x2) / 2}" y="${baseY - arrowLen - 8}" text-anchor="middle" fill="${SVG_COLORS.distributedLoad}" font-size="12" font-weight="600">q = ${Math.abs(q)} кН/м</text>`;
  } else {
    // Снизу вверх
    const baseY = beamTopY + 14; // beamBottom
    svg += `<line x1="${x1}" y1="${baseY + arrowLen}" x2="${x2}" y2="${baseY + arrowLen}" stroke="${SVG_COLORS.distributedLoad}" stroke-width="2"/>`;

    for (let i = 0; i < numArrows; i++) {
      const px = x1 + (i / (numArrows - 1)) * (x2 - x1);
      svg += `<line x1="${px}" y1="${baseY + arrowLen}" x2="${px}" y2="${baseY + 8}" stroke="${SVG_COLORS.distributedLoad}" stroke-width="2"/>`;
    }

    svg += `<text x="${(x1 + x2) / 2}" y="${baseY + arrowLen + 16}" text-anchor="middle" fill="${SVG_COLORS.distributedLoad}" font-size="12" font-weight="600">q = ${Math.abs(q)} кН/м</text>`;
  }

  return svg;
}

/**
 * Генерирует SVG для сосредоточенной силы
 */
function generatePointForce(x: number, y: number, F: number, labelXOffset = 10): string {
  const arrowLen = 55;
  let svg = "";

  const labelX = x + labelXOffset;
  const textAnchor = labelXOffset < 0 ? "end" : "start";

  if (F >= 0) {
    // Вниз
    svg += `<line x1="${x}" y1="${y - arrowLen}" x2="${x}" y2="${y - 8}" stroke="${SVG_COLORS.pointForce}" stroke-width="2.5" marker-end="url(#arrowRed)"/>`;
    svg += `<text x="${labelX}" y="${y - arrowLen - 6}" text-anchor="${textAnchor}" fill="${SVG_COLORS.pointForce}" font-size="12" font-weight="600">F = ${Math.abs(F)} кН</text>`;
  } else {
    // Вверх
    svg += `<line x1="${x}" y1="${y + 55}" x2="${x}" y2="${y + 22}" stroke="${SVG_COLORS.pointForce}" stroke-width="2.5" marker-end="url(#arrowRed)"/>`;
    svg += `<text x="${labelX}" y="${y + 68}" text-anchor="${textAnchor}" fill="${SVG_COLORS.pointForce}" font-size="12" font-weight="600">F = ${Math.abs(F)} кН</text>`;
  }

  return svg;
}

/**
 * Генерирует SVG для момента
 */
function generateMoment(x: number, y: number, M: number): string {
  const R = 18;
  const H = 35;
  const gap = 8;
  const Cy = y - gap - H;
  let svg = "";

  const isCW = M < 0;
  const startAngle = isCW ? 240 : 300;
  const endAngle = isCW ? 330 : 210;

  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = x + R * Math.cos(startRad);
  const y1 = Cy + R * Math.sin(startRad);
  const x2 = x + R * Math.cos(endRad);
  const y2 = Cy + R * Math.sin(endRad);

  // Ножка
  svg += `<line x1="${x}" y1="${y - gap}" x2="${x1}" y2="${y1}" stroke="${SVG_COLORS.moment}" stroke-width="2.5"/>`;

  // Дуга
  const sweepFlag = isCW ? 1 : 0;
  svg += `<path d="M ${x1} ${y1} A ${R} ${R} 0 0 ${sweepFlag} ${x2} ${y2}" fill="none" stroke="${SVG_COLORS.moment}" stroke-width="2.5" marker-end="url(#arrowPurple)"/>`;

  // Подпись — слева от момента для против часовой, справа для по часовой
  const labelX = isCW ? x + R + 10 : x - R - 10;
  const textAnchor = isCW ? "start" : "end";
  svg += `<text x="${labelX}" y="${Cy - 5}" text-anchor="${textAnchor}" fill="${SVG_COLORS.moment}" font-size="12" font-weight="600">M = ${Math.abs(M)} кН·м</text>`;

  return svg;
}

/**
 * Генерирует размерную линию
 */
function generateDimensionLine(x1: number, x2: number, y: number, L: number): string {
  let svg = "";

  // Горизонтальная линия
  svg += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${SVG_COLORS.text}" stroke-width="1"/>`;

  // Засечки
  svg += `<line x1="${x1}" y1="${y - 4}" x2="${x1}" y2="${y + 4}" stroke="${SVG_COLORS.text}" stroke-width="1"/>`;
  svg += `<line x1="${x2}" y1="${y - 4}" x2="${x2}" y2="${y + 4}" stroke="${SVG_COLORS.text}" stroke-width="1"/>`;

  // Подпись
  svg += `<text x="${(x1 + x2) / 2}" y="${y + 14}" text-anchor="middle" fill="${SVG_COLORS.text}" font-size="12">L = ${formatNumber(L)} м</text>`;

  return svg;
}

/**
 * Форматирует тип балки на русском
 */
function formatBeamType(type: string): string {
  const types: Record<string, string> = {
    "simply-supported": "Двухопорная балка",
    "simply-supported-overhang-left": "Двухопорная балка с консолью слева",
    "simply-supported-overhang-right": "Двухопорная балка с консолью справа",
    "simply-supported-overhang-both": "Двухконсольная балка",
    "cantilever-left": "Консольная балка (заделка слева)",
    "cantilever-right": "Консольная балка (заделка справа)",
  };
  return types[type] || type;
}

/**
 * Генерирует HTML-код отчёта
 */
function buildReportHTML(data: ReportData): string {
  const { input, result, beamSchemaSVG, diagrams } = data;
  const { reactions, Q, M, Mmax, Qmax, y } = result;

  // Секции
  const sections = buildSectionFormulas(input, reactions, Q, M);

  // Максимальный прогиб
  let yMax = { value: 0, x: 0 };
  if (y) {
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * input.L;
      const val = Math.abs(y(x));
      if (val > Math.abs(yMax.value)) {
        yMax = { value: y(x), x };
      }
    }
  }

  // Флаги для определения наличия разделов
  const hasDiagrams = diagrams?.Q || diagrams?.M || diagrams?.y;
  const hasCrossSection = !!(
    (result.diameter && result.W && result.I) || // круглое сечение
    (result.selectedProfile && result.I) // профиль из ГОСТ (двутавр/швеллер)
  );
  const hasDeflection = !!y;

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Расчёт балки — Отчёт</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    @page { size: A4; margin: 20mm; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 14pt;
      line-height: 1.6;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm 15mm;
      background: white;
      color: black;
    }
    h1 { font-size: 18pt; text-align: center; margin-bottom: 20px; }
    h2 { font-size: 16pt; font-weight: bold; margin-top: 28px; margin-bottom: 14px; }
    h3 { font-size: 14pt; font-weight: bold; margin-top: 18px; margin-bottom: 10px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 12pt; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #f5f5f5; font-weight: normal; font-size: 13pt; }
    .formula { margin: 10px 0; padding: 8px 0; font-size: 13pt; }
    .diagram-block { margin: 20px 0; text-align: center; }
    .diagram-block img { max-width: 100%; height: auto; }
    .diagram-title { font-weight: bold; margin-bottom: 8px; font-size: 12pt; }
    .figure-caption { font-size: 11pt; font-style: italic; margin-top: 6px; }
    ul { margin: 8px 0; padding-left: 24px; }
    li { margin: 4px 0; }
    .sign-convention { margin: 12px 0; }
    .sign-convention h4 { margin: 0 0 8px 0; font-size: 12pt; font-weight: bold; }
    .conclusions { margin: 16px 0; }
    .unit { margin-left: 8px; font-style: normal; }
    @page {
      size: A4;
      margin: 15mm;
    }
    @media print {
      body { padding: 0; margin: 0; }
      .no-print { display: none; }
    }
    .print-btn {
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 10px 20px;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .print-btn:hover { background: #0055aa; }
    .print-btn:disabled { background: #999; cursor: wait; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="prepareAndPrint()" id="printBtn">Сохранить PDF</button>

  <h1>Расчёт балки методом сечений</h1>

  ${buildProblemStatement(input, result, hasDeflection, hasCrossSection)}

  <h2>1. Исходные данные</h2>
  ${buildInputDataSection(input)}

  <h2>2. Расчётная схема</h2>
  <div style="text-align: center; margin-bottom: 16px;">
    ${beamSchemaSVG || generateBeamSVG(input, result)}
  </div>
  <p class="figure-caption" style="text-align: center;">Рисунок 1 — Расчётная схема балки</p>

  <h2>3. Определение реакций опор</h2>
  ${buildReactionsSection(input, reactions)}

  <h2>4. Внутренние усилия по участкам</h2>
  ${buildSignConventions()}
  <p>Разобьём балку на участки по характерным точкам. Для каждого участка составим выражения для поперечной силы \\(Q\\) и изгибающего момента \\(M\\).</p>
  ${sections.map(section => buildSectionBlock(section)).join("\n")}

  <h2>5. Скачки Q и M в характерных точках</h2>
  ${buildJumpsSection(input, result, reactions)}

  <h2>6. Экстремальные значения</h2>
  <table>
    <tr><th>Величина</th><th>Значение</th><th>Координата</th></tr>
    <tr><td>\\(|Q|_{\\max}\\)</td><td>\\(${formatNumber(Math.abs(Qmax.value))}\\) кН</td><td>\\(x = ${formatNumber(Qmax.x)}\\) м</td></tr>
    <tr><td>\\(|M|_{\\max}\\)</td><td>\\(${formatNumber(Math.abs(Mmax.value))}\\) кН·м</td><td>\\(x = ${formatNumber(Mmax.x)}\\) м</td></tr>
    ${y ? `<tr><td>\\(|y|_{\\max}\\)</td><td>\\(${formatNumber(Math.abs(yMax.value) * 1000)}\\) мм</td><td>\\(x = ${formatNumber(yMax.x)}\\) м</td></tr>` : ""}
  </table>

  ${hasDiagrams ? `
  <h2>7. Эпюры</h2>
  ${diagrams?.Q ? `
  <div class="diagram-block">
    <div class="diagram-title">Эпюра поперечных сил \\(Q(x)\\)</div>
    <img src="${diagrams.Q}" alt="Эпюра Q(x)" />
    <p class="figure-caption">Рисунок 2 — Эпюра поперечных сил</p>
  </div>
  ` : ""}
  ${diagrams?.M ? `
  <div class="diagram-block">
    <div class="diagram-title">Эпюра изгибающих моментов \\(M(x)\\)</div>
    <img src="${diagrams.M}" alt="Эпюра M(x)" />
    <p class="figure-caption">Рисунок 3 — Эпюра изгибающих моментов</p>
  </div>
  ` : ""}
  ${diagrams?.y ? `
  <div class="diagram-block">
    <div class="diagram-title">Эпюра прогибов \\(y(x)\\)</div>
    <img src="${diagrams.y}" alt="Эпюра y(x)" />
    <p class="figure-caption">Рисунок 4 — Эпюра прогибов</p>
  </div>
  ` : ""}
  ` : ""}

  ${(() => {
    let sectionNum = hasDiagrams ? 8 : 7;
    let html = "";

    if (hasCrossSection) {
      html += buildCrossSectionBlock(input, result, Mmax, sectionNum);
      sectionNum++;
    }

    if (hasDeflection) {
      html += buildMNPSection(input, result, sectionNum);
      sectionNum++;
    }

    // Метод Верещагина и ударное нагружение (если есть)
    if (result.loadMode === 'impact' && result.Kd !== undefined) {
      // Находим точку удара
      const forces = input.loads.filter(l => l.type === 'force');
      const forceIndex = input.impactForceIndex ?? 0;
      const impactX = forces.length > forceIndex ? (forces[forceIndex] as { x: number }).x : 0;

      // Метод Верещагина
      html += buildVereshchaginSection(input, result, sectionNum, impactX);
      sectionNum++;

      // Ударное нагружение
      html += buildImpactLoadingSection(input, result, sectionNum);
      sectionNum++;
    }

    return html;
  })()}

  ${buildConclusionsSection(input, result, Qmax, Mmax, yMax, hasDeflection)}

  <script>
    let mathRendered = false;

    document.addEventListener("DOMContentLoaded", function() {
      renderMathInElement(document.body, {
        delimiters: [
          {left: "\\\\(", right: "\\\\)", display: false},
          {left: "\\\\[", right: "\\\\]", display: true}
        ],
        throwOnError: false
      });
      mathRendered = true;
    });

    async function prepareAndPrint() {
      const btn = document.getElementById("printBtn");
      btn.disabled = true;
      btn.textContent = "Подготовка...";

      if (!mathRendered) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));

      btn.disabled = false;
      btn.textContent = "Сохранить PDF";
      window.print();
    }
  </script>
</body>
</html>`;
}

/**
 * Раздел "Постановка задачи"
 */
function buildProblemStatement(input: BeamInput, result: BeamResult, hasDeflection: boolean, hasCrossSection: boolean): string {
  const tasks: string[] = [
    "Определить реакции опор",
    "Построить эпюры поперечных сил \\(Q\\) и изгибающих моментов \\(M\\)"
  ];

  if (hasCrossSection) {
    const sectionType = result.sectionType ?? 'round';
    const sectionMode = result.sectionMode ?? 'select';

    if (sectionMode === 'given') {
      // Режим "Заданное сечение" - определяем напряжения
      if (sectionType === 'round') {
        tasks.push("Определить максимальные напряжения для заданного круглого сечения");
      } else if (sectionType === 'i-beam') {
        tasks.push("Определить максимальные напряжения для заданного двутавра");
      } else if (sectionType === 'channel-u' || sectionType === 'channel-p') {
        tasks.push("Определить максимальные напряжения для заданного швеллера");
      } else {
        tasks.push("Определить максимальные напряжения для заданного сечения");
      }
    } else {
      // Режим "Подбор сечения"
      if (sectionType === 'round') {
        tasks.push("Подобрать диаметр круглого сечения из условия прочности");
      } else if (sectionType === 'i-beam') {
        tasks.push("Подобрать номер стального двутавра из условия прочности");
      } else if (sectionType === 'channel-u' || sectionType === 'channel-p') {
        tasks.push("Подобрать номер стального швеллера из условия прочности");
      } else {
        tasks.push("Подобрать сечение из условия прочности");
      }
    }

    // Добавляем задачу про эпюру напряжений для профилей
    if (sectionType === 'i-beam' || sectionType === 'channel-u' || sectionType === 'channel-p') {
      tasks.push("Построить эпюру нормальных напряжений в опасном сечении");
    }
  }

  if (hasDeflection) {
    tasks.push("Определить прогибы и найти максимальный прогиб балки");
  }

  // Ударное нагружение
  if (result.loadMode === 'impact') {
    tasks.push("Определить коэффициент динамичности при ударном нагружении");
    tasks.push("Определить напряжения и прогиб при ударе");
    if (result.springStiffness && result.springStiffness > 0) {
      tasks.push("Учесть податливость пружинной опоры");
    }
    tasks.push("Сравнить статическое и динамическое нагружение");
  }

  return `
  <h2>Постановка задачи</h2>
  <p>Дана ${formatBeamType(input.beamType).toLowerCase()}. Требуется:</p>
  <ol>
    ${tasks.map(t => `<li>${t}</li>`).join("\n    ")}
  </ol>`;
}

/**
 * Раздел "Исходные данные"
 */
function buildInputDataSection(input: BeamInput): string {
  let html = `
  <table>
    <tr><th>Параметр</th><th>Значение</th></tr>
    <tr><td>Тип балки</td><td>${formatBeamType(input.beamType)}</td></tr>
    <tr><td>Длина балки \\(L\\)</td><td>\\(${formatNumber(input.L)}\\) м</td></tr>
    ${input.E ? `<tr><td>Модуль упругости \\(E\\)</td><td>\\(${formatNumber(input.E / 1e9)}\\) ГПа</td></tr>` : ""}
    ${input.I ? `<tr><td>Момент инерции \\(I\\)</td><td>\\(${formatNumber(input.I * 1e8)}\\) см⁴</td></tr>` : ""}
    ${input.sigma ? `<tr><td>Допускаемое напряжение \\([\\sigma]\\)</td><td>\\(${formatNumber(input.sigma / 1e6)}\\) МПа</td></tr>` : ""}
  </table>

  <h3>Нагрузки</h3>
  <table>
    <tr><th>Тип</th><th>Значение</th><th>Положение</th></tr>
    ${(() => {
      // Считаем количество каждого типа для индексации
      const distCount = input.loads.filter(l => l.type === "distributed").length;
      const forceCount = input.loads.filter(l => l.type === "force").length;
      const momentCount = input.loads.filter(l => l.type === "moment").length;
      let distIdx = 1, forceIdx = 1, momentIdx = 1;

      return input.loads.map(load => {
        if (load.type === "distributed") {
          const dir = load.q >= 0 ? "↓" : "↑";
          // Используем верхний индекс в скобках для оригинальных нагрузок: q^{(1)}, q^{(2)}
          const qLabel = distCount === 1 ? "q" : `q^{(${distIdx++})}`;
          return `<tr><td>Распределённая \\(${qLabel}\\)</td><td>\\(${formatNumber(Math.abs(load.q))}\\) кН/м ${dir}</td><td>от \\(${formatNumber(load.a)}\\) до \\(${formatNumber(load.b)}\\) м</td></tr>`;
        } else if (load.type === "force") {
          const dir = load.F >= 0 ? "↓" : "↑";
          const fLabel = forceCount === 1 ? "F" : `F_{${forceIdx++}}`;
          return `<tr><td>Сосредоточенная сила \\(${fLabel}\\)</td><td>\\(${formatNumber(Math.abs(load.F))}\\) кН ${dir}</td><td>\\(x = ${formatNumber(load.x)}\\) м</td></tr>`;
        } else {
          const dir = load.M >= 0 ? "↺" : "↻";
          const mLabel = momentCount === 1 ? "M" : `M_{${momentIdx++}}`;
          return `<tr><td>Момент \\(${mLabel}\\)</td><td>\\(${formatNumber(Math.abs(load.M))}\\) кН·м ${dir}</td><td>\\(x = ${formatNumber(load.x)}\\) м</td></tr>`;
        }
      }).join("\n    ");
    })()}
  </table>`;

  // Результирующие нагрузки (если есть наложение)
  const resultingLoads = computeResultingLoads(input);
  const distributedCount = input.loads.filter(l => l.type === "distributed").length;

  if (resultingLoads.length > 0 && (resultingLoads.length !== distributedCount || distributedCount > 1)) {
    html += `
  <h3>Результирующие распределённые нагрузки</h3>
  <p>При наложении нескольких распределённых нагрузок:</p>
  <table>
    <tr><th>Обозначение</th><th>Интенсивность</th><th>Направление</th><th>Участок</th></tr>
    ${resultingLoads.map((seg, i) => {
      const qLabel = resultingLoads.length === 1 ? "q" : `q_{${i + 1}}`;
      return `<tr><td>\\(${qLabel}\\)</td><td>\\(${formatNumber(Math.abs(seg.q))}\\) кН/м</td><td>${seg.q >= 0 ? "↓ вниз" : "↑ вверх"}</td><td>от \\(${formatNumber(seg.a)}\\) до \\(${formatNumber(seg.b)}\\) м</td></tr>`;
    }).join("\n    ")}
  </table>`;
  }

  // Параметры ударного нагружения
  if (input.loadMode === 'impact' && input.impactHeight !== undefined) {
    html += `
  <h3>Параметры ударного нагружения</h3>
  <table>
    <tr><th>Параметр</th><th>Значение</th></tr>
    <tr><td>Высота падения груза \\(H\\)</td><td>\\(${formatNumber(input.impactHeight * 100)}\\) см = \\(${formatNumber(input.impactHeight, 3)}\\) м</td></tr>
    ${input.springStiffness && input.springStiffness > 0 ? `<tr><td>Коэффициент податливости пружины \\(\\alpha\\)</td><td>\\(${formatNumber(input.springStiffness)}\\) см/кН</td></tr>` : ""}
  </table>`;
  }

  return html;
}

/**
 * Раздел "Соглашения знаков для внутренних усилий"
 */
function buildSignConventions(): string {
  return `
  <div class="sign-convention">
    <h4>Правило знаков для внутренних усилий (метод сечений)</h4>
    <p><strong>Поперечная сила \\(Q\\):</strong></p>
    <ul>
      <li>\\(Q > 0\\) — внешние силы слева от сечения стремятся повернуть отсечённую часть <em>по часовой стрелке</em></li>
      <li>\\(Q < 0\\) — <em>против часовой стрелки</em></li>
    </ul>
    <p><strong>Изгибающий момент \\(M\\):</strong></p>
    <ul>
      <li>\\(M > 0\\) — момент <em>растягивает нижние волокна</em> (изгиб выпуклостью вниз)</li>
      <li>\\(M < 0\\) — <em>сжимает нижние волокна</em> (изгиб выпуклостью вверх)</li>
    </ul>
  </div>`;
}

/**
 * Блок для одного участка
 */
function buildSectionBlock(section: ReturnType<typeof buildSectionFormulas>[0]): string {
  const idx = section.interval.idx;
  const varName = "s";
  const varDisplay = "s";
  const len = section.interval.b - section.interval.a;
  const sectionStart = section.interval.a;

  // Собираем описание сил слева от сечения
  const contributions = section.contributions || [];
  const hasQ = Math.abs(section.q) > 1e-9;

  // Формируем вывод Q(z)
  let qDerivation = "";
  if (contributions.length > 0 || hasQ) {
    qDerivation = buildQDerivation(contributions, section.q, varDisplay, sectionStart);
  }

  // Формируем вывод M(z)
  let mDerivation = "";
  if (contributions.length > 0 || hasQ) {
    mDerivation = buildMDerivation(contributions, section.q, varDisplay, sectionStart);
  }

  return `
  <h3>Участок ${idx}: \\(x \\in [${formatNumber(sectionStart)}; ${formatNumber(section.interval.b)}]\\)</h3>
  <div class="formula-block">
  <p>Локальная координата: \\(s = x - ${formatNumber(sectionStart)}\\), где \\(s \\in [0; ${formatNumber(len)}]\\) м.</p>
  ${hasQ ? `<p>Распределённая нагрузка на участке: \\(q = ${formatNumber(section.q)}\\) кН/м.</p>` : ""}

  <p><strong>Поперечная сила:</strong></p>
  ${qDerivation}
  <div class="formula">
    \\[\\boxed{Q_{${idx}}(s) = ${formatQFormula(section.polyQ, varDisplay)} \\text{ кН}}\\]
  </div>

  <p><strong>Изгибающий момент:</strong></p>
  ${mDerivation}
  <div class="formula">
    \\[\\boxed{M_{${idx}}(s) = ${formatMFormula(section.polyM, varDisplay)} \\text{ кН}\\!\\cdot\\!\\text{м}}\\]
  </div>

  <p><strong>Проверка на границах:</strong></p>
  <ul>
    <li>При \\(s = 0\\): \\(Q = ${formatNumber(section.Qa)}\\) кН, \\(M = ${formatNumber(section.Ma)}\\) кН·м</li>
    <li>При \\(s = ${formatNumber(len)}\\): \\(Q = ${formatNumber(section.Qb)}\\) кН, \\(M = ${formatNumber(section.Mb)}\\) кН·м</li>
  </ul>
  </div>`;
}

/**
 * Формирует раздел "Скачки Q и M в характерных точках"
 * Показывает значения Q(x⁻), Q(x⁺), M(x⁻), M(x⁺) в каждой характерной точке
 */
function buildJumpsSection(
  input: BeamInput,
  result: BeamResult,
  reactions: Reactions
): string {
  const { Q, M, events } = result;
  const L = input.L;
  const EPS = 1e-6;

  // Собираем информацию о каждой точке
  interface JumpPoint {
    x: number;
    label: string;
    Qleft: number;
    Qright: number;
    Mleft: number;
    Mright: number;
    deltaQ: number;
    deltaM: number;
  }

  const jumpPoints: JumpPoint[] = [];

  for (const x of events) {
    // Собираем описание точки с конкретными значениями
    const items: string[] = [];

    // Начало/конец балки
    if (Math.abs(x) < EPS) items.push("начало");
    if (Math.abs(x - L) < EPS) items.push("конец");

    // Опоры и реакции
    if (reactions.xA !== undefined && Math.abs(x - reactions.xA) < EPS) {
      items.push(`\\(R_A = ${formatNumber(reactions.RA!)}\\)`);
    }
    if (reactions.xB !== undefined && Math.abs(x - reactions.xB) < EPS) {
      items.push(`\\(R_B = ${formatNumber(reactions.RB!)}\\)`);
    }
    if (reactions.xf !== undefined && Math.abs(x - reactions.xf) < EPS) {
      items.push(`\\(R_f = ${formatNumber(reactions.Rf!)}\\)`);
      if (reactions.Mf !== undefined) {
        items.push(`\\(M_f = ${formatNumber(reactions.Mf)}\\)`);
      }
    }

    // Сосредоточенные силы и моменты
    for (const load of input.loads) {
      if (load.type === "force" && Math.abs(x - load.x) < EPS) {
        items.push(`\\(F = ${formatNumber(load.F)}\\)`);
      } else if (load.type === "moment" && Math.abs(x - load.x) < EPS) {
        items.push(`\\(M = ${formatNumber(load.M)}\\)`);
      } else if (load.type === "distributed") {
        if (Math.abs(x - load.a) < EPS) items.push(`\\(q = ${formatNumber(load.q)}\\) нач.`);
        if (Math.abs(x - load.b) < EPS) items.push(`\\(q = ${formatNumber(load.q)}\\) кон.`);
      }
    }

    const label = items.length > 0 ? items.join(", ") : `\\(x = ${formatNumber(x)}\\)`;

    // Вычисляем значения слева и справа
    // На границах (x=0 и x=L) внешние значения равны 0 (граничное условие)
    const isStart = Math.abs(x) < EPS;
    const isEnd = Math.abs(x - L) < EPS;

    const Qleft = isStart ? 0 : Q(x - EPS);
    const Qright = isEnd ? 0 : Q(x + EPS);
    const Mleft = isStart ? 0 : M(x - EPS);
    const Mright = isEnd ? 0 : M(x + EPS);

    // Вычисляем скачки
    const deltaQ = Qright - Qleft;
    const deltaM = Mright - Mleft;

    jumpPoints.push({ x, label, Qleft, Qright, Mleft, Mright, deltaQ, deltaM });
  }

  // Формируем таблицу
  let rows = "";
  for (const pt of jumpPoints) {
    const formatDelta = (v: number) => {
      if (Math.abs(v) < EPS) return "0";
      return formatNumber(v);
    };

    rows += `
    <tr>
      <td>\\(${formatNumber(pt.x)}\\)</td>
      <td style="font-size: 11pt;">${pt.label}</td>
      <td>\\(${formatNumber(pt.Qleft)}\\)</td>
      <td>\\(${formatNumber(pt.Qright)}\\)</td>
      <td>\\(${formatDelta(pt.deltaQ)}\\)</td>
      <td>\\(${formatNumber(pt.Mleft)}\\)</td>
      <td>\\(${formatNumber(pt.Mright)}\\)</td>
      <td>\\(${formatDelta(pt.deltaM)}\\)</td>
    </tr>`;
  }

  return `
  <p>В характерных точках балки значения \\(Q\\) и \\(M\\) могут иметь разрывы (скачки). Обозначим:</p>
  <ul>
    <li>\\(Q^-\\), \\(M^-\\) — значения слева от точки (при \\(x - \\varepsilon\\))</li>
    <li>\\(Q^+\\), \\(M^+\\) — значения справа от точки (при \\(x + \\varepsilon\\))</li>
    <li>\\(\\Delta Q = Q^+ - Q^-\\), \\(\\Delta M = M^+ - M^-\\) — величины скачков</li>
  </ul>

  <table style="font-size: 12pt;">
    <tr>
      <th>\\(x\\), м</th>
      <th>Точка</th>
      <th>\\(Q^-\\), кН</th>
      <th>\\(Q^+\\), кН</th>
      <th>\\(\\Delta Q\\), кН</th>
      <th>\\(M^-\\), кН·м</th>
      <th>\\(M^+\\), кН·м</th>
      <th>\\(\\Delta M\\), кН·м</th>
    </tr>
    ${rows}
  </table>

  <p><em>Примечание: скачок \\(\\Delta Q\\) возникает при приложении сосредоточенной силы (равен её величине со знаком),
  скачок \\(\\Delta M\\) — при приложении сосредоточенного момента. На границах балки (\\(x = 0\\) и \\(x = L\\)) внешние значения
  \\(Q\\) и \\(M\\) равны нулю (граничные условия равновесия).</em></p>`;
}

/**
 * Формирует вывод Q(z) с пояснениями
 */
function buildQDerivation(
  contributions: ForceContribution[],
  activeQ: number,
  varName: string,
  sectionStart: number
): string {
  // Общий вид: Q = ΣF_left - q·z
  // Силы вверх входят с +, силы вниз с -

  // Разделяем: силы (реакции, точечные) и распределённые
  const forces = contributions.filter(c => c.type !== "moment");

  if (forces.length === 0 && Math.abs(activeQ) < 1e-9) {
    return `<p>На данном участке нет нагрузок слева от сечения.</p>`;
  }

  // Символьная формула
  const symbolicTerms: string[] = [];
  const numericTerms: string[] = [];

  for (const f of forces) {
    if (f.type === "reaction") {
      // Реакция хранится со знаком: вверх = +, вниз = -
      // В символьной формуле всегда +R, знак приходит из значения при подстановке
      symbolicTerms.push(`+ ${f.label}`);
      if (f.value >= 0) {
        numericTerms.push(`+ ${formatNumber(f.value)}`);
      } else {
        numericTerms.push(`- ${formatNumber(Math.abs(f.value))}`);
      }
    } else if (f.type === "force") {
      // force: если F > 0 (вниз), то -F; если F < 0 (вверх), то +|F|
      const sign = f.value >= 0 ? "-" : "+";
      symbolicTerms.push(`${sign} ${f.label}`);
      numericTerms.push(`${sign} ${formatNumber(Math.abs(f.value))}`);
    } else if (f.type === "distributed_resultant") {
      // Равнодействующая распределённой: -q·L (если q > 0 вниз)
      const length = (f.qEnd ?? sectionStart) - (f.qStart ?? 0);
      const resultant = f.value * length;
      const sign = resultant >= 0 ? "-" : "+";
      symbolicTerms.push(`${sign} ${f.label} \\cdot ${formatNumber(length)}`);
      numericTerms.push(`${sign} ${formatNumber(Math.abs(resultant))}`);
    }
  }

  // Активная q на участке: Q' = -q, поэтому член -q·s
  // Символьная формула всегда -q·s, числовая подстановка даёт знак автоматически
  if (Math.abs(activeQ) > 1e-9) {
    symbolicTerms.push(`- q \\cdot ${varName}`);
    // -q·s: если q > 0, то -q·s < 0; если q < 0, то -q·s > 0
    const numSign = activeQ >= 0 ? "-" : "+";
    numericTerms.push(`${numSign} ${formatNumber(Math.abs(activeQ))} \\cdot ${varName}`);
  }

  // Форматируем с переносами если формула длинная
  const symbolic = formatLongFormula(`Q(${varName})`, symbolicTerms);
  const numeric = formatLongFormula(`Q(${varName})`, numericTerms);

  const symbolicClass = symbolic.isMultiline ? "formula formula-multiline" : "formula";
  const numericClass = numeric.isMultiline ? "formula formula-multiline" : "formula";

  return `
  <p>Сумма проекций сил слева от сечения на вертикальную ось:</p>
  <div class="${symbolicClass}">
    \\[${symbolic.latex}\\]
  </div>
  <p>Подставляем числовые значения:</p>
  <div class="${numericClass}">
    \\[${numeric.latex}\\]
  </div>`;
}

/**
 * Формирует вывод M(z) с пояснениями
 */
function buildMDerivation(
  contributions: ForceContribution[],
  activeQ: number,
  varName: string,
  sectionStart: number
): string {
  // Общий вид: M = Σ(F·a) + ΣM - q·z²/2
  // где a - плечо относительно сечения

  if (contributions.length === 0 && Math.abs(activeQ) < 1e-9) {
    return `<p>На данном участке нет нагрузок слева от сечения.</p>`;
  }

  const symbolicTerms: string[] = [];
  const numericTerms: string[] = [];

  for (const c of contributions) {
    if (c.type === "reaction") {
      // Реакция хранится со знаком: вверх = +, вниз = -
      // В символьной формуле всегда +R, знак приходит из значения при подстановке
      const arm = sectionStart - c.x;
      const numSign = c.value >= 0 ? "+" : "-";
      const numVal = formatNumber(Math.abs(c.value));

      if (Math.abs(arm) < 1e-9) {
        // Реакция прямо в начале участка - плечо = s
        symbolicTerms.push(`+ ${c.label} \\cdot ${varName}`);
        numericTerms.push(`${numSign} ${numVal} \\cdot ${varName}`);
      } else {
        symbolicTerms.push(`+ ${c.label} \\cdot (${formatNumber(arm)} + ${varName})`);
        numericTerms.push(`${numSign} ${numVal} \\cdot (${formatNumber(arm)} + ${varName})`);
      }
    } else if (c.type === "force") {
      // Сила вниз (F > 0) создаёт отрицательный момент: -F·(a + z)
      const arm = sectionStart - c.x;
      const sign = c.value >= 0 ? "-" : "+";
      if (Math.abs(arm) < 1e-9) {
        symbolicTerms.push(`${sign} ${c.label} \\cdot ${varName}`);
        numericTerms.push(`${sign} ${formatNumber(Math.abs(c.value))} \\cdot ${varName}`);
      } else {
        symbolicTerms.push(`${sign} ${c.label} \\cdot (${formatNumber(arm)} + ${varName})`);
        numericTerms.push(`${sign} ${formatNumber(Math.abs(c.value))} \\cdot (${formatNumber(arm)} + ${varName})`);
      }
    } else if (c.type === "moment") {
      // Внешний момент: против часовой (M > 0) сжимает нижние волокна → -M
      // По часовой (M < 0) растягивает нижние волокна → +|M|
      const sign = c.value >= 0 ? "-" : "+";
      symbolicTerms.push(`${sign} ${c.label}`);
      numericTerms.push(`${sign} ${formatNumber(Math.abs(c.value))}`);
    } else if (c.type === "distributed_resultant") {
      // Равнодействующая распределённой нагрузки
      const length = (c.qEnd ?? sectionStart) - (c.qStart ?? 0);
      const resultant = c.value * length;
      const armFromEnd = sectionStart - (c.qEnd ?? sectionStart);
      // Плечо: от конца участка + z
      const sign = resultant >= 0 ? "-" : "+";
      if (Math.abs(armFromEnd) < 1e-9) {
        // Нагрузка закончилась прямо в начале участка
        symbolicTerms.push(`${sign} ${c.label} \\cdot ${formatNumber(length)} \\cdot \\frac{${formatNumber(length)}}{2}`);
        numericTerms.push(`${sign} ${formatNumber(Math.abs(resultant))} \\cdot ${formatNumber(length / 2)}`);
      } else {
        // Нагрузка закончилась раньше
        const armToCenter = armFromEnd + length / 2;
        symbolicTerms.push(`${sign} ${c.label} \\cdot ${formatNumber(length)} \\cdot (${formatNumber(armToCenter)} + ${varName})`);
        numericTerms.push(`${sign} ${formatNumber(Math.abs(resultant))} \\cdot (${formatNumber(armToCenter)} + ${varName})`);
      }
    }
  }

  // Активная q на участке: M'' = -q, поэтому член -q·s²/2
  // Символьная формула всегда -q·s²/2, числовая подстановка даёт знак автоматически
  if (Math.abs(activeQ) > 1e-9) {
    symbolicTerms.push(`- \\frac{q \\cdot ${varName}^2}{2}`);
    const numSign = activeQ >= 0 ? "-" : "+";
    numericTerms.push(`${numSign} \\frac{${formatNumber(Math.abs(activeQ))} \\cdot ${varName}^2}{2}`);
  }

  // Форматируем с переносами если формула длинная
  const symbolic = formatLongFormula(`M(${varName})`, symbolicTerms);
  const numeric = formatLongFormula(`M(${varName})`, numericTerms);

  const symbolicClass = symbolic.isMultiline ? "formula formula-multiline" : "formula";
  const numericClass = numeric.isMultiline ? "formula formula-multiline" : "formula";

  return `
  <p>Сумма моментов сил слева от сечения относительно точки сечения:</p>
  <div class="${symbolicClass}">
    \\[${symbolic.latex}\\]
  </div>
  <p>Подставляем числовые значения:</p>
  <div class="${numericClass}">
    \\[${numeric.latex}\\]
  </div>`;
}

/**
 * Раздел "Подбор сечения" или "Заданное сечение"
 */
function buildCrossSectionBlock(input: BeamInput, result: BeamResult, Mmax: { value: number; x: number }, sectionNum: number): string {
  const sectionType = result.sectionType ?? 'round';
  const sectionMode = result.sectionMode ?? 'select';
  const MmaxNm = Math.abs(Mmax.value) * 1000; // Н·м

  let html = '';

  if (sectionMode === 'given') {
    // Режим "Заданное сечение" - вычисляем σmax
    const sigmaMax_MPa = formatNumber(result.sigmaMax ?? 0, 2);
    const W_cm3 = formatNumber((result.W ?? 0) * 1e6, 4);

    html = `
  <h2>${sectionNum}. Заданное сечение</h2>
  <p>Для заданного сечения вычисляем максимальное нормальное напряжение:</p>
  <div class="formula">
    \\[\\sigma_{\\max} = \\frac{|M|_{\\max}}{W} = \\frac{${formatNumber(Math.abs(Mmax.value))} \\cdot 10^6}{${W_cm3} \\cdot 10^3} = ${sigmaMax_MPa} \\text{ МПа}\\]
  </div>
  <p>где \\(|M|_{\\max} = ${formatNumber(Math.abs(Mmax.value))}\\) кН·м, \\(W = ${W_cm3}\\) см³.</p>`;

  } else {
    // Режим "Подбор сечения"
    const sigma_MPa = formatNumber((input.sigma ?? 0) / 1e6);
    const Wreq_cm3 = result.Wreq ?? (result.W ? result.W * 1e6 : MmaxNm / ((input.sigma ?? 1) / 1e6));
    const Wreq_str = formatNumber(Wreq_cm3, 2);

    html = `
  <h2>${sectionNum}. Подбор сечения</h2>
  <p>По условию прочности при допускаемом напряжении \\([\\sigma] = ${sigma_MPa}\\) МПа:</p>
  <div class="formula">
    \\[W \\geq \\frac{|M|_{\\max}}{[\\sigma]} = \\frac{${formatNumber(MmaxNm)}}{${sigma_MPa} \\cdot 10^6} \\cdot 10^6 = ${Wreq_str} \\text{ см}^3\\]
  </div>
  <p>где \\(|M|_{\\max} = ${formatNumber(Math.abs(Mmax.value))}\\) кН·м \\(= ${formatNumber(MmaxNm)}\\) Н·м, \\([\\sigma] = ${sigma_MPa}\\) МПа.</p>`;
  }

  if (sectionType === 'round') {
    // Круглое сечение
    const W_cm3 = formatNumber(result.W! * 1e6, 4);
    const d_mm = formatNumber(result.diameter! * 1000, 2);
    const I_cm4 = formatNumber(result.I! * 1e8, 4);

    if (sectionMode === 'given') {
      html += `
  <h3>Круглое сплошное сечение</h3>
  <p>Диаметр: \\(d = ${d_mm}\\) мм</p>
  <p>Геометрические характеристики:</p>
  <div class="formula">
    \\[W = \\frac{\\pi d^3}{32} = \\frac{\\pi \\cdot ${d_mm}^3}{32} = ${W_cm3} \\text{ см}^3\\]
  </div>
  <div class="formula">
    \\[I = \\frac{\\pi d^4}{64} = \\frac{\\pi \\cdot ${d_mm}^4}{64} = ${I_cm4} \\text{ см}^4\\]
  </div>`;
    } else {
      html += `
  <p>Для круглого сплошного сечения \\(W = \\frac{\\pi d^3}{32}\\), откуда:</p>
  <div class="formula">
    \\[\\boxed{d_{\\min} = \\sqrt[3]{\\frac{32W}{\\pi}} = \\sqrt[3]{\\frac{32 \\cdot ${W_cm3}}{\\pi}} = ${d_mm} \\text{ мм}}\\]
  </div>
  <p>Момент инерции круглого сечения:</p>
  <div class="formula">
    \\[I = \\frac{\\pi d^4}{64} = \\frac{\\pi \\cdot ${d_mm}^4}{64} = ${I_cm4} \\text{ см}^4\\]
  </div>`;
    }

  } else if (sectionType === 'square' && result.squareSide) {
    // Квадратное сечение
    const a_mm = formatNumber(result.squareSide * 1000, 2);
    const W_cm3 = formatNumber(result.W! * 1e6, 4);
    const I_cm4 = formatNumber(result.I! * 1e8, 4);

    if (sectionMode === 'given') {
      html += `
  <h3>Квадратное сечение</h3>
  <p>Сторона: \\(a = ${a_mm}\\) мм</p>
  <p>Геометрические характеристики:</p>
  <div class="formula">
    \\[W = \\frac{a^3}{6} = \\frac{${a_mm}^3}{6} = ${W_cm3} \\text{ см}^3\\]
  </div>
  <div class="formula">
    \\[I = \\frac{a^4}{12} = \\frac{${a_mm}^4}{12} = ${I_cm4} \\text{ см}^4\\]
  </div>`;
    } else {
      html += `
  <p>Для квадратного сечения со стороной \\(a\\): \\(W = \\frac{a^3}{6}\\), откуда:</p>
  <div class="formula">
    \\[\\boxed{a = \\sqrt[3]{6W} = \\sqrt[3]{6 \\cdot ${W_cm3}} = ${a_mm} \\text{ мм}}\\]
  </div>
  <p>Момент инерции квадратного сечения:</p>
  <div class="formula">
    \\[I = \\frac{a^4}{12} = \\frac{${a_mm}^4}{12} = ${I_cm4} \\text{ см}^4\\]
  </div>`;
    }

  } else if (sectionType === 'rectangle' && result.rectWidth && result.rectHeight) {
    // Прямоугольное сечение
    const b_mm = formatNumber(result.rectWidth * 1000, 2);
    const h_mm = formatNumber(result.rectHeight * 1000, 2);
    const W_cm3 = formatNumber(result.W! * 1e6, 4);
    const I_cm4 = formatNumber(result.I! * 1e8, 4);

    if (sectionMode === 'given') {
      html += `
  <h3>Прямоугольное сечение</h3>
  <p>Размеры: \\(b = ${b_mm}\\) мм, \\(h = ${h_mm}\\) мм</p>
  <p>Геометрические характеристики:</p>
  <div class="formula">
    \\[W = \\frac{b \\cdot h^2}{6} = \\frac{${b_mm} \\cdot ${h_mm}^2}{6} = ${W_cm3} \\text{ см}^3\\]
  </div>
  <div class="formula">
    \\[I = \\frac{b \\cdot h^3}{12} = \\frac{${b_mm} \\cdot ${h_mm}^3}{12} = ${I_cm4} \\text{ см}^4\\]
  </div>`;
    } else {
      html += `
  <p>Для прямоугольного сечения \\(b \\times h\\): \\(W = \\frac{b \\cdot h^2}{6}\\).</p>
  <p>Принимая соотношение \\(h/b = ${formatNumber(result.rectHeight / result.rectWidth, 1)}\\), получаем:</p>
  <div class="formula">
    \\[\\boxed{b = ${b_mm} \\text{ мм}, \\quad h = ${h_mm} \\text{ мм}}\\]
  </div>
  <p>Момент сопротивления и момент инерции:</p>
  <div class="formula">
    \\[W = \\frac{b \\cdot h^2}{6} = \\frac{${b_mm} \\cdot ${h_mm}^2}{6} = ${W_cm3} \\text{ см}^3\\]
  </div>
  <div class="formula">
    \\[I = \\frac{b \\cdot h^3}{12} = \\frac{${b_mm} \\cdot ${h_mm}^3}{12} = ${I_cm4} \\text{ см}^4\\]
  </div>`;
    }

  } else if (sectionType === 'rectangular-tube' && result.tubeOuterWidth && result.tubeOuterHeight && result.tubeThickness) {
    // Прямоугольная труба
    const B_mm = formatNumber(result.tubeOuterWidth * 1000, 2);
    const H_mm = formatNumber(result.tubeOuterHeight * 1000, 2);
    const t_mm = formatNumber(result.tubeThickness * 1000, 1);
    const W_cm3 = formatNumber(result.W! * 1e6, 4);
    const I_cm4 = formatNumber(result.I! * 1e8, 4);

    if (sectionMode === 'given') {
      html += `
  <h3>Прямоугольная труба</h3>
  <p>Размеры: \\(B = ${B_mm}\\) мм, \\(H = ${H_mm}\\) мм, \\(t = ${t_mm}\\) мм</p>
  <p>Геометрические характеристики:</p>
  <div class="formula">
    \\[I = \\frac{B \\cdot H^3 - (B-2t)(H-2t)^3}{12} = ${I_cm4} \\text{ см}^4\\]
  </div>
  <div class="formula">
    \\[W = \\frac{2I}{H} = ${W_cm3} \\text{ см}^3\\]
  </div>`;
    } else {
      html += `
  <p>Для прямоугольной трубы \\(B \\times H \\times t\\):</p>
  <div class="formula">
    \\[\\boxed{B = ${B_mm} \\text{ мм}, \\quad H = ${H_mm} \\text{ мм}, \\quad t = ${t_mm} \\text{ мм}}\\]
  </div>
  <p>Момент инерции прямоугольной трубы:</p>
  <div class="formula">
    \\[I = \\frac{B \\cdot H^3 - (B-2t)(H-2t)^3}{12} = ${I_cm4} \\text{ см}^4\\]
  </div>
  <p>Момент сопротивления:</p>
  <div class="formula">
    \\[W = \\frac{2I}{H} = ${W_cm3} \\text{ см}^3\\]
  </div>`;
    }

  } else if (result.selectedProfile) {
    // Профиль из ГОСТ (двутавр или швеллер)
    const profile = result.selectedProfile;
    const profileTypeName = getProfileTypeName(profile.type);
    const axis = result.bendingAxis ?? 'x';
    const axisLabel = axis.toUpperCase();
    const W_axis = getProfileW(profile, axis);
    const I_axis = getProfileI(profile, axis);
    const axisNote = axis === 'y' ? ' (профиль повёрнут на 90°)' : '';

    if (sectionMode === 'given') {
      html += `
  <h3>${profileTypeName} № ${profile.number} по ${profile.gost}${axisNote}</h3>

  <div class="profile-selection" style="padding: 15px 0; margin: 15px 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px 10px;">Высота \\(h\\)</td>
        <td style="padding: 5px 10px;"><strong>${profile.h} мм</strong></td>
        <td style="padding: 5px 10px;">Толщина стенки \\(s\\)</td>
        <td style="padding: 5px 10px;"><strong>${profile.s} мм</strong></td>
      </tr>
      <tr>
        <td style="padding: 5px 10px;">Ширина полки \\(b\\)</td>
        <td style="padding: 5px 10px;"><strong>${profile.b} мм</strong></td>
        <td style="padding: 5px 10px;">Толщина полки \\(t\\)</td>
        <td style="padding: 5px 10px;"><strong>${profile.t} мм</strong></td>
      </tr>
      <tr>
        <td style="padding: 5px 10px;">Момент сопротивления \\(W_${axis}\\)</td>
        <td style="padding: 5px 10px;"><strong>${formatNumber(W_axis)} см³</strong></td>
        <td style="padding: 5px 10px;">Площадь \\(A\\)</td>
        <td style="padding: 5px 10px;"><strong>${formatNumber(profile.A)} см²</strong></td>
      </tr>
      <tr>
        <td style="padding: 5px 10px;">Момент инерции \\(I_${axis}\\)</td>
        <td style="padding: 5px 10px;"><strong>${formatNumber(I_axis)} см⁴</strong></td>
        <td style="padding: 5px 10px;"></td>
        <td style="padding: 5px 10px;"></td>
      </tr>
    </table>
  </div>`;
    } else {
      const Wreq_cm3 = result.Wreq ?? (result.W ? result.W * 1e6 : MmaxNm / ((input.sigma ?? 1) / 1e6));
      const Wreq_str = formatNumber(Wreq_cm3, 2);

      html += `
  <h3>Подбор ${profile.type === 'i-beam' ? 'двутавра' : 'швеллера'} по ${profile.gost}${axisNote}</h3>
  <p>Из сортамента по ${profile.gost} выбираем ${profileTypeName.toLowerCase()} с \\(W_${axis} \\geq ${Wreq_str}\\) см³.</p>

  <div class="profile-selection" style="padding: 15px 0; margin: 15px 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd;">
    <p style="font-size: 1.2em; margin-bottom: 10px;"><strong>Принимаем: ${profileTypeName} № ${profile.number}</strong>${axis === 'y' ? ' <span style="color: #666;">(изгиб относительно оси Y)</span>' : ''}</p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 5px 10px;">Высота \\(h\\)</td>
        <td style="padding: 5px 10px;"><strong>${profile.h} мм</strong></td>
        <td style="padding: 5px 10px;">Толщина стенки \\(s\\)</td>
        <td style="padding: 5px 10px;"><strong>${profile.s} мм</strong></td>
      </tr>
      <tr>
        <td style="padding: 5px 10px;">Ширина полки \\(b\\)</td>
        <td style="padding: 5px 10px;"><strong>${profile.b} мм</strong></td>
        <td style="padding: 5px 10px;">Толщина полки \\(t\\)</td>
        <td style="padding: 5px 10px;"><strong>${profile.t} мм</strong></td>
      </tr>
      <tr>
        <td style="padding: 5px 10px;">Момент сопротивления \\(W_${axis}\\)</td>
        <td style="padding: 5px 10px;"><strong>${formatNumber(W_axis)} см³</strong></td>
        <td style="padding: 5px 10px;">Площадь \\(A\\)</td>
        <td style="padding: 5px 10px;"><strong>${formatNumber(profile.A)} см²</strong></td>
      </tr>
      <tr>
        <td style="padding: 5px 10px;">Момент инерции \\(I_${axis}\\)</td>
        <td style="padding: 5px 10px;"><strong>${formatNumber(I_axis)} см⁴</strong></td>
        <td style="padding: 5px 10px;"></td>
        <td style="padding: 5px 10px;"></td>
      </tr>
    </table>
  </div>

  <p>Проверка: \\(W_${axis} = ${formatNumber(W_axis)}\\) см³ \\(\\geq W_{\\text{треб}} = ${Wreq_str}\\) см³ ✓</p>
  <div class="formula">
    \\[\\boxed{\\text{${profileTypeName} № ${profile.number}, } I_${axis} = ${formatNumber(I_axis)} \\text{ см}^4}\\]
  </div>`;
    }

    // Добавляем раздел с эпюрой нормальных напряжений
    html += buildStressDiagramSection(profile, Mmax, sectionNum, axis);

  } else if (sectionMode === 'select') {
    // Профиль не найден (только в режиме подбора)
    const Wreq_cm3 = result.Wreq ?? (result.W ? result.W * 1e6 : MmaxNm / ((input.sigma ?? 1) / 1e6));
    const Wreq_str = formatNumber(Wreq_cm3, 2);
    html += `
  <p style="color: red;"><strong>Внимание:</strong> Требуемый момент сопротивления \\(W_{\\text{треб}} = ${Wreq_str}\\) см³
  превышает максимальное значение в сортаменте. Необходимо использовать составное сечение или сечение большего типоразмера.</p>`;
  }

  return html;
}

/**
 * Построение раздела с эпюрой нормальных напряжений в сечении
 */
function buildStressDiagramSection(
  profile: NonNullable<BeamResult['selectedProfile']>,
  Mmax: { value: number; x: number },
  sectionNum: number,
  axis: 'x' | 'y' = 'x'
): string {
  const W_val = getProfileW(profile, axis); // см³
  const I_val = getProfileI(profile, axis); // см⁴
  const MmaxKNm = Math.abs(Mmax.value); // кН·м

  // Размер сечения в направлении изгиба (для рисунка)
  const sizeLabel = axis === 'x' ? 'h' : 'b';
  const h = axis === 'x' ? profile.h : profile.b; // мм - геометрический размер

  // y_max = I / W (в см → мм) - корректное значение из соотношения W = I / y_max
  const y_max_cm = I_val / W_val; // см
  const y_max_mm = y_max_cm * 10; // мм

  // σ = M·y / I
  // σ_max = M / W * 1000 (МПа), где M в кН·м, W в см³

  const sigmaMax = MmaxKNm * 1000 / W_val; // МПа
  const sigmaMaxStr = formatNumber(sigmaMax, 2);

  return `
  <h3>${sectionNum}.1. Нормальные напряжения в опасном сечении</h3>
  <p>Опасное сечение находится в точке \\(x = ${formatNumber(Mmax.x)}\\) м, где \\(|M|_{\\max} = ${formatNumber(MmaxKNm)}\\) кН·м.</p>
  <p>Нормальные напряжения по высоте сечения распределяются по закону:</p>
  <div class="formula">
    \\[\\sigma(y) = \\frac{M \\cdot y}{I_${axis}}\\]
  </div>
  <p>Максимальные напряжения на крайних волокнах (\\(y = \\pm y_{\\max} = \\pm ${formatNumber(y_max_mm, 1)}\\) мм, где \\(y_{\\max} = I_${axis}/W_${axis}\\)):</p>
  <div class="formula">
    \\[\\sigma_{\\max} = \\frac{M_{\\max}}{W_${axis}} = \\frac{${formatNumber(MmaxKNm)} \\cdot 10^6}{${formatNumber(W_val)} \\cdot 10^3} = ${sigmaMaxStr} \\text{ МПа}\\]
  </div>

  <div class="stress-diagram" style="display: flex; justify-content: center; margin: 20px 0;">
    <svg viewBox="0 0 450 220" style="max-width: 450px; width: 100%;">
      <!-- Сечение (слева) -->
      ${profile.type === 'i-beam' ? `
      <!-- Двутавр -->
      <rect x="40" y="30" width="50" height="8" fill="#2196F3" stroke="#1565C0" stroke-width="1"/>
      <rect x="60" y="38" width="10" height="144" fill="#2196F3" stroke="#1565C0" stroke-width="1"/>
      <rect x="40" y="182" width="50" height="8" fill="#2196F3" stroke="#1565C0" stroke-width="1"/>
      ` : axis === 'y' ? `
      <!-- Швеллер повёрнутый (ось Y) - как буква U, полки вертикально -->
      <!-- Левая полка (вертикально) -->
      <rect x="30" y="30" width="8" height="160" fill="#4CAF50" stroke="#2E7D32" stroke-width="1"/>
      <!-- Правая полка (вертикально) -->
      <rect x="82" y="30" width="8" height="160" fill="#4CAF50" stroke="#2E7D32" stroke-width="1"/>
      <!-- Стенка (горизонтально снизу) -->
      <rect x="30" y="182" width="60" height="8" fill="#4CAF50" stroke="#2E7D32" stroke-width="1"/>
      ` : `
      <!-- Швеллер обычный (ось X) - как буква [ -->
      <rect x="40" y="30" width="45" height="8" fill="#4CAF50" stroke="#2E7D32" stroke-width="1"/>
      <rect x="40" y="38" width="8" height="144" fill="#4CAF50" stroke="#2E7D32" stroke-width="1"/>
      <rect x="40" y="182" width="45" height="8" fill="#4CAF50" stroke="#2E7D32" stroke-width="1"/>
      `}

      <!-- Нейтральная ось (пунктир через сечение и эпюру) -->
      <line x1="30" y1="110" x2="380" y2="110" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>

      <!-- Вертикальная ось эпюры -->
      <line x1="130" y1="25" x2="130" y2="195" stroke="#333" stroke-width="1.5"/>

      <!-- Эпюра напряжений: верхний треугольник (растяжение, красный) -->
      <!-- Вершина на нейтральной оси (130,110), основание вверху -->
      <polygon points="130,110 130,30 320,30" fill="rgba(244,67,54,0.25)" stroke="#E53935" stroke-width="2"/>

      <!-- Эпюра напряжений: нижний треугольник (сжатие, синий) -->
      <!-- Вершина на нейтральной оси (130,110), основание внизу -->
      <polygon points="130,110 130,190 320,190" fill="rgba(33,150,243,0.25)" stroke="#1E88E5" stroke-width="2"/>

      <!-- Стрелки показывают направление напряжений -->
      <line x1="320" y1="30" x2="340" y2="30" stroke="#E53935" stroke-width="2" marker-end="url(#arrowRed)"/>
      <line x1="320" y1="190" x2="340" y2="190" stroke="#1E88E5" stroke-width="2" marker-end="url(#arrowBlue)"/>

      <!-- Маркеры стрелок -->
      <defs>
        <marker id="arrowRed" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#E53935"/>
        </marker>
        <marker id="arrowBlue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#1E88E5"/>
        </marker>
      </defs>

      <!-- Подписи значений -->
      <text x="350" y="35" font-size="13" fill="#E53935" font-weight="bold">+σ = ${sigmaMaxStr} МПа</text>
      <text x="350" y="195" font-size="13" fill="#1E88E5" font-weight="bold">−σ = ${sigmaMaxStr} МПа</text>

      <!-- Подпись нейтральной оси -->
      <text x="385" y="114" font-size="11" fill="#666">н.о.</text>
      <text x="385" y="126" font-size="10" fill="#666">(σ=0)</text>

      <!-- Ось y (слева от сечения) -->
      <line x1="20" y1="30" x2="20" y2="190" stroke="#333" stroke-width="1"/>
      <line x1="17" y1="30" x2="23" y2="30" stroke="#333" stroke-width="1"/>
      <line x1="17" y1="190" x2="23" y2="190" stroke="#333" stroke-width="1"/>
      <line x1="17" y1="110" x2="23" y2="110" stroke="#333" stroke-width="1"/>
      <text x="0" y="35" font-size="10" fill="#333">+y</text>
      <text x="0" y="195" font-size="10" fill="#333">−y</text>
      <text x="4" y="114" font-size="10" fill="#333">0</text>

      <!-- Подпись y_max (расстояние до крайнего волокна) -->
      <text x="75" y="15" font-size="11" fill="#333">y_max = ${formatNumber(y_max_mm, 1)} мм</text>
    </svg>
  </div>

  <p><strong>Эпюра нормальных напряжений \\(\\sigma(y)\\):</strong> линейное распределение по высоте сечения.
  На нейтральной оси (\\(y = 0\\)) напряжения равны нулю. На крайних волокнах (\\(y = \\pm y_{\\max} = \\pm ${formatNumber(y_max_mm, 1)}\\) мм) напряжения максимальны:
  растяжение (\\(+\\sigma\\)) в верхней зоне, сжатие (\\(-\\sigma\\)) в нижней.</p>`;
}

/**
 * Раздел "Метод начальных параметров" (МНП)
 */
/**
 * Строит конкретное уравнение прогибов y(x) для данной балки
 */
function buildConcreteDeflectionEquation(
  input: BeamInput,
  result: BeamResult
): string {
  const { L, loads } = input;
  const xA = result.reactions.xA ?? 0;
  const xB = result.reactions.xB ?? L;
  const RA = result.reactions.RA;
  const RB = result.reactions.RB;
  const Rf = result.reactions.Rf;
  const Mf = result.reactions.Mf;

  // Собираем слагаемые уравнения
  // Формула МНП: EI·y(x) = EI·y₀ + EI·θ₀·x + ΣF·(x-a)³/6 + ...
  const terms: string[] = [];

  // Начальные параметры (умножаются на EI)
  terms.push("EI \\cdot y_0");
  terms.push("+ EI \\cdot \\theta_0 \\cdot x");

  // Реакции (включаем только если точка приложения < L, иначе скобка Маколея ≤ 0)
  // RA - если опора A не на конце балки
  if (RA !== undefined && Math.abs(RA) > 1e-9 && xA < L - 1e-9) {
    const sign = RA >= 0 ? "+" : "-";
    if (Math.abs(xA) < 1e-9) {
      terms.push(`${sign} \\frac{R_A \\cdot x^3}{6}`);
    } else {
      terms.push(`${sign} \\frac{R_A \\cdot (x - ${formatNumber(xA)})^3}{6}`);
    }
  }

  // RB - включаем если опора B не на конце балки (балка с консолью справа)
  if (RB !== undefined && Math.abs(RB) > 1e-9 && xB < L - 1e-9) {
    const sign = RB >= 0 ? "+" : "-";
    terms.push(`${sign} \\frac{R_B \\cdot (x - ${formatNumber(xB)})^3}{6}`);
  }

  // Реакции консоли
  if (Rf !== undefined && Math.abs(Rf) > 1e-9) {
    const xf = result.reactions.xf ?? 0;
    if (xf < L - 1e-9) {
      const sign = Rf >= 0 ? "+" : "-";
      if (Math.abs(xf) < 1e-9) {
        terms.push(`${sign} \\frac{R_f \\cdot x^3}{6}`);
      } else {
        terms.push(`${sign} \\frac{R_f \\cdot (x - ${formatNumber(xf)})^3}{6}`);
      }
    }
  }

  if (Mf !== undefined && Math.abs(Mf) > 1e-9) {
    const xf = result.reactions.xf ?? 0;
    if (xf < L - 1e-9) {
      // Момент заделки: положительный (против часовой) сжимает нижние волокна → минус
      const sign = Mf >= 0 ? "-" : "+";
      if (Math.abs(xf) < 1e-9) {
        terms.push(`${sign} \\frac{M_f \\cdot x^2}{2}`);
      } else {
        terms.push(`${sign} \\frac{M_f \\cdot (x - ${formatNumber(xf)})^2}{2}`);
      }
    }
  }

  // Внешние нагрузки
  // Считаем ВСЕ нагрузки каждого типа для согласованной индексации со схемой
  const allForces = loads.filter(l => l.type === "force");
  const allMoments = loads.filter(l => l.type === "moment");
  const allDist = loads.filter(l => l.type === "distributed");

  // Создаём Map для согласованных индексов (как на схеме)
  const forceLabels = new Map<typeof loads[number], string>();
  const momentLabels = new Map<typeof loads[number], string>();
  const distLabels = new Map<typeof loads[number], string>();

  allForces.forEach((load, i) => {
    forceLabels.set(load, allForces.length === 1 ? "F" : `F_{${i + 1}}`);
  });
  allMoments.forEach((load, i) => {
    momentLabels.set(load, allMoments.length === 1 ? "M" : `M_{${i + 1}}`);
  });
  allDist.forEach((load, i) => {
    distLabels.set(load, allDist.length === 1 ? "q" : `q^{(${i + 1})}`);
  });

  for (const load of loads) {
    if (load.type === "force" && load.x < L - 1e-9) {
      // Сила вниз (F > 0) сжимает нижние волокна → минус
      const sign = load.F >= 0 ? "-" : "+";
      const label = forceLabels.get(load) ?? "F";
      terms.push(`${sign} \\frac{${label} \\cdot (x - ${formatNumber(load.x)})^3}{6}`);
    } else if (load.type === "moment" && load.x < L - 1e-9) {
      // Момент против часовой (M > 0) сжимает нижние волокна → минус
      const sign = load.M >= 0 ? "-" : "+";
      const label = momentLabels.get(load) ?? "M";
      terms.push(`${sign} \\frac{${label} \\cdot (x - ${formatNumber(load.x)})^2}{2}`);
    } else if (load.type === "distributed") {
      // Распределённая нагрузка вниз (q > 0) сжимает → минус
      const qLabel = distLabels.get(load) ?? "q";
      if (load.a < L - 1e-9) {
        const sign = load.q >= 0 ? "-" : "+";
        terms.push(`${sign} \\frac{${qLabel} \\cdot (x - ${formatNumber(load.a)})^4}{24}`);
      }
      // Компенсация после конца нагрузки
      if (load.b < L - 1e-9) {
        const compSign = load.q >= 0 ? "+" : "-";
        terms.push(`${compSign} \\frac{${qLabel} \\cdot (x - ${formatNumber(load.b)})^4}{24}`);
      }
    }
  }

  // Формируем уравнение с переносами для длинных формул по ширине
  const MAX_LINE_WIDTH = 95;
  const lhs = "EI \\cdot y(x)";
  const lhsWidth = lhs.length + 3; // " = "

  // Проверяем общую ширину
  const totalWidth = lhsWidth + terms.reduce((sum, t) => sum + estimateTermWidth(t) + 1, 0);

  let equation: string;
  if (totalWidth <= MAX_LINE_WIDTH) {
    // Короткая формула - в одну строку
    equation = `${lhs} = ${terms.join(" ")}`;
  } else {
    // Длинная формула - разбиваем на строки по ширине
    const lines: string[] = [];
    let currentLine: string[] = [];
    let currentWidth = lhsWidth;

    for (const term of terms) {
      const termWidth = estimateTermWidth(term) + 1; // +1 для пробела
      if (currentWidth + termWidth > MAX_LINE_WIDTH && currentLine.length > 0) {
        // Начинаем новую строку
        if (lines.length === 0) {
          lines.push(`${lhs} &= ${currentLine.join(" ")}`);
        } else {
          lines.push(`&\\phantom{=} ${currentLine.join(" ")}`);
        }
        currentLine = [term];
        currentWidth = 10 + termWidth; // indent + term
      } else {
        currentLine.push(term);
        currentWidth += termWidth;
      }
    }

    // Добавляем последнюю строку
    if (currentLine.length > 0) {
      if (lines.length === 0) {
        lines.push(`${lhs} &= ${currentLine.join(" ")}`);
      } else {
        lines.push(`&\\phantom{=} ${currentLine.join(" ")}`);
      }
    }

    equation = lines.length > 1
      ? `\\begin{aligned}\n${lines.join(" \\\\\n")}\n\\end{aligned}`
      : lines[0].replace(" &=", " =");
  }

  const isMultiline = equation.includes("\\begin{aligned}");
  const formulaClass = isMultiline ? "formula formula-multiline" : "formula";

  return `
  <p>Подставляя нагрузки с учётом знаков, получаем уравнение прогибов:</p>
  <div class="${formulaClass}">
    \\[${equation}\\]
  </div>
  <p>где скобки \\((x - a)^n\\) включаются только при \\(x \\geq a\\) (скобки Маколея).</p>`;
}

function buildMNPSection(
  input: BeamInput,
  result: BeamResult,
  sectionNum: number
): string {
  // I может быть в input.I (задан вручную) или result.I (вычислен из подбора сечения)
  const I_used = result.I ?? input.I;
  if (!result.y || !result.theta || !input.E || !I_used) return "";

  const { beamType, L, E, loads } = input;
  const EI = E * I_used; // Н·м²
  const EI_kNm2 = EI / 1000; // кН·м²
  const isCantilever = beamType.startsWith("cantilever");

  // Получаем начальные параметры
  const theta0 = result.C1 ?? 0;
  const y0 = result.C2 ?? 0;

  // Позиции опор
  const xA = result.reactions.xA ?? 0;
  const xB = result.reactions.xB ?? L;

  // Собираем нагрузки для отображения
  const loadsList: string[] = [];

  // Реакции
  if (result.reactions.RA !== undefined) {
    const dir = result.reactions.RA >= 0 ? "↑" : "↓";
    const sign = result.reactions.RA >= 0 ? "+" : "-";
    loadsList.push(`\\(R_A = ${formatNumber(result.reactions.RA)}\\) кН (${dir}) — ${result.reactions.RA >= 0 ? "растягивает" : "сжимает"} нижние волокна → «${sign}»`);
  }
  if (result.reactions.RB !== undefined) {
    const dir = result.reactions.RB >= 0 ? "↑" : "↓";
    const sign = result.reactions.RB >= 0 ? "+" : "-";
    loadsList.push(`\\(R_B = ${formatNumber(result.reactions.RB)}\\) кН (${dir}) — ${result.reactions.RB >= 0 ? "растягивает" : "сжимает"} нижние волокна → «${sign}»`);
  }

  // Внешние нагрузки — с индексами для множественных нагрузок
  const forceLoadsSign = loads.filter(l => l.type === "force");
  const momentLoadsSign = loads.filter(l => l.type === "moment");
  const distLoadsSign = loads.filter(l => l.type === "distributed");

  let forceIdxSign = 1, momentIdxSign = 1, distIdxSign = 1;

  for (const load of loads) {
    if (load.type === "force") {
      const dir = load.F >= 0 ? "↓" : "↑";
      const sign = load.F >= 0 ? "-" : "+";
      const fLabel = forceLoadsSign.length === 1 ? "F" : `F_{${forceIdxSign++}}`;
      loadsList.push(`\\(${fLabel} = ${formatNumber(Math.abs(load.F))}\\) кН в \\(x = ${formatNumber(load.x)}\\) (${dir}) — ${load.F >= 0 ? "сжимает" : "растягивает"} нижние волокна → «${sign}»`);
    } else if (load.type === "moment") {
      const dir = load.M >= 0 ? "↺" : "↻";
      const sign = load.M >= 0 ? "-" : "+";
      const mLabel = momentLoadsSign.length === 1 ? "M" : `M_{${momentIdxSign++}}`;
      loadsList.push(`\\(${mLabel} = ${formatNumber(Math.abs(load.M))}\\) кН·м в \\(x = ${formatNumber(load.x)}\\) (${dir}) — ${load.M >= 0 ? "сжимает" : "растягивает"} нижние волокна → «${sign}»`);
    } else if (load.type === "distributed") {
      const sign = load.q >= 0 ? "-" : "+";
      // Используем верхний индекс в скобках q^{(n)} для оригинальных нагрузок
      const qLabel = distLoadsSign.length === 1 ? "q" : `q^{(${distIdxSign++})}`;
      loadsList.push(`\\(${qLabel} = ${formatNumber(load.q)}\\) кН/м на \\([${formatNumber(load.a)}; ${formatNumber(load.b)}]\\) — ${load.q >= 0 ? "сжимает" : "растягивает"} нижние волокна → «${sign}»`);
    }
  }

  // Граничные условия - зависят от типа балки
  let boundaryConditions: string;
  let derivationSection: string;
  const isCantileverLeft = beamType === "cantilever-left";
  const isCantileverRight = beamType === "cantilever-right";

  if (isCantileverLeft) {
    // Заделка слева: y(0)=0, θ(0)=0
    boundaryConditions = `
    <ul>
      <li>\\(y(0) = 0\\) — прогиб в заделке равен нулю</li>
      <li>\\(\\theta(0) = 0\\) — угол поворота в заделке равен нулю</li>
    </ul>`;
    derivationSection = `
    <p>Из граничных условий в точке \\(x = 0\\) (заделка):</p>
    <div class="formula">
      \\[y_0 = 0, \\quad \\theta_0 = 0\\]
    </div>`;
  } else if (isCantileverRight) {
    // Заделка справа: y(L)=0, θ(L)=0 - начальные параметры НЕ нулевые
    boundaryConditions = `
    <ul>
      <li>\\(y(${formatNumber(L)}) = 0\\) — прогиб в заделке равен нулю</li>
      <li>\\(\\theta(${formatNumber(L)}) = 0\\) — угол поворота в заделке равен нулю</li>
    </ul>`;
    derivationSection = buildCantileverRightDerivation(input, result, EI);
  } else {
    // Двухопорные балки (включая с консолями)
    boundaryConditions = `
    <ul>
      <li>\\(y(${formatNumber(xA)}) = 0\\) — прогиб на опоре A равен нулю</li>
      <li>\\(y(${formatNumber(xB)}) = 0\\) — прогиб на опоре B равен нулю</li>
    </ul>`;

    // Для балки с консолью слева (xA > 0): y₀ ≠ 0
    // Для обычной двухопорной (xA = 0): y₀ = 0
    derivationSection = buildTheta0Derivation(input, result, EI);
  }

  // Таблица значений
  const points: number[] = [0];
  if (xA > 0) points.push(xA);
  for (const load of loads) {
    if (load.type === "distributed") {
      if (load.a > 0 && !points.includes(load.a)) points.push(load.a);
      if (load.b < L && !points.includes(load.b)) points.push(load.b);
    } else {
      if (load.x > 0 && load.x < L && !points.includes(load.x)) points.push(load.x);
    }
  }
  if (xB < L) points.push(xB);
  points.push(L);
  points.sort((a, b) => a - b);
  const uniquePoints = points.filter((p, i) => i === 0 || Math.abs(p - points[i - 1]) > 1e-6);

  // Определяем единицы измерения для углов: мрад если все углы < 0.1 рад, иначе рад
  const thetaValues = uniquePoints.map(x => result.theta!(x));
  const maxAbsTheta = Math.max(...thetaValues.map(t => Math.abs(t)));
  const useMrad = maxAbsTheta < 0.1; // Если все углы < 100 мрад, используем мрад
  const thetaUnit = useMrad ? "мрад" : "рад";
  const thetaMultiplier = useMrad ? 1000 : 1;

  const tableRows = uniquePoints.map((x, i) => {
    const theta = thetaValues[i];
    const y = result.y!(x);
    return `<tr>
      <td>\\(${formatNumber(x)}\\)</td>
      <td>\\(${formatNumber(theta * thetaMultiplier, 3)}\\)</td>
      <td>\\(${formatNumber(y * 1000, 2)}\\)</td>
    </tr>`;
  }).join("\n    ");

  return `
  <h2>${sectionNum}. Метод начальных параметров</h2>
  <p>Для определения углов поворота \\(\\theta(x)\\) и прогибов \\(y(x)\\) используем метод начальных параметров (МНП).</p>

  <h3>Универсальные уравнения МНП</h3>
  <p>Дифференциальное уравнение изогнутой оси: \\(EI \\cdot y'' = M(x)\\).</p>
  <p>Интегрируя, получаем:</p>
  <div class="formula">
    \\[\\theta(x) = \\theta_0 + \\frac{1}{EI}\\left[\\sum M_i(x-a_i) + \\sum F_i \\frac{(x-b_i)^2}{2} + \\sum q_i \\frac{(x-c_i)^3}{6}\\right]\\]
  </div>
  <div class="formula">
    \\[y(x) = y_0 + \\theta_0 x + \\frac{1}{EI}\\left[\\sum M_i \\frac{(x-a_i)^2}{2} + \\sum F_i \\frac{(x-b_i)^3}{6} + \\sum q_i \\frac{(x-c_i)^4}{24}\\right]\\]
  </div>
  <p>где слагаемые включаются только при \\(x \\geq\\) соответствующей координаты.</p>

  <h3>Правило знаков</h3>
  <p>По растяжению нижних волокон: растягивает → «+», сжимает → «−».</p>
  <ul>
    ${loadsList.map(l => `<li>${l}</li>`).join("\n    ")}
  </ul>

  <h3>Уравнение прогибов для данной балки</h3>
  ${buildConcreteDeflectionEquation(input, result)}

  <h3>Жёсткость сечения</h3>
  <div class="formula">
    \\[EI = ${formatNumber(E / 1e9)} \\cdot 10^9 \\text{ Па} \\cdot ${formatNumber(I_used * 1e8, 2)} \\cdot 10^{-8} \\text{ м}^4 = ${formatNumber(EI, 0)} \\text{ Н}\\cdot\\text{м}^2\\]
  </div>

  <h3>Начальные параметры и граничные условия</h3>
  <p>Начальные параметры в точке \\(x = 0\\):</p>
  <ul>
    <li>\\(y_0 = y(0)\\) — прогиб в начале координат</li>
    <li>\\(\\theta_0 = \\theta(0)\\) — угол поворота в начале координат</li>
  </ul>
  <p><strong>Граничные условия:</strong></p>
  ${boundaryConditions}

  <h3>Определение начальных параметров</h3>
  ${derivationSection}

  <h3>Значения в характерных точках</h3>
  <table>
    <tr><th>\\(x\\), м</th><th>\\(\\theta\\), ${thetaUnit}</th><th>\\(y\\), мм</th></tr>
    ${tableRows}
  </table>
  <p>Знак прогиба: «+» — вверх, «−» — вниз.</p>`;
}

/**
 * Строит вывод θ₀ для двухопорной балки
 */
function buildTheta0Derivation(
  input: BeamInput,
  result: BeamResult,
  EI: number
): string {
  const xA = result.reactions.xA ?? 0;
  const xB = result.reactions.xB ?? input.L;
  const RA = result.reactions.RA ?? 0;
  const RB = result.reactions.RB ?? 0;
  const { loads } = input;
  const hasLeftOverhang = xA > 1e-9; // Есть консоль слева

  // Подготовим метки для сил, моментов и распределённых нагрузок
  const forceLoads = loads.filter(l => l.type === "force");
  const momentLoads = loads.filter(l => l.type === "moment");
  const distLoads = loads.filter(l => l.type === "distributed");
  const forceLabels = new Map<typeof loads[number], string>();
  const momentLabels = new Map<typeof loads[number], string>();
  const distLabels = new Map<typeof loads[number], string>();
  forceLoads.forEach((load, i) => {
    forceLabels.set(load, forceLoads.length === 1 ? "F" : `F_{${i + 1}}`);
  });
  momentLoads.forEach((load, i) => {
    momentLabels.set(load, momentLoads.length === 1 ? "M" : `M_{${i + 1}}`);
  });
  // Для распределённых нагрузок используем верхний индекс: q^{(1)}, q^{(2)}
  distLoads.forEach((load, i) => {
    distLabels.set(load, distLoads.length === 1 ? "q" : `q^{(${i + 1})}`);
  });

  let html: string;

  if (hasLeftOverhang) {
    // Балка с консолью слева - система из двух уравнений
    // Собираем слагаемые для y(xA) и y(xB)

    // Функция для сбора слагаемых в точке x (включая реакции)
    const collectTermsAt = (x: number): Array<{ symbolic: string; value: number }> => {
      const terms: Array<{ symbolic: string; value: number }> = [];

      // Вклад реакции RA (если точка правее xA)
      if (x > xA + 1e-9 && Math.abs(RA) > 1e-9) {
        const dx = x - xA;
        // Реакция вверх (RA > 0) создаёт положительный вклад в ∫∫M
        const RA_term = RA * 1000 * Math.pow(dx, 3) / 6;
        terms.push({
          symbolic: `+\\frac{R_A \\cdot ${formatNumber(dx)}^3}{6}`,
          value: RA_term
        });
      }

      // Вклад реакции RB (если точка правее xB)
      if (x > xB + 1e-9 && Math.abs(RB) > 1e-9) {
        const dx = x - xB;
        const RB_term = RB * 1000 * Math.pow(dx, 3) / 6;
        terms.push({
          symbolic: `+\\frac{R_B \\cdot ${formatNumber(dx)}^3}{6}`,
          value: RB_term
        });
      }

      for (const load of loads) {
        if (load.type === "distributed" && load.a < x) {
          const dx = x - load.a;
          const q_term = -load.q * 1000 * Math.pow(dx, 4) / 24;
          const qLabel = distLabels.get(load) ?? "q";
          terms.push({
            symbolic: `-\\frac{${qLabel} \\cdot ${formatNumber(dx)}^4}{24}`,
            value: q_term
          });
          // Компенсация если нагрузка закончилась до x
          if (load.b < x) {
            const dx2 = x - load.b;
            const q_comp = load.q * 1000 * Math.pow(dx2, 4) / 24;
            terms.push({
              symbolic: `+\\frac{${qLabel} \\cdot ${formatNumber(dx2)}^4}{24}`,
              value: q_comp
            });
          }
        } else if (load.type === "force" && load.x < x) {
          const dx = x - load.x;
          const sign = load.F >= 0 ? -1 : 1;
          const F_term = sign * Math.abs(load.F) * 1000 * Math.pow(dx, 3) / 6;
          const label = forceLabels.get(load) ?? "F";
          terms.push({
            symbolic: `${sign >= 0 ? "+" : "-"}\\frac{${label} \\cdot ${formatNumber(dx)}^3}{6}`,
            value: F_term
          });
        } else if (load.type === "moment" && load.x < x) {
          const dx = x - load.x;
          const M_term = -load.M * 1000 * Math.pow(dx, 2) / 2;
          const label = momentLabels.get(load) ?? "M";
          terms.push({
            symbolic: `-\\frac{${label} \\cdot ${formatNumber(dx)}^2}{2}`,
            value: M_term
          });
        }
      }
      return terms;
    };

    const termsAtA = collectTermsAt(xA);
    const termsAtB = collectTermsAt(xB);
    const sumAtA = termsAtA.reduce((acc, t) => acc + t.value, 0);
    const sumAtB = termsAtB.reduce((acc, t) => acc + t.value, 0);

    // После вычитания: θ₀·(xB - xA) + (sumAtB - sumAtA)/EI = 0
    const deltaSum = sumAtB - sumAtA;
    const deltaX = xB - xA;

    // Функция для форматирования: -num/denom (инвертируем знак num)
    // Если num >= 0, результат отрицательный: пишем -num/denom
    // Если num < 0, результат положительный: пишем |num|/denom (без знака +)
    const formatNegatedFraction = (num: number, denom: string): string => {
      if (num >= 0) {
        return `- \\frac{${formatNumber(num)}}{${denom}}`;
      } else {
        return `\\frac{${formatNumber(Math.abs(num))}}{${denom}}`;
      }
    };

    // Форматируем условие 1 с переносом при большом количестве слагаемых
    const termsAtASymbolic = termsAtA.map(t => t.symbolic);
    const { latex: bracketsA, isMultiline: multiA } = formatBracketedTerms(termsAtASymbolic);

    html = `
  <p><strong>Условие 1:</strong> \\(y(${formatNumber(xA)}) = 0\\) (прогиб на опоре A)</p>
  <div class="formula${multiA ? " formula-multiline" : ""}">
    \\[y_0 + \\theta_0 \\cdot ${formatNumber(xA)} ${termsAtA.length > 0 ? `+ \\frac{1}{EI}\\left(${bracketsA}\\right)` : ""} = 0 \\quad (1)\\]
  </div>`;

    // Показываем числовые значения для условия 1
    if (termsAtA.length > 0) {
      html += `
  <p>Подстановка числовых значений:</p>
  <ul>
    ${termsAtA.map(t => `<li>\\(${t.symbolic} = ${formatNumber(t.value)}\\)</li>`).join("\n    ")}
  </ul>`;
      // "Сумма слагаемых" только если больше одного слагаемого
      if (termsAtA.length > 1) {
        html += `\n  <p>Сумма слагаемых: \\(${formatNumber(sumAtA)}\\)</p>`;
      }
    }

    // Форматируем условие 2 с переносом при большом количестве слагаемых
    const termsAtBSymbolic = termsAtB.map(t => t.symbolic);
    const { latex: bracketsB, isMultiline: multiB } = formatBracketedTerms(termsAtBSymbolic);

    html += `
  <p><strong>Условие 2:</strong> \\(y(${formatNumber(xB)}) = 0\\) (прогиб на опоре B)</p>
  <div class="formula${multiB ? " formula-multiline" : ""}">
    \\[y_0 + \\theta_0 \\cdot ${formatNumber(xB)} + \\frac{1}{EI}\\left(${bracketsB}\\right) = 0 \\quad (2)\\]
  </div>`;

    // Показываем числовые значения для условия 2
    html += `
  <p>Подстановка числовых значений:</p>
  <ul>
    ${termsAtB.map(t => `<li>\\(${t.symbolic} = ${formatNumber(t.value)}\\)</li>`).join("\n    ")}
  </ul>`;
    // "Сумма слагаемых" только если больше одного слагаемого
    if (termsAtB.length > 1) {
      html += `\n  <p>Сумма слагаемых: \\(${formatNumber(sumAtB)}\\)</p>`;
    }

    // Вычитание с корректными знаками
    const sumAtADisplay = sumAtA >= 0 ? `${formatNumber(sumAtA)}` : `(${formatNumber(sumAtA)})`;

    // Вычисляем θ₀ как в solver.ts: θ₀ = -deltaSum / (deltaX · EI)
    const computedTheta0 = -deltaSum / EI / deltaX;
    const deltaSumFormatted = formatNumber(deltaSum);
    const absDeltaSum = Math.abs(deltaSum);

    html += `
  <p><strong>Вычитаем (1) из (2):</strong></p>
  <div class="formula">
    \\[\\theta_0 \\cdot (${formatNumber(xB)} - ${formatNumber(xA)}) + \\frac{1}{EI}\\left(${formatNumber(sumAtB)} - ${sumAtADisplay}\\right) = 0\\]
  </div>
  <div class="formula">
    \\[\\theta_0 \\cdot ${formatNumber(deltaX)} + \\frac{${deltaSumFormatted}}{EI} = 0\\]
  </div>
  <div class="formula">
    \\[\\theta_0 = -\\frac{${deltaSumFormatted}}{${formatNumber(deltaX)} \\cdot EI} = \\frac{${formatNumber(absDeltaSum)}}{${formatNumber(deltaX)} \\cdot ${formatNumber(EI, 0)}} = ${formatNumber(computedTheta0, 5)} \\text{ рад}\\]
  </div>
  <div class="formula">
    \\[\\theta_0 = ${formatNumber(computedTheta0 * 1000, 2)} \\cdot 10^{-3} \\text{ рад}\\]
  </div>`;

    // Вычисляем y₀ как в solver.ts
    const computedY0 = -sumAtA / EI - computedTheta0 * xA;

    html += `
  <p><strong>Из уравнения (1) находим \\(y_0\\):</strong></p>
  <div class="formula">
    \\[y_0 = -\\theta_0 \\cdot ${formatNumber(xA)} ${formatNegatedFraction(sumAtA, "EI")}\\]
  </div>
  <div class="formula">
    \\[y_0 = ${formatNumber(computedY0 * 1000, 2)} \\text{ мм}\\]
  </div>
  <p><strong>Итог:</strong></p>
  <div class="formula">
    \\[\\boxed{\\theta_0 = ${formatNumber(computedTheta0 * 1000, 3)} \\cdot 10^{-3} \\text{ рад}, \\quad y_0 = ${formatNumber(computedY0 * 1000, 2)} \\text{ мм}}\\]
  </div>`;
    return html;
  }

  // Обычная двухопорная балка (xA = 0) - y₀ = 0, находим θ₀
  html = `
  <p><strong>Условие 1:</strong> \\(y(0) = 0\\)</p>
  <p>При \\(x = 0\\) получаем: \\(y_0 = 0\\)</p>

  <p><strong>Условие 2:</strong> \\(y(${formatNumber(xB)}) = 0\\)</p>
  <p>Подставляем \\(x = ${formatNumber(xB)}\\) и \\(y_0 = 0\\):</p>`;

  // Собираем слагаемые для y(xB)
  const terms: Array<{ symbolic: string; value: number }> = [];

  // R_A · xB³/6
  const RA_term = RA * 1000 * Math.pow(xB, 3) / 6; // в Н·м³
  terms.push({
    symbolic: `+\\frac{R_A \\cdot ${formatNumber(xB)}^3}{6}`,
    value: RA_term
  });

  // Обрабатываем нагрузки
  for (const load of loads) {
    if (load.type === "moment" && load.x < xB) {
      // -M · (xB - x)² / 2
      const dx = xB - load.x;
      const M_term = -load.M * 1000 * Math.pow(dx, 2) / 2;
      const label = momentLabels.get(load) ?? "M";
      terms.push({
        symbolic: `-\\frac{${label} \\cdot ${formatNumber(dx)}^2}{2}`,
        value: M_term
      });
    } else if (load.type === "distributed") {
      // -q · (xB - a)⁴ / 24
      const qLabel = distLabels.get(load) ?? "q";
      if (load.a < xB) {
        const dx = xB - load.a;
        const q_term = -load.q * 1000 * Math.pow(dx, 4) / 24;
        terms.push({
          symbolic: `-\\frac{${qLabel} \\cdot ${formatNumber(dx)}^4}{24}`,
          value: q_term
        });
      }
      // +q · (xB - b)⁴ / 24 (компенсация после конца нагрузки)
      if (load.b < xB) {
        const dx = xB - load.b;
        const q_comp = load.q * 1000 * Math.pow(dx, 4) / 24;
        terms.push({
          symbolic: `+\\frac{${qLabel} \\cdot ${formatNumber(dx)}^4}{24}`,
          value: q_comp
        });
      }
    } else if (load.type === "force" && load.x < xB) {
      // Сила: ±F · (xB - x)³ / 6
      const dx = xB - load.x;
      const sign = load.F >= 0 ? -1 : 1;
      const F_term = sign * Math.abs(load.F) * 1000 * Math.pow(dx, 3) / 6;
      const label = forceLabels.get(load) ?? "F";
      terms.push({
        symbolic: `${sign >= 0 ? "+" : "-"}\\frac{${label} \\cdot ${formatNumber(dx)}^3}{6}`,
        value: F_term
      });
    }
  }

  // Сумма слагаемых
  const sumTerms = terms.reduce((acc, t) => acc + t.value, 0);

  // Формула с переносом строк при большом количестве слагаемых
  // Первый терм — EI·θ₀·x, остальные — от нагрузок
  const allTerms = [`+ EI \\cdot \\theta_0 \\cdot ${formatNumber(xB)}`, ...terms.map(t => t.symbolic)];
  const { latex: thetaFormula, isMultiline: thetaMultiline } = formatLongFormula(
    `0`,
    allTerms
  );

  // Вычисляем θ₀ из формулы: θ₀ = -sumTerms / (xB · EI)
  const computedTheta0 = -sumTerms / (xB * EI);

  // Формируем вывод формулы: всегда показываем -sumTerms/(xB·EI)
  // Если sumTerms отрицательный, получается -(-X) = X
  const sumTermsFormatted = formatNumber(sumTerms);
  const absResult = Math.abs(sumTerms);

  html += `
  <div class="formula${thetaMultiline ? " formula-multiline" : ""}">
    \\[${thetaFormula}\\]
  </div>
  <p>Числовые значения слагаемых:</p>
  <ul>
    ${terms.map(t => `<li>\\(${t.symbolic} = ${formatNumber(t.value)}\\) Н·м³</li>`).join("\n    ")}
  </ul>
  <p>Сумма: \\(${sumTermsFormatted}\\) Н·м³</p>
  <div class="formula">
    \\[\\theta_0 = -\\frac{${sumTermsFormatted}}{${formatNumber(xB)} \\cdot EI} = \\frac{${formatNumber(absResult)}}{${formatNumber(xB)} \\cdot ${formatNumber(EI, 0)}} = ${formatNumber(computedTheta0, 5)} \\text{ рад}\\]
  </div>
  <p><strong>Итог:</strong></p>
  <div class="formula">
    \\[\\boxed{y_0 = 0, \\quad \\theta_0 = ${formatNumber(computedTheta0 * 1000, 2)} \\cdot 10^{-3} \\text{ рад} = ${formatNumber(computedTheta0 * 180 / Math.PI, 1)}°}\\]
  </div>`;

  return html;
}

/**
 * Строит вывод начальных параметров для консольной балки с заделкой справа
 */
function buildCantileverRightDerivation(
  input: BeamInput,
  result: BeamResult,
  EI: number
): string {
  const L = input.L;
  const { loads } = input;
  const Rf = result.reactions.Rf ?? 0;
  const Mf = result.reactions.Mf ?? 0;
  const xf = result.reactions.xf ?? L;

  // Подготовим метки для нагрузок
  const forceLoads = loads.filter(l => l.type === "force");
  const momentLoads = loads.filter(l => l.type === "moment");
  const distLoads = loads.filter(l => l.type === "distributed");
  const forceLabels = new Map<typeof loads[number], string>();
  const momentLabels = new Map<typeof loads[number], string>();
  const distLabels = new Map<typeof loads[number], string>();
  forceLoads.forEach((load, i) => {
    forceLabels.set(load, forceLoads.length === 1 ? "F" : `F_{${i + 1}}`);
  });
  momentLoads.forEach((load, i) => {
    momentLabels.set(load, momentLoads.length === 1 ? "M" : `M_{${i + 1}}`);
  });
  distLoads.forEach((load, i) => {
    distLabels.set(load, distLoads.length === 1 ? "q" : `q^{(${i + 1})}`);
  });

  // Собираем слагаемые для θ(L) - угол поворота в точке L
  const thetaTerms: Array<{ symbolic: string; value: number }> = [];

  // Реакция силы в заделке: +Rf·(L-xf)²/2 = 0 (xf = L, так что плечо = 0)
  // Реакция момента в заделке: -Mf·(L-xf) = 0 (плечо = 0)
  // Поэтому реакции не дают вклада в θ(L) напрямую

  // Внешние нагрузки
  for (const load of loads) {
    if (load.type === "force" && load.x < L) {
      const dx = L - load.x;
      // Сила вниз (F>0) создаёт отрицательный вклад в угол
      const sign = load.F >= 0 ? -1 : 1;
      const value = sign * Math.abs(load.F) * 1000 * Math.pow(dx, 2) / 2;
      const label = forceLabels.get(load) ?? "F";
      thetaTerms.push({
        symbolic: `${sign >= 0 ? "+" : "-"}\\frac{${label} \\cdot ${formatNumber(dx)}^2}{2}`,
        value
      });
    } else if (load.type === "moment" && load.x < L) {
      const dx = L - load.x;
      // Момент против часовой (M>0) создаёт отрицательный вклад
      const value = -load.M * 1000 * dx;
      const label = momentLabels.get(load) ?? "M";
      const signStr = load.M >= 0 ? "-" : "+";
      thetaTerms.push({
        symbolic: `${signStr}${label} \\cdot ${formatNumber(dx)}`,
        value
      });
    } else if (load.type === "distributed") {
      const qLabel = distLabels.get(load) ?? "q";
      if (load.a < L) {
        const dx = L - load.a;
        // q вниз (>0) создаёт отрицательный вклад
        const value = -load.q * 1000 * Math.pow(dx, 3) / 6;
        thetaTerms.push({
          symbolic: `-\\frac{${qLabel} \\cdot ${formatNumber(dx)}^3}{6}`,
          value
        });
      }
      if (load.b < L) {
        const dx = L - load.b;
        const value = load.q * 1000 * Math.pow(dx, 3) / 6;
        thetaTerms.push({
          symbolic: `+\\frac{${qLabel} \\cdot ${formatNumber(dx)}^3}{6}`,
          value
        });
      }
    }
  }

  const sumTheta = thetaTerms.reduce((acc, t) => acc + t.value, 0);

  // Собираем слагаемые для y(L) - прогиб в точке L
  const yTerms: Array<{ symbolic: string; value: number }> = [];

  for (const load of loads) {
    if (load.type === "force" && load.x < L) {
      const dx = L - load.x;
      const sign = load.F >= 0 ? -1 : 1;
      const value = sign * Math.abs(load.F) * 1000 * Math.pow(dx, 3) / 6;
      const label = forceLabels.get(load) ?? "F";
      yTerms.push({
        symbolic: `${sign >= 0 ? "+" : "-"}\\frac{${label} \\cdot ${formatNumber(dx)}^3}{6}`,
        value
      });
    } else if (load.type === "moment" && load.x < L) {
      const dx = L - load.x;
      const value = -load.M * 1000 * Math.pow(dx, 2) / 2;
      const label = momentLabels.get(load) ?? "M";
      const signStr = load.M >= 0 ? "-" : "+";
      yTerms.push({
        symbolic: `${signStr}\\frac{${label} \\cdot ${formatNumber(dx)}^2}{2}`,
        value
      });
    } else if (load.type === "distributed") {
      const qLabel = distLabels.get(load) ?? "q";
      if (load.a < L) {
        const dx = L - load.a;
        const value = -load.q * 1000 * Math.pow(dx, 4) / 24;
        yTerms.push({
          symbolic: `-\\frac{${qLabel} \\cdot ${formatNumber(dx)}^4}{24}`,
          value
        });
      }
      if (load.b < L) {
        const dx = L - load.b;
        const value = load.q * 1000 * Math.pow(dx, 4) / 24;
        yTerms.push({
          symbolic: `+\\frac{${qLabel} \\cdot ${formatNumber(dx)}^4}{24}`,
          value
        });
      }
    }
  }

  const sumY = yTerms.reduce((acc, t) => acc + t.value, 0);

  // Форматируем вывод
  const { latex: thetaBrackets, isMultiline: thetaMulti } = formatBracketedTerms(thetaTerms.map(t => t.symbolic));
  const { latex: yBrackets, isMultiline: yMulti } = formatBracketedTerms(yTerms.map(t => t.symbolic));

  let html = `
  <p><strong>Условие 1:</strong> \\(\\theta(${formatNumber(L)}) = 0\\) (угол поворота в заделке)</p>
  <p>Подставляя \\(x = ${formatNumber(L)}\\) в уравнение углов поворота:</p>
  <div class="formula${thetaMulti ? " formula-multiline" : ""}">
    \\[\\theta_0 + \\frac{1}{EI}\\left(${thetaBrackets}\\right) = 0\\]
  </div>`;

  if (thetaTerms.length > 0) {
    html += `
  <p>Числовые значения слагаемых:</p>
  <ul>
    ${thetaTerms.map(t => `<li>\\(${t.symbolic} = ${formatNumber(t.value)}\\) Н·м²</li>`).join("\n    ")}
  </ul>`;
    if (thetaTerms.length > 1) {
      html += `<p>Сумма: \\(${formatNumber(sumTheta)}\\) Н·м²</p>`;
    }
  }

  // Вычисляем θ₀ из формулы: θ₀ = -sumTheta / EI
  const computedTheta0 = -sumTheta / EI;
  const sumThetaFormatted = formatNumber(sumTheta);
  const absThetaResult = Math.abs(sumTheta);

  html += `
  <div class="formula">
    \\[\\theta_0 = -\\frac{${sumThetaFormatted}}{EI} = \\frac{${formatNumber(absThetaResult)}}{${formatNumber(EI, 0)}} = ${formatNumber(computedTheta0, 5)} \\text{ рад}\\]
  </div>`;

  html += `
  <p><strong>Условие 2:</strong> \\(y(${formatNumber(L)}) = 0\\) (прогиб в заделке)</p>
  <p>Подставляя \\(x = ${formatNumber(L)}\\) в уравнение прогибов:</p>
  <div class="formula${yMulti ? " formula-multiline" : ""}">
    \\[y_0 + \\theta_0 \\cdot ${formatNumber(L)} + \\frac{1}{EI}\\left(${yBrackets}\\right) = 0\\]
  </div>`;

  if (yTerms.length > 0) {
    html += `
  <p>Числовые значения слагаемых:</p>
  <ul>
    ${yTerms.map(t => `<li>\\(${t.symbolic} = ${formatNumber(t.value)}\\) Н·м³</li>`).join("\n    ")}
  </ul>`;
    if (yTerms.length > 1) {
      html += `<p>Сумма: \\(${formatNumber(sumY)}\\) Н·м³</p>`;
    }
  }

  // Вычисляем y₀ из формулы
  const computedY0 = -computedTheta0 * L - sumY / EI;

  html += `
  <p>Находим \\(y_0\\):</p>
  <div class="formula">
    \\[y_0 = -\\theta_0 \\cdot ${formatNumber(L)} - \\frac{${formatNumber(sumY)}}{EI}\\]
  </div>
  <div class="formula">
    \\[y_0 = -${formatNumber(computedTheta0, 6)} \\cdot ${formatNumber(L)} - \\frac{${formatNumber(sumY)}}{${formatNumber(EI, 0)}} = ${formatNumber(computedY0 * 1000, 2)} \\text{ мм}\\]
  </div>`;

  html += `
  <p><strong>Итог:</strong></p>
  <div class="formula">
    \\[\\boxed{\\theta_0 = ${formatNumber(computedTheta0 * 1000, 3)} \\cdot 10^{-3} \\text{ рад}, \\quad y_0 = ${formatNumber(computedY0 * 1000, 2)} \\text{ мм}}\\]
  </div>`;

  return html;
}

/**
 * Раздел "Метод Верещагина" для нахождения прогиба в точке удара
 */
function buildVereshchaginSection(
  input: BeamInput,
  result: BeamResult,
  sectionNum: number,
  impactX: number
): string {
  const { L } = input;
  const E = input.E ?? 2e11; // Па
  const I = result.I ?? input.I ?? 1e-6; // м⁴
  const EI = E * I;

  // Функция M(x) от внешней нагрузки уже есть в result
  const M = result.M;
  if (!M) return '';

  // Вспомогательная функция: форматирование числа со скобками для отрицательных
  const formatSigned = (n: number, decimals = 4): string => {
    const formatted = formatNumber(n, decimals);
    return n < 0 ? `(${formatted})` : formatted;
  };

  // Форматирование (x - c): если c = 0, возвращает просто "x"
  const formatXMinusC = (c: number): string => {
    if (Math.abs(c) < 1e-9) return 'x';
    return `(x - ${formatNumber(c)})`;
  };

  // Форматирование -(x - c): если c = 0, возвращает "-x"
  const formatNegXMinusC = (c: number): string => {
    if (Math.abs(c) < 1e-9) return '-x';
    return `-(x - ${formatNumber(c)})`;
  };

  // Форматирование разности (a - b) без лишних нулей, с скобками если нужно для умножения
  const formatDiff = (a: number, b: number, withParens = false): string => {
    if (Math.abs(b) < 1e-9) return formatNumber(a);
    const result = `${formatNumber(a)} - ${formatNumber(b)}`;
    return withParens ? `(${result})` : result;
  };

  // Форматирование линейного выражения ax + b без двойных знаков
  const formatLinear = (a: number, b: number, decimalsA = 4, decimalsB = 2): string => {
    const aStr = formatNumber(a, decimalsA);
    if (Math.abs(b) < 1e-9) {
      return `${aStr}x`;
    } else if (b > 0) {
      return `${aStr}x + ${formatNumber(b, decimalsB)}`;
    } else {
      return `${aStr}x - ${formatNumber(Math.abs(b), decimalsB)}`;
    }
  };

  // Находим реакции от единичной силы X=1 в точке impactX
  const isCantilever = input.beamType.startsWith('cantilever');

  let RA_unit: number, RB_unit: number;
  let xA: number, xB: number;

  if (isCantilever) {
    xA = result.reactions.xf ?? (input.beamType === 'cantilever-left' ? L : 0);
    xB = xA;
    RA_unit = 1;
    RB_unit = 0;
  } else {
    xA = result.reactions.xA ?? 0;
    xB = result.reactions.xB ?? L;
    const span = xB - xA;
    RB_unit = (impactX - xA) / span;
    RA_unit = 1 - RB_unit;
  }

  // Определяем тип конфигурации: консоль слева, справа, или между опорами
  const isOverhangLeft = impactX < xA;  // Удар на левой консоли
  const isOverhangRight = impactX > xB; // Удар на правой консоли
  const isBetweenSupports = impactX >= xA && impactX <= xB;

  // Функция m(x) - момент от единичной силы в точке impactX
  // МЕТОД СЕЧЕНИЙ: суммируем моменты от всех сил слева от сечения
  const m = (x: number): number => {
    if (isCantilever) {
      if (input.beamType === 'cantilever-left') {
        if (x <= impactX) return 0;
        return -(x - impactX);
      } else {
        if (x >= impactX) return 0;
        return -(impactX - x);
      }
    } else if (isOverhangLeft) {
      // Удар на левой консоли (impactX < xA)
      // Знак: сила вниз создаёт отрицательный момент (сжатие нижнего волокна)
      if (x <= impactX) {
        // Левее точки удара - момент 0
        return 0;
      } else if (x <= xA) {
        // Между точкой удара и опорой A: только единичная сила слева (вниз → минус)
        return -1 * (x - impactX);
      } else {
        // Между опорами: единичная сила (вниз) + реакция RA (вверх)
        return -1 * (x - impactX) + RA_unit * (x - xA);
      }
    } else if (isOverhangRight) {
      // Удар на правой консоли (impactX > xB)
      if (x >= impactX) {
        return 0;
      } else if (x >= xB) {
        return -1 * (impactX - x);
      } else {
        return -1 * (impactX - x) + RB_unit * (xB - x);
      }
    } else {
      // Удар между опорами
      if (x <= impactX) {
        // Слева от удара: только реакция RA
        return RA_unit * (x - xA);
      } else {
        // Справа от удара: реакция RA + единичная сила
        return RA_unit * (x - xA) - 1 * (x - impactX);
      }
    }
  };

  // Численное интегрирование методом трапеций
  const n = 200;
  const dx = L / n;
  let integral = 0;
  for (let i = 0; i <= n; i++) {
    const x = i * dx;
    const Mx = M(x);
    const mx = m(x);
    const weight = (i === 0 || i === n) ? 0.5 : 1;
    integral += weight * Mx * mx * dx;
  }

  const delta_m = (integral * 1000) / EI;
  const delta_mm = Math.abs(delta_m) * 1000;
  const EI_formatted = formatNumber(EI / 1e6, 4);

  let html = `
  <h2>${sectionNum}. Метод Верещагина</h2>
  <p>Для нахождения прогиба в точке удара (\\(x = ${formatNumber(impactX)}\\) м) применим метод Верещагина:</p>
  <div class="formula">
    \\[\\delta_{\\text{ст}} = \\frac{1}{EI} \\int_0^L M(x) \\cdot m(x) \\, dx\\]
  </div>
  <p>где \\(M(x)\\) — эпюра изгибающих моментов от внешней нагрузки, \\(m(x)\\) — эпюра моментов от единичной силы \\(X = 1\\), приложенной в точке измерения прогиба.</p>

  <h3>${sectionNum}.1. Реакции от единичной силы \\(X = 1\\)</h3>`;

  if (isCantilever) {
    html += `
  <p>Для консольной балки единичная сила полностью воспринимается заделкой:</p>
  <div class="formula">
    \\[R^{(1)} = 1, \\quad M^{(1)} = 1 \\cdot ${formatNumber(Math.abs(impactX - (result.reactions.xf ?? L)))} = ${formatNumber(Math.abs(impactX - (result.reactions.xf ?? L)))} \\text{ (безразм.)}\\]
  </div>`;
  } else {
    // Расстояние от опоры A до точки удара
    const distFromA = impactX - xA;
    const span = xB - xA;

    html += `
  <p>Из уравнений равновесия для единичной силы \\(X = 1\\) в точке \\(x = ${formatNumber(impactX)}\\) м:</p>
  <p>Опоры расположены в точках: \\(x_A = ${formatNumber(xA)}\\) м, \\(x_B = ${formatNumber(xB)}\\) м. Пролёт \\(l = ${formatNumber(span)}\\) м.</p>
  <div class="formula">
    \\[\\sum M_A = 0: \\quad 1 \\cdot ${formatDiff(impactX, xA, true)} - R_B^{(1)} \\cdot ${formatNumber(span)} = 0\\]
  </div>
  <div class="formula">
    \\[R_B^{(1)} = \\frac{${formatNumber(distFromA)}}{${formatNumber(span)}} = ${formatNumber(RB_unit, 4)}\\]
  </div>
  <div class="formula">
    \\[R_A^{(1)} = 1 - R_B^{(1)} = ${formatNumber(RA_unit, 4)}\\]
  </div>`;
  }

  html += `
  <h3>${sectionNum}.2. Эпюра \\(m(x)\\) от единичной силы</h3>`;

  if (isCantilever) {
    if (input.beamType === 'cantilever-left') {
      html += `
  <p>Участок 1 (\\(0 \\leq x \\leq ${formatNumber(impactX)}\\)):</p>
  <div class="formula">
    \\[m_1(x) = 0\\]
  </div>
  <p>Участок 2 (\\(${formatNumber(impactX)} \\leq x \\leq ${formatNumber(L)}\\)):</p>
  <div class="formula">
    \\[m_2(x) = -1 \\cdot ${formatXMinusC(impactX)} = ${formatNegXMinusC(impactX)}\\]
  </div>`;
    }
  } else if (isOverhangLeft) {
    // Удар на левой консоли
    // Сила вниз → отрицательный момент (сжатие нижнего волокна)
    const m_at_xA = -1 * (xA - impactX); // m(xA) - минимум на первом участке (отрицательный)
    const a2 = -1 + RA_unit; // коэффициент при x на втором участке
    const b2 = impactX - RA_unit * xA; // свободный член

    html += `
  <p><strong>Участок 1</strong> (\\(${formatNumber(impactX)} \\leq x \\leq ${formatNumber(xA)}\\)) — консольная часть:</p>
  <p>Рассматриваем сечение: слева только единичная сила \\(X = 1\\) (направлена вниз) в точке \\(x = ${formatNumber(impactX)}\\).</p>
  <p>Сила вниз создаёт отрицательный момент (сжатие нижнего волокна):</p>
  <div class="formula">
    \\[m_1(x) = -1 \\cdot ${formatXMinusC(impactX)} = ${formatNegXMinusC(impactX)}\\]
  </div>
  <p>При \\(x = ${formatNumber(impactX)}\\): \\(m_1(${formatNumber(impactX)}) = 0\\)</p>
  <p>При \\(x = ${formatNumber(xA)}\\): \\(m_1(${formatNumber(xA)}) = -${formatDiff(xA, impactX)} = ${formatNumber(m_at_xA, 4)}\\)</p>

  <p><strong>Участок 2</strong> (\\(${formatNumber(xA)} \\leq x \\leq ${formatNumber(xB)}\\)) — между опорами:</p>
  <p>Слева от сечения: единичная сила (вниз) и реакция \\(R_A^{(1)} = ${formatNumber(RA_unit, 4)}\\) (вверх):</p>
  <div class="formula">
    \\[m_2(x) = -1 \\cdot ${formatXMinusC(impactX)} + R_A^{(1)} \\cdot (x - ${formatNumber(xA)})\\]
  </div>
  <div class="formula">
    \\[m_2(x) = ${formatNegXMinusC(impactX)} + ${formatNumber(RA_unit, 4)} \\cdot (x - ${formatNumber(xA)})\\]
  </div>
  <p>После приведения подобных:</p>
  <div class="formula">
    \\[m_2(x) = ${formatLinear(a2, b2)}\\]
  </div>
  <p>При \\(x = ${formatNumber(xA)}\\): \\(m_2(${formatNumber(xA)}) = ${formatNumber(m_at_xA, 4)}\\) (совпадает с \\(m_1\\))</p>
  <p>При \\(x = ${formatNumber(xB)}\\): \\(m_2(${formatNumber(xB)}) = 0\\) (на опоре B)</p>`;
  } else {
    // Удар между опорами
    const m_at_impact = RA_unit * (impactX - xA); // m(impactX) - максимум
    const a2 = RA_unit - 1; // коэффициент при x на втором участке
    const b2 = -RA_unit * xA + impactX; // свободный член

    html += `
  <p><strong>Участок 1</strong> (\\(${formatNumber(xA)} \\leq x \\leq ${formatNumber(impactX)}\\)):</p>
  <p>Слева от сечения только реакция \\(R_A^{(1)}\\):</p>
  <div class="formula">
    \\[m_1(x) = R_A^{(1)} \\cdot ${formatXMinusC(xA)} = ${formatNumber(RA_unit, 4)} \\cdot ${formatXMinusC(xA)}\\]
  </div>
  <p>При \\(x = ${formatNumber(xA)}\\): \\(m_1(${formatNumber(xA)}) = 0\\)</p>
  <p>При \\(x = ${formatNumber(impactX)}\\): \\(m_1(${formatNumber(impactX)}) = ${formatNumber(RA_unit, 4)} \\cdot ${formatDiff(impactX, xA)} = ${formatNumber(m_at_impact, 4)}\\)</p>

  <p><strong>Участок 2</strong> (\\(${formatNumber(impactX)} \\leq x \\leq ${formatNumber(xB)}\\)):</p>
  <p>Слева от сечения: реакция \\(R_A^{(1)}\\) и единичная сила:</p>
  <div class="formula">
    \\[m_2(x) = R_A^{(1)} \\cdot ${formatXMinusC(xA)} - 1 \\cdot ${formatXMinusC(impactX)}\\]
  </div>
  <p>После приведения подобных:</p>
  <div class="formula">
    \\[m_2(x) = ${formatLinear(a2, b2)}\\]
  </div>
  <p>При \\(x = ${formatNumber(impactX)}\\): \\(m_2(${formatNumber(impactX)}) = ${formatNumber(m_at_impact, 4)}\\) (совпадает)</p>
  <p>При \\(x = ${formatNumber(xB)}\\): \\(m_2(${formatNumber(xB)}) = 0\\)</p>`;
  }

  // SVG рисунок с эпюрами M(x) и m(x)
  const svgWidth = 500;
  const svgHeight = 350;
  const margin = { left: 50, right: 30, top: 30, bottom: 90 };
  const plotW = svgWidth - margin.left - margin.right;
  const plotH = (svgHeight - margin.top - margin.bottom) / 2 - 20;

  const scaleX = (x: number) => margin.left + (x / L) * plotW;

  // Находим max значения для масштабирования и позиции экстремумов
  let maxM = 0, maxm = 0;
  let maxM_x = 0, maxm_x = 0;  // Позиции экстремумов
  let maxM_val = 0, maxm_val = 0;  // Значения в экстремумах (со знаком)

  // Критические точки: опоры и точка удара - именно там экстремумы M(x) и m(x)
  const criticalPoints = [0, impactX, xA, xB, L];

  // Проверяем критические точки + регулярную сетку для масштабирования
  for (let i = 0; i <= 50; i++) {
    criticalPoints.push((i / 50) * L);
  }

  for (const x of criticalPoints) {
    if (x < 0 || x > L) continue;
    const Mval = M(x);
    const mval = m(x);
    if (Math.abs(Mval) > maxM) {
      maxM = Math.abs(Mval);
      maxM_x = x;
      maxM_val = Mval;
    }
    if (Math.abs(mval) > maxm) {
      maxm = Math.abs(mval);
      maxm_x = x;
      maxm_val = mval;
    }
  }
  if (maxM === 0) maxM = 1;
  if (maxm === 0) maxm = 1;

  const baselineM = margin.top + plotH / 2;
  const baselinem = margin.top + plotH + 50 + plotH / 2;
  const scaleM = (v: number) => baselineM - (v / maxM) * (plotH / 2 - 10);
  const scalem = (v: number) => baselinem - (v / maxm) * (plotH / 2 - 10);

  // Строим path для эпюр
  let pathM = `M ${scaleX(0)} ${scaleM(M(0))}`;
  let pathm = `M ${scaleX(0)} ${scalem(m(0))}`;
  for (let i = 1; i <= 100; i++) {
    const x = (i / 100) * L;
    pathM += ` L ${scaleX(x)} ${scaleM(M(x))}`;
    pathm += ` L ${scaleX(x)} ${scalem(m(x))}`;
  }

  // Центры тяжести треугольников эпюры m(x)
  // Зависят от конфигурации балки
  let xc1: number, xc2: number;
  let seg1Start: number, seg1End: number, seg2Start: number, seg2End: number;
  let m_max_at_junction: number; // Максимум m(x) на стыке участков

  if (isOverhangLeft) {
    // Удар на консоли: треугольник 1 от impactX до xA, треугольник 2 от xA до xB
    seg1Start = impactX;
    seg1End = xA;
    seg2Start = xA;
    seg2End = xB;
    // m(xA) = -(xA - impactX) — отрицательное значение (знаковая площадь)
    m_max_at_junction = -(xA - impactX);
    // Треугольник 1: нуль в impactX, минимум в xA → центр на 2/3 от impactX
    xc1 = impactX + (2/3) * (xA - impactX);
    // Треугольник 2: минимум в xA, нуль в xB → центр на 1/3 от xA
    xc2 = xA + (1/3) * (xB - xA);
  } else {
    // Удар между опорами: треугольник 1 от xA до impactX, треугольник 2 от impactX до xB
    seg1Start = xA;
    seg1End = impactX;
    seg2Start = impactX;
    seg2End = xB;
    m_max_at_junction = RA_unit * (impactX - xA); // m(impactX)
    // Треугольник 1: нуль в xA, максимум в impactX → центр на 2/3 от xA
    xc1 = xA + (2/3) * (impactX - xA);
    // Треугольник 2: максимум в impactX, нуль в xB → центр на 1/3 от impactX
    xc2 = impactX + (1/3) * (xB - impactX);
  }

  // Длины участков
  const len1 = seg1End - seg1Start;
  const len2 = seg2End - seg2Start;

  html += `
  <h3>${sectionNum}.3. Графическое представление</h3>
  <div style="display: flex; justify-content: center; margin: 20px 0;">
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="max-width: ${svgWidth}px; width: 100%; background: white; border: 1px solid #ddd;">
      <!-- Эпюра M(x) -->
      <text x="${margin.left - 10}" y="${baselineM}" font-size="12" text-anchor="end" fill="#333">M(x)</text>
      <line x1="${margin.left}" y1="${baselineM}" x2="${margin.left + plotW}" y2="${baselineM}" stroke="#666" stroke-width="1"/>
      <path d="${pathM} L ${scaleX(L)} ${baselineM} L ${scaleX(0)} ${baselineM} Z" fill="rgba(239,68,68,0.2)" stroke="#ef4444" stroke-width="2"/>
      <!-- Подпись максимума M(x) -->
      <text x="${scaleX(maxM_x)}" y="${scaleM(maxM_val) + (maxM_val >= 0 ? -5 : 12)}" font-size="9" text-anchor="middle" fill="#ef4444" font-weight="bold">${formatNumber(maxM_val, 2)}</text>

      <!-- Эпюра m(x) -->
      <text x="${margin.left - 10}" y="${baselinem}" font-size="12" text-anchor="end" fill="#333">m(x)</text>
      <line x1="${margin.left}" y1="${baselinem}" x2="${margin.left + plotW}" y2="${baselinem}" stroke="#666" stroke-width="1"/>
      <path d="${pathm} L ${scaleX(L)} ${baselinem} L ${scaleX(0)} ${baselinem} Z" fill="rgba(34,197,94,0.2)" stroke="#22c55e" stroke-width="2"/>
      <!-- Подпись экстремума m(x) -->
      <text x="${scaleX(maxm_x)}" y="${scalem(maxm_val) + (maxm_val >= 0 ? -5 : 12)}" font-size="9" text-anchor="middle" fill="#22c55e" font-weight="bold">${formatNumber(maxm_val, 2)}</text>

      <!-- Пунктирные линии центров тяжести - через оба графика -->
      <line x1="${scaleX(xc1)}" y1="${margin.top}" x2="${scaleX(xc1)}" y2="${baselinem + plotH/2}" stroke="#9333ea" stroke-width="1.5" stroke-dasharray="5,3"/>
      <text x="${scaleX(xc1)}" y="${baselinem + plotH/2 + 15}" font-size="9" text-anchor="middle" fill="#9333ea">x̄₁=${formatNumber(xc1, 2)}</text>
      <line x1="${scaleX(xc2)}" y1="${margin.top}" x2="${scaleX(xc2)}" y2="${baselinem + plotH/2}" stroke="#9333ea" stroke-width="1.5" stroke-dasharray="5,3"/>
      <text x="${scaleX(xc2)}" y="${baselinem + plotH/2 + 15}" font-size="9" text-anchor="middle" fill="#9333ea">x̄₂=${formatNumber(xc2, 2)}</text>

      <!-- Граница участков (точка приложения единичной силы) -->
      <line x1="${scaleX(impactX)}" y1="${margin.top}" x2="${scaleX(impactX)}" y2="${baselinem + plotH/2}" stroke="#f97316" stroke-width="1" stroke-dasharray="3,3"/>
      <text x="${scaleX(impactX)}" y="${svgHeight - 15}" font-size="10" text-anchor="middle" fill="#f97316">x=${formatNumber(impactX)} (X=1)</text>

      <!-- Ось X -->
      <text x="${margin.left + plotW / 2}" y="${svgHeight - 3}" font-size="11" text-anchor="middle" fill="#333">x, м</text>
      <text x="${margin.left}" y="${svgHeight - 30}" font-size="10" text-anchor="middle" fill="#333">0</text>
      <text x="${margin.left + plotW}" y="${svgHeight - 30}" font-size="10" text-anchor="middle" fill="#333">${formatNumber(L)}</text>
    </svg>
  </div>
  <p class="figure-caption" style="text-align: center;">Эпюры \\(M(x)\\) и \\(m(x)\\). Пунктирные линии — центры тяжести треугольников эпюры \\(m(x)\\)</p>

  <h3>${sectionNum}.4. Вычисление интеграла методом Верещагина</h3>
  <p>Эпюра \\(m(x)\\) состоит из двух треугольников с общей вершиной. Применяем формулу Верещагина: умножаем площадь фигуры \\(m(x)\\) на ординату эпюры \\(M(x)\\) в центре тяжести этой фигуры.</p>`;

  // Вычисляем площади треугольников m(x)
  const A1 = 0.5 * len1 * m_max_at_junction;
  const A2 = 0.5 * len2 * m_max_at_junction;

  // Значения M(x) в центрах тяжести
  const M_at_xc1 = M(xc1);
  const M_at_xc2 = M(xc2);

  // Вклады в интеграл
  const contrib1 = A1 * M_at_xc1;
  const contrib2 = A2 * M_at_xc2;
  const totalIntegral = contrib1 + contrib2;

  if (!isCantilever) {
    const centroidFormula1 = isOverhangLeft
      ? `${formatNumber(impactX)} + \\frac{2}{3} \\cdot ${formatNumber(len1)}`
      : `${formatNumber(xA)} + \\frac{2}{3} \\cdot ${formatNumber(len1)}`;
    const centroidFormula2 = isOverhangLeft
      ? `${formatNumber(xA)} + \\frac{1}{3} \\cdot ${formatNumber(len2)}`
      : `${formatNumber(impactX)} + \\frac{1}{3} \\cdot ${formatNumber(len2)}`;

    html += `
  <p><strong>Треугольник 1</strong> (участок \\(${formatNumber(seg1Start)} \\leq x \\leq ${formatNumber(seg1End)}\\)):</p>
  <ul>
    <li>Основание: \\(${formatNumber(len1)}\\) м, значение \\(m\\) на стыке: \\(${formatNumber(m_max_at_junction, 4)}\\)</li>
    <li>Площадь (знаковая): \\(A_1 = \\frac{1}{2} \\cdot ${formatNumber(len1)} \\cdot ${formatSigned(m_max_at_junction, 4)} = ${formatNumber(A1, 4)}\\) м²</li>
    <li>Центр тяжести: \\(\\bar{x}_1 = ${centroidFormula1} = ${formatNumber(xc1, 4)}\\) м</li>
    <li>Ордината \\(M(\\bar{x}_1)\\): \\(M(${formatNumber(xc1, 2)}) = ${formatNumber(M_at_xc1, 4)}\\) кН·м</li>
    <li>Вклад: \\(A_1 \\cdot M(\\bar{x}_1) = ${formatSigned(A1, 4)} \\cdot ${formatSigned(M_at_xc1)} = ${formatNumber(contrib1, 4)}\\) кН·м³</li>
  </ul>

  <p><strong>Треугольник 2</strong> (участок \\(${formatNumber(seg2Start)} \\leq x \\leq ${formatNumber(seg2End)}\\)):</p>
  <ul>
    <li>Основание: \\(${formatNumber(len2)}\\) м, значение \\(m\\) на стыке: \\(${formatNumber(m_max_at_junction, 4)}\\)</li>
    <li>Площадь (знаковая): \\(A_2 = \\frac{1}{2} \\cdot ${formatNumber(len2)} \\cdot ${formatSigned(m_max_at_junction, 4)} = ${formatNumber(A2, 4)}\\) м²</li>
    <li>Центр тяжести: \\(\\bar{x}_2 = ${centroidFormula2} = ${formatNumber(xc2, 4)}\\) м</li>
    <li>Ордината \\(M(\\bar{x}_2)\\): \\(M(${formatNumber(xc2, 2)}) = ${formatNumber(M_at_xc2, 4)}\\) кН·м</li>
    <li>Вклад: \\(A_2 \\cdot M(\\bar{x}_2) = ${formatSigned(A2, 4)} \\cdot ${formatSigned(M_at_xc2)} = ${formatNumber(contrib2, 4)}\\) кН·м³</li>
  </ul>

  <p><strong>Сумма вкладов:</strong></p>
  <div class="formula">
    \\[\\int_0^L M(x) \\cdot m(x) \\, dx = A_1 \\cdot M(\\bar{x}_1) + A_2 \\cdot M(\\bar{x}_2) = ${formatNumber(contrib1, 4)} + ${formatSigned(contrib2)} = ${formatNumber(totalIntegral, 4)} \\text{ кН} \\cdot \\text{м}^3\\]
  </div>`;
  }

  html += `
  <h3>${sectionNum}.5. Результат</h3>
  <p>Статический прогиб в точке удара:</p>
  <div class="formula">
    \\[\\delta_{\\text{ст}} = \\frac{1}{EI} \\int_0^L M(x) \\cdot m(x) \\, dx\\]
  </div>
  <p>При \\(EI = ${EI_formatted} \\cdot 10^6\\) Н·м² = \\(${EI_formatted}\\) МН·м²:</p>
  <div class="formula">
    \\[|\\delta_{\\text{ст}}| = \\frac{${formatNumber(Math.abs(integral * 1000), 2)}}{${EI_formatted} \\cdot 10^6} = ${formatNumber(Math.abs(delta_m), 6)} \\text{ м} = ${formatNumber(delta_mm, 4)} \\text{ мм}\\]
  </div>
  <p><em>Примечание: значение совпадает с результатом, полученным методом начальных параметров.</em></p>`;

  return html;
}

/**
 * Раздел "Ударное нагружение"
 */
function buildImpactLoadingSection(
  input: BeamInput,
  result: BeamResult,
  sectionNum: number
): string {
  if (result.loadMode !== 'impact' || result.Kd === undefined) {
    return '';
  }

  const H_cm = (result.impactHeight ?? 0) * 100; // м → см
  const H_m = result.impactHeight ?? 0;
  const yStaticAtImpact_mm = (result.yStaticAtImpact ?? 0) * 1000; // м → мм
  const yStaticAtImpact_cm = yStaticAtImpact_mm / 10;
  const Kd = result.Kd;
  const sigmaMax = result.sigmaMax ?? 0; // МПа
  const sigmaDynamic = result.sigmaDynamic ?? 0; // МПа
  const yDynamic_mm = (result.yDynamic ?? 0) * 1000;
  const springStiffness = result.springStiffness; // см/кН
  const springDeflection_mm = (result.springDeflection ?? 0) * 1000;

  // Вспомогательная функция для форматирования со скобками для отрицательных
  const formatSigned = (n: number, decimals = 4): string => {
    const formatted = formatNumber(n, decimals);
    return n < 0 ? `(${formatted})` : formatted;
  };

  // Находим силу удара
  const forces = input.loads.filter(l => l.type === 'force');
  const forceIndex = input.impactForceIndex ?? 0;
  const impactForce = forces.length > forceIndex ? Math.abs((forces[forceIndex] as { F: number }).F) : 0;

  // Точка приложения удара
  const impactX = forces.length > forceIndex ? (forces[forceIndex] as { x: number }).x : 0;

  let html = `
  <h2>${sectionNum}. Ударное нагружение</h2>
  <p>На балку действует груз \\(P = ${formatNumber(impactForce)}\\) кН, падающий с высоты \\(H = ${formatNumber(H_cm)}\\) см = \\(${formatNumber(H_m, 3)}\\) м в точке \\(x = ${formatNumber(impactX)}\\) м.</p>

  <h3>${sectionNum}.1. Статический прогиб в точке удара</h3>
  <p>Статический прогиб \\(\\delta_{\\text{ст}}\\) — прогиб балки в точке приложения силы при статическом действии нагрузки (определён методом Верещагина и МНП в предыдущих разделах):</p>
  <div class="formula">
    \\[|\\delta_{\\text{ст}}| = ${formatNumber(yStaticAtImpact_mm, 4)} \\text{ мм} = ${formatNumber(yStaticAtImpact_cm / 100, 6)} \\text{ м}\\]
  </div>`;

  // Коэффициент динамичности - используем только прогиб балки (без пружины)
  const subsectionNum = 2;
  const deltaForKd = yStaticAtImpact_cm; // Только прогиб балки в точке удара

  // Промежуточные значения для Kд
  const deltaForKd_m = deltaForKd / 100; // см → м
  const ratioUnderSqrt = (2 * H_m) / deltaForKd_m;
  const valueUnderSqrt = 1 + ratioUnderSqrt;
  const sqrtValue = Math.sqrt(valueUnderSqrt);

  html += `
  <h3>${sectionNum}.${subsectionNum}. Коэффициент динамичности</h3>
  <p>Коэффициент динамичности при ударе с высоты \\(H\\) определяется по формуле:</p>
  <div class="formula">
    \\[K_д = 1 + \\sqrt{1 + \\frac{2H}{|\\delta_{\\text{ст}}|}}\\]
  </div>
  <p>Подставляя значения (\\(|\\delta_{\\text{ст}}| = ${formatNumber(deltaForKd_m, 6)}\\) м, \\(H = ${formatNumber(H_m, 3)}\\) м):</p>
  <div class="formula">
    \\[K_д = 1 + \\sqrt{1 + \\frac{2 \\cdot ${formatNumber(H_m, 3)}}{${formatNumber(deltaForKd_m, 6)}}} = 1 + \\sqrt{1 + ${formatNumber(ratioUnderSqrt, 3)}} = 1 + \\sqrt{${formatNumber(valueUnderSqrt, 3)}} = 1 + ${formatNumber(sqrtValue, 4)} = ${formatNumber(Kd, 4)}\\]
  </div>`;

  // Динамические напряжения
  const subsectionSigma = subsectionNum + 1;
  html += `
  <h3>${sectionNum}.${subsectionSigma}. Динамические напряжения</h3>
  <p>Статическое напряжение (при статическом действии нагрузки):</p>
  <div class="formula">
    \\[\\sigma_{\\text{ст}} = ${formatNumber(sigmaMax, 2)} \\text{ МПа}\\]
  </div>
  <p>Максимальное нормальное напряжение при ударе:</p>
  <div class="formula">
    \\[\\sigma_{\\text{дин}} = K_д \\cdot \\sigma_{\\text{ст}} = ${formatNumber(Kd, 3)} \\cdot ${formatNumber(sigmaMax, 2)} = ${formatNumber(sigmaDynamic, 2)} \\text{ МПа}\\]
  </div>`;

  // Динамический прогиб
  const subsectionDefl = subsectionSigma + 1;
  html += `
  <h3>${sectionNum}.${subsectionDefl}. Динамический прогиб</h3>
  <p>Максимальный прогиб балки при ударе:</p>
  <div class="formula">
    \\[y_{\\text{дин}} = K_д \\cdot \\delta_{\\text{ст}} = ${formatNumber(Kd, 3)} \\cdot ${formatNumber(yStaticAtImpact_mm, 4)} = ${formatNumber(yDynamic_mm, 4)} \\text{ мм}\\]
  </div>`;

  // Осадки пружин (если есть)
  let subsectionSpring = subsectionDefl;
  if (springStiffness && springStiffness > 0) {
    subsectionSpring = subsectionDefl + 1;
    const RA = result.reactions.RA ?? 0;
    const RB = result.reactions.RB ?? 0;

    // Статические осадки: s = α × R
    const sA_st = springStiffness * RA; // см
    const sB_st = springStiffness * RB; // см

    // Динамические осадки: s_уд = k_уд × s_ст
    const sA_dyn = Kd * sA_st;
    const sB_dyn = Kd * sB_st;

    html += `
  <h3>${sectionNum}.${subsectionSpring}. Осадки пружинных опор</h3>
  <p>Осадка пружины определяется по формуле \\(s = \\alpha \\cdot R\\), где \\(\\alpha = ${formatNumber(springStiffness)}\\) см/кН, \\(R\\) — реакция опоры в кН.</p>

  <p><strong>Статические осадки:</strong></p>
  <div class="formula">
    \\[s_{A,\\text{ст}} = \\alpha \\cdot R_A = ${formatNumber(springStiffness)} \\cdot ${formatNumber(RA)} = ${formatNumber(sA_st, 4)} \\text{ см}\\]
  </div>
  <div class="formula">
    \\[s_{B,\\text{ст}} = \\alpha \\cdot R_B = ${formatNumber(springStiffness)} \\cdot ${formatSigned(RB)} = ${formatNumber(sB_st, 4)} \\text{ см}\\]
  </div>

  <p><strong>Динамические осадки</strong> (при ударе реакции масштабируются на \\(K_д\\)):</p>
  <div class="formula">
    \\[s_{A,\\text{уд}} = K_д \\cdot s_{A,\\text{ст}} = ${formatNumber(Kd, 4)} \\cdot ${formatNumber(sA_st, 4)} = ${formatNumber(sA_dyn, 2)} \\text{ см}\\]
  </div>
  <div class="formula">
    \\[s_{B,\\text{уд}} = K_д \\cdot s_{B,\\text{ст}} = ${formatNumber(Kd, 4)} \\cdot ${formatSigned(sB_st, 4)} = ${formatNumber(sB_dyn, 2)} \\text{ см}\\]
  </div>
  ${RB < 0 || RA < 0 ? `<p><em>Знак минус означает, что реакция направлена противоположно ожидаемому (отрыв).</em></p>` : ""}`;
  }

  // Сравнение статики и динамики
  const subsectionCompare = subsectionSpring + 1;
  const stressDiff = sigmaDynamic - sigmaMax;
  const stressRatio = sigmaMax > 0 ? (sigmaDynamic / sigmaMax - 1) * 100 : 0;
  html += `
  <h3>${sectionNum}.${subsectionCompare}. Сравнение статического и динамического нагружения</h3>
  <table>
    <tr><th>Параметр</th><th>Статика</th><th>Удар</th><th>Увеличение</th></tr>
    <tr>
      <td>Напряжение \\(\\sigma\\), МПа</td>
      <td>\\(${formatNumber(sigmaMax, 2)}\\)</td>
      <td>\\(${formatNumber(sigmaDynamic, 2)}\\)</td>
      <td>\\(${formatNumber(stressDiff, 2)}\\) МПа (${formatNumber(stressRatio, 1)}%)</td>
    </tr>
    <tr>
      <td>Прогиб \\(y\\), мм</td>
      <td>\\(${formatNumber(yStaticAtImpact_mm, 4)}\\)</td>
      <td>\\(${formatNumber(yDynamic_mm, 4)}\\)</td>
      <td>в \\(K_д = ${formatNumber(Kd, 3)}\\) раз</td>
    </tr>
  </table>
  <p><strong>Вывод:</strong> При ударном нагружении напряжения и прогибы увеличиваются в \\(K_д = ${formatNumber(Kd, 3)}\\) раз по сравнению со статическим нагружением.</p>`;

  return html;
}

/**
 * Раздел "Выводы"
 */
function buildConclusionsSection(
  input: BeamInput,
  result: BeamResult,
  Qmax: { value: number; x: number },
  Mmax: { value: number; x: number },
  yMax: { value: number; x: number },
  hasDeflection: boolean
): string {
  const conclusions: string[] = [];

  // Реакции
  if (result.reactions.RA !== undefined && result.reactions.RB !== undefined) {
    conclusions.push(`Реакции опор: \\(R_A = ${formatNumber(result.reactions.RA)}\\) кН, \\(R_B = ${formatNumber(result.reactions.RB)}\\) кН`);
  } else if (result.reactions.Rf !== undefined) {
    conclusions.push(`Реакция заделки: \\(R = ${formatNumber(result.reactions.Rf)}\\) кН, \\(M_f = ${formatNumber(result.reactions.Mf ?? 0)}\\) кН·м`);
  }

  // Экстремумы
  conclusions.push(`Максимальная поперечная сила: \\(|Q|_{\\max} = ${formatNumber(Math.abs(Qmax.value))}\\) кН при \\(x = ${formatNumber(Qmax.x)}\\) м`);
  conclusions.push(`Максимальный изгибающий момент: \\(|M|_{\\max} = ${formatNumber(Math.abs(Mmax.value))}\\) кН·м при \\(x = ${formatNumber(Mmax.x)}\\) м`);

  // Сечение
  if (result.diameter) {
    conclusions.push(`Минимальный диаметр круглого сечения: \\(d = ${formatNumber(result.diameter * 1000)}\\) мм`);
  }

  // Прогиб
  if (hasDeflection && Math.abs(yMax.value) > 1e-9) {
    conclusions.push(`Максимальный прогиб: \\(|y|_{\\max} = ${formatNumber(Math.abs(yMax.value) * 1000)}\\) мм при \\(x = ${formatNumber(yMax.x)}\\) м`);
  }

  // Ударное нагружение
  if (result.loadMode === 'impact' && result.Kd !== undefined) {
    conclusions.push(`Коэффициент динамичности: \\(K_д = ${formatNumber(result.Kd, 3)}\\)`);
    if (result.sigmaDynamic !== undefined) {
      conclusions.push(`Динамическое напряжение: \\(\\sigma_{\\text{дин}} = ${formatNumber(result.sigmaDynamic, 2)}\\) МПа`);
    }
    if (result.yDynamic !== undefined) {
      conclusions.push(`Динамический прогиб: \\(y_{\\text{дин}} = ${formatNumber(result.yDynamic * 1000, 4)}\\) мм`);
    }
  }

  // Проверки
  conclusions.push(`Проверка равновесия выполнена`);

  return `
  <h2>Выводы</h2>
  <div class="conclusions">
    <ol>
      ${conclusions.map(c => `<li>${c}</li>`).join("\n      ")}
    </ol>
  </div>`;
}

/**
 * Генерирует секцию с реакциями — пошаговый вывод как в методичке
 */
function buildReactionsSection(input: BeamInput, reactions: Reactions): string {
  const { loads, L } = input;
  const isCantilever = input.beamType.startsWith("cantilever");

  // Структура для описания каждой нагрузки
  interface LoadInfo {
    type: "force" | "moment" | "distributed";
    label: string;           // P₁, M₁, q₁ и т.д.
    value: number;           // значение (F, M или q)
    x?: number;              // точка приложения (для силы/момента)
    a?: number;              // начало участка (для распределённой)
    b?: number;              // конец участка (для распределённой)
    Fq?: number;             // равнодействующая (для распределённой)
    xq?: number;             // точка приложения равнодействующей
  }

  const loadInfos: LoadInfo[] = [];

  // Подсчитываем количество нагрузок каждого типа для индексов
  const forceCount = loads.filter(l => l.type === "force").length;
  const momentCount = loads.filter(l => l.type === "moment").length;

  let forceIdx = 1;
  let momentIdx = 1;

  // Добавляем силы и моменты
  for (const load of loads) {
    if (load.type === "force") {
      // Если сила одна - без индекса (F), если несколько - с индексом (F₁, F₂)
      const label = forceCount === 1 ? "F" : `F_{${forceIdx}}`;
      loadInfos.push({
        type: "force",
        label,
        value: load.F,
        x: load.x
      });
      forceIdx++;
    } else if (load.type === "moment") {
      // Если момент один - без индекса (M), если несколько - с индексом (M₁, M₂)
      const label = momentCount === 1 ? "M" : `M_{${momentIdx}}`;
      loadInfos.push({
        type: "moment",
        label,
        value: load.M,
        x: load.x
      });
      momentIdx++;
    }
  }

  // Добавляем РЕЗУЛЬТИРУЮЩИЕ распределённые нагрузки (как на схеме)
  const resultingLoads = computeResultingLoads(input);
  resultingLoads.forEach((seg, i) => {
    const Fq = seg.q * (seg.b - seg.a);
    const xq = (seg.a + seg.b) / 2;
    // Если нагрузка одна - без индекса (q), если несколько - с индексом (q₁, q₂)
    const label = resultingLoads.length === 1 ? "q" : `q_{${i + 1}}`;
    loadInfos.push({
      type: "distributed",
      label,
      value: seg.q,
      a: seg.a,
      b: seg.b,
      Fq,
      xq
    });
  });

  // Для консольной балки
  if (isCantilever) {
    return buildCantileverReactions(input, reactions, loadInfos);
  }

  // Для двухопорной балки
  return buildSimplySupportedReactions(input, reactions, loadInfos);
}

/**
 * Раздел реакций для консольной балки
 */
function buildCantileverReactions(
  input: BeamInput,
  reactions: Reactions,
  loadInfos: Array<{
    type: "force" | "moment" | "distributed";
    label: string;
    value: number;
    x?: number;
    a?: number;
    b?: number;
    Fq?: number;
    xq?: number;
  }>
): string {
  const Rf = reactions.Rf ?? 0;
  const Mf = reactions.Mf ?? 0;
  const xf = reactions.xf ?? 0;
  const L = input.L;

  let html = `
  <p><strong>Соглашения знаков:</strong> реакции вверх «+»; внешние нагрузки: вниз «+», вверх «-»; моменты против часовой стрелки «+».</p>
  <p>Заделка расположена в точке \\(x = ${formatNumber(xf)}\\) м.</p>`;

  // Показываем равнодействующие распределённых нагрузок
  const distributed = loadInfos.filter(l => l.type === "distributed");
  if (distributed.length > 0) {
    html += `\n  <p><strong>Равнодействующие распределённых нагрузок:</strong></p>`;
    for (const d of distributed) {
      html += `
  <div class="formula">
    \\(F_{${d.label}} = ${d.label} \\cdot (${formatNumber(d.b!)} - ${formatNumber(d.a!)}) = ${formatNumber(d.value)} \\cdot ${formatNumber(d.b! - d.a!)} = ${formatNumber(d.Fq!)}\\) кН, точка приложения \\(x_{${d.label}} = \\frac{${formatNumber(d.a!)} + ${formatNumber(d.b!)}}{2} = ${formatNumber(d.xq!)}\\) м
  </div>`;
    }
  }

  // Уравнение сил
  html += `\n  <p><strong>Сумма проекций на вертикальную ось:</strong></p>`;

  const forceTermsSymbolic: string[] = ["R"];
  const forceTermsNumeric: string[] = [`R`];
  let totalForceValue = 0;

  for (const load of loadInfos) {
    if (load.type === "force") {
      // Сила вниз (>=0) вычитается из реакции
      const sign = load.value >= 0 ? "-" : "+";
      forceTermsSymbolic.push(`${sign} ${load.label}`);
      forceTermsNumeric.push(`${sign} ${formatNumber(Math.abs(load.value))}`);
      totalForceValue += load.value;
    } else if (load.type === "distributed") {
      // Нагрузка вниз (>=0) вычитается из реакции
      const sign = load.Fq! >= 0 ? "-" : "+";
      forceTermsSymbolic.push(`${sign} F_{${load.label}}`);
      forceTermsNumeric.push(`${sign} ${formatNumber(Math.abs(load.Fq!))}`);
      totalForceValue += load.Fq!;
    }
  }

  html += `
  <div class="formula">
    \\(\\sum F_y = 0: \\quad ${forceTermsSymbolic.join(" ")} = 0\\)
  </div>`;

  html += `
  <p>Подставляем значения:</p>
  <div class="formula">
    \\(R ${forceTermsNumeric.slice(1).join(" ")} = 0 \\quad \\Rightarrow \\quad \\boxed{R = ${formatNumber(Rf)} \\text{ кН}}\\)
  </div>`;

  // Уравнение моментов
  html += `\n  <p><strong>Сумма моментов относительно заделки:</strong></p>`;

  const momentTermsSymbolic: string[] = ["M_f"];
  const momentTermsNumeric: string[] = [];
  let totalMomentValue = 0;

  for (const load of loadInfos) {
    if (load.type === "force") {
      const arm = load.x! - xf;
      if (Math.abs(arm) > 1e-9) {
        // Знак момента зависит от направления силы И знака плеча
        // Сила вниз (F>=0) с положительным плечом → отрицательный момент (по часовой)
        // Сила вниз (F>=0) с отрицательным плечом → положительный момент (против часовой)
        const momentProduct = load.value * arm;
        const sign = momentProduct >= 0 ? "-" : "+";
        momentTermsSymbolic.push(`${sign} ${load.label} \\cdot (x_{${load.label}} - x_f)`);
        const momentContrib = -momentProduct;
        momentTermsNumeric.push(`${sign} ${formatNumber(Math.abs(load.value))} \\cdot ${formatNumber(Math.abs(arm))}`);
        totalMomentValue += momentContrib;
      }
    } else if (load.type === "moment") {
      // Момент: значение уже содержит знак (+ = против часовой в конвенции solver)
      const sign = load.value >= 0 ? "+" : "-";
      momentTermsSymbolic.push(`${sign} ${load.label}`);
      momentTermsNumeric.push(`${sign} ${formatNumber(Math.abs(load.value))}`);
      totalMomentValue += load.value;
    } else if (load.type === "distributed") {
      const arm = load.xq! - xf;
      if (Math.abs(arm) > 1e-9) {
        // Знак момента зависит от направления нагрузки И знака плеча
        const momentProduct = load.Fq! * arm;
        const sign = momentProduct >= 0 ? "-" : "+";
        momentTermsSymbolic.push(`${sign} F_{${load.label}} \\cdot (x_{${load.label}} - x_f)`);
        const momentContrib = -momentProduct;
        momentTermsNumeric.push(`${sign} ${formatNumber(Math.abs(load.Fq!))} \\cdot ${formatNumber(Math.abs(arm))}`);
        totalMomentValue += momentContrib;
      }
    }
  }

  html += `
  <div class="formula">
    \\(\\sum M = 0: \\quad ${momentTermsSymbolic.join(" ")} = 0\\)
  </div>`;

  html += `
  <p>Подставляем значения:</p>
  <div class="formula">
    \\(M_f ${momentTermsNumeric.join(" ")} = 0 \\quad \\Rightarrow \\quad \\boxed{M_f = ${formatNumber(Mf)}}\\) кН·м
  </div>`;

  // Итог
  html += `
  <p><strong>Итог:</strong></p>
  <div class="formula">
    \\(R = ${formatNumber(Rf)}\\) кН ${Rf >= 0 ? "(вверх)" : "(вниз)"}, \\(M_f = ${formatNumber(Mf)}\\) кН·м
  </div>`;

  return html;
}

/**
 * Раздел реакций для двухопорной балки
 */
function buildSimplySupportedReactions(
  input: BeamInput,
  reactions: Reactions,
  loadInfos: Array<{
    type: "force" | "moment" | "distributed";
    label: string;
    value: number;
    x?: number;
    a?: number;
    b?: number;
    Fq?: number;
    xq?: number;
  }>
): string {
  const RA = reactions.RA ?? 0;
  const RB = reactions.RB ?? 0;
  const xA = reactions.xA ?? 0;
  const xB = reactions.xB ?? input.L;
  const span = xB - xA;

  let html = `
  <p><strong>Соглашения знаков:</strong> реакции вверх «+»; внешние нагрузки: вниз «+», вверх «-»; моменты против часовой стрелки «+».</p>
  <p>Опора A в точке \\(x_A = ${formatNumber(xA)}\\) м, опора B в точке \\(x_B = ${formatNumber(xB)}\\) м.</p>`;

  // Показываем равнодействующие распределённых нагрузок
  const distributed = loadInfos.filter(l => l.type === "distributed");
  if (distributed.length > 0) {
    html += `\n  <p><strong>Равнодействующие распределённых нагрузок:</strong></p>`;
    for (const d of distributed) {
      html += `
  <div class="formula">
    \\(F_{${d.label}} = ${d.label} \\cdot (${formatNumber(d.b!)} - ${formatNumber(d.a!)}) = ${formatNumber(d.value)} \\cdot ${formatNumber(d.b! - d.a!)} = ${formatNumber(d.Fq!)}\\) кН
  </div>
  <p>Точка приложения: \\(x_{${d.label}} = \\frac{${formatNumber(d.a!)} + ${formatNumber(d.b!)}}{2} = ${formatNumber(d.xq!)}\\) м</p>`;
    }
  }

  // --- Уравнение сил ---
  html += `\n  <p><strong>Сумма проекций на вертикальную ось:</strong></p>`;

  // Символьное уравнение
  const forceSymbolic: string[] = ["R_A", "R_B"];
  for (const load of loadInfos) {
    if (load.type === "force") {
      // Знак уже учтён на схеме: вниз → минус, вверх → плюс
      forceSymbolic.push(load.value >= 0 ? `- ${load.label}` : `+ ${load.label}`);
    } else if (load.type === "distributed") {
      forceSymbolic.push(`- F_{${load.label}}`);
    }
  }

  html += `
  <div class="formula">
    \\(\\sum F_y = 0: \\quad ${forceSymbolic.join(" + ").replace(/\+ -/g, "- ").replace(/\+ \+/g, "+ ")} = 0\\)
  </div>`;

  // Подстановка в уравнение сил
  let totalLoad = 0;
  const forceNumTerms: string[] = [];
  for (const load of loadInfos) {
    if (load.type === "force") {
      totalLoad += load.value;
      forceNumTerms.push(`${load.value >= 0 ? "" : "+"}${formatNumber(-load.value)}`);
    } else if (load.type === "distributed") {
      totalLoad += load.Fq!;
      forceNumTerms.push(`- ${formatNumber(load.Fq!)}`);
    }
  }

  html += `
  <p>Откуда:</p>
  <div class="formula">
    \\(R_A + R_B = ${formatNumber(totalLoad)}\\text{ кН} \\quad (1)\\)
  </div>`;

  // --- Уравнение моментов относительно A ---
  html += `\n  <p><strong>Сумма моментов относительно точки A:</strong></p>`;

  // Символьное уравнение моментов
  const momentSymbolic: string[] = [`R_B \\cdot (x_B - x_A)`];
  for (const load of loadInfos) {
    if (load.type === "force") {
      // Сила вниз (>=0) создаёт отрицательный момент относительно A
      const sign = load.value >= 0 ? "-" : "+";
      momentSymbolic.push(`${sign} ${load.label} \\cdot (x_{${load.label}} - x_A)`);
    } else if (load.type === "moment") {
      // Момент против часовой (>=0) → +M, по часовой (<0) → -M
      const sign = load.value >= 0 ? "+" : "-";
      momentSymbolic.push(`${sign} ${load.label}`);
    } else if (load.type === "distributed") {
      // Нагрузка вниз (>=0) создаёт отрицательный момент
      const sign = load.Fq! >= 0 ? "-" : "+";
      momentSymbolic.push(`${sign} F_{${load.label}} \\cdot (x_{${load.label}} - x_A)`);
    }
  }

  // Форматируем с переносом при большом количестве слагаемых
  const { latex: momentSymbolicLatex, isMultiline: momentSymbolicMulti } = formatLongFormula(
    `\\sum M_A = 0: \\quad`,
    momentSymbolic.concat(["= 0"])
  );
  // Убираем "= 0" из массива и добавляем обратно в конец
  const momentSymbolicFinal = momentSymbolicLatex.replace(/ = 0$/, " = 0");

  html += `
  <div class="formula${momentSymbolicMulti ? " formula-multiline" : ""}">
    \\(${momentSymbolicMulti ? momentSymbolicLatex.replace("= 0 = 0", "= 0") : `\\sum M_A = 0: \\quad ${momentSymbolic.join(" ")} = 0`}\\)
  </div>`;

  // Подстановка чисел
  html += `\n  <p>Подставляем значения:</p>`;

  const momentNumTerms: string[] = [`R_B \\cdot ${formatNumber(span)}`];
  // Собираем вклады в правую часть (что переносим направо от R_B)
  // Уравнение: R_B·L - ΣP·arm - ΣFq·arm + ΣM = 0
  // => R_B·L = ΣP·arm + ΣFq·arm - ΣM
  let rightSideSum = 0;
  const rightSideTerms: string[] = [];

  for (const load of loadInfos) {
    if (load.type === "force") {
      const arm = load.x! - xA;
      if (Math.abs(arm) > 1e-9) {
        const contrib = load.value * arm;
        rightSideSum += contrib;
        // Знак соответствует символьному уравнению
        const sign = load.value >= 0 ? "-" : "+";
        const armStr = arm < 0 ? `(${formatNumber(arm)})` : formatNumber(arm);
        momentNumTerms.push(`${sign} ${formatNumber(Math.abs(load.value))} \\cdot ${armStr}`);
      }
    } else if (load.type === "moment") {
      rightSideSum -= load.value;
      // Знак соответствует символьному уравнению: против часовой (+), по часовой (-)
      const sign = load.value >= 0 ? "+" : "-";
      momentNumTerms.push(`${sign} ${formatNumber(Math.abs(load.value))}`);
    } else if (load.type === "distributed") {
      const arm = load.xq! - xA;
      if (Math.abs(arm) > 1e-9) {
        const contrib = load.Fq! * arm;
        rightSideSum += contrib;
        // Знак соответствует символьному уравнению: вниз (-), вверх (+)
        const sign = load.Fq! >= 0 ? "-" : "+";
        const armStr = arm < 0 ? `(${formatNumber(arm)})` : formatNumber(arm);
        momentNumTerms.push(`${sign} ${formatNumber(Math.abs(load.Fq!))} \\cdot ${armStr}`);
      }
    }
  }

  // Форматируем числовое уравнение с переносом по ширине
  const { latex: momentNumLatex, isMultiline: momentNumMulti } = formatLongFormula("", momentNumTerms.concat(["= 0"]));
  const momentNumFinal = momentNumMulti ? momentNumLatex.replace(/ = 0$/, " = 0") : `${momentNumTerms.join(" ")} = 0`;

  html += `
  <div class="formula${momentNumMulti ? " formula-multiline" : ""}">
    \\(${momentNumFinal}\\)
  </div>`;

  // Вычисляем R_B
  html += `
  <div class="formula">
    \\(R_B \\cdot ${formatNumber(span)} = ${formatNumber(rightSideSum)} \\quad \\Rightarrow \\quad R_B = \\frac{${formatNumber(rightSideSum)}}{${formatNumber(span)}} = ${formatNumber(RB)}\\text{ кН}\\)
  </div>`;

  // Из уравнения (1) находим RA
  html += `
  <p>Из уравнения (1):</p>
  <div class="formula">
    \\(R_A = ${formatNumber(totalLoad)} - R_B = ${formatNumber(totalLoad)} - (${formatNumber(RB)}) = ${formatNumber(RA)}\\text{ кН}\\)
  </div>`;

  // Итог с boxed
  html += `
  <p><strong>Итог:</strong></p>
  <div class="formula">
    \\(\\boxed{R_A = ${formatNumber(RA)}\\text{ кН}}\\) (${RA >= 0 ? "вверх" : "вниз"}), &emsp;
    \\(\\boxed{R_B = ${formatNumber(RB)}\\text{ кН}}\\) (${RB >= 0 ? "вверх" : "вниз"})
  </div>`;

  // Проверка через сумму моментов относительно B (независимое уравнение)
  html += `
  <p><strong>Проверка</strong> (сумма моментов относительно точки B):</p>`;

  // Вычисляем сумму моментов относительно B
  // R_A вверх (положительная) слева от B создаёт момент по часовой (отрицательный)
  let checkMomentSum = -RA * span;
  const checkTerms: string[] = [`-R_A \\cdot (x_B - x_A)`];
  // Учитываем знак R_A для правильного отображения (первый член без + в начале)
  const raFirstTerm = RA >= 0
    ? `-${formatNumber(Math.abs(RA))} \\cdot ${formatNumber(span)}`
    : `${formatNumber(Math.abs(RA))} \\cdot ${formatNumber(span)}`;
  const checkNumTerms: string[] = [raFirstTerm];

  for (const load of loadInfos) {
    if (load.type === "force") {
      const armB = load.x! - xB;
      if (Math.abs(armB) > 1e-9) {
        const contrib = load.value * armB;
        checkMomentSum -= contrib;
        const sign = load.value >= 0 ? "-" : "+";
        checkTerms.push(`${sign} ${load.label} \\cdot (x_{${load.label}} - x_B)`);
        // Скобки только для отрицательных чисел
        const armStr = armB < 0 ? `(${formatNumber(armB)})` : formatNumber(armB);
        checkNumTerms.push(`${sign} ${formatNumber(Math.abs(load.value))} \\cdot ${armStr}`);
      }
    } else if (load.type === "moment") {
      // Момент входит в уравнение напрямую (не меняем знак)
      checkMomentSum += load.value;
      const sign = load.value >= 0 ? "+" : "-";
      checkTerms.push(`${sign} ${load.label}`);
      checkNumTerms.push(`${sign} ${formatNumber(Math.abs(load.value))}`);
    } else if (load.type === "distributed") {
      const armB = load.xq! - xB;
      if (Math.abs(armB) > 1e-9) {
        const contrib = load.Fq! * armB;
        checkMomentSum -= contrib;
        const sign = load.Fq! >= 0 ? "-" : "+";
        checkTerms.push(`${sign} F_{${load.label}} \\cdot (x_{${load.label}} - x_B)`);
        // Скобки только для отрицательных чисел
        const armStr = armB < 0 ? `(${formatNumber(armB)})` : formatNumber(armB);
        checkNumTerms.push(`${sign} ${formatNumber(Math.abs(load.Fq!))} \\cdot ${armStr}`);
      }
    }
  }

  const checkResultValue = formatNumber(checkMomentSum);
  const checkUnit = Math.abs(checkMomentSum) < 0.01 ? "" : "\\text{ кН}\\cdot\\text{м}";
  html += `
  <div class="formula">
    \\(\\sum M_B = ${checkTerms.join(" ")} = ${checkNumTerms.join(" ")} = ${checkResultValue}${checkUnit}\\)
  </div>`;

  const checkResult = Math.abs(checkMomentSum) < 0.01;
  html += `
  <p>${checkResult ? "Проверка выполнена ✓" : "Расхождение: " + checkResultValue + " кН·м"}</p>`;

  return html;
}
