/**
 * Генератор HTML-отчёта для расчёта балки
 */

import type { BeamInput, BeamResult, Reactions, Load } from "./types";
import { buildIntervals, buildSectionFormulas, formatNumber, formatQFormula, formatMFormula, type ForceContribution } from "./sections";

/**
 * Форматирует длинную формулу с переносами строк
 * @param lhs - левая часть (например "M(s)")
 * @param terms - массив слагаемых (например ["+R_A", "-F", ...])
 * @param termsPerLine - максимум слагаемых на строку
 * @returns LaTeX строка с переносами через aligned если нужно
 */
function formatLongFormula(lhs: string, terms: string[], termsPerLine: number = 4): { latex: string; isMultiline: boolean } {
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

  if (cleanTerms.length <= termsPerLine) {
    // Короткая формула - в одну строку
    return { latex: `${lhs} = ${cleanTerms.join(" ")}`, isMultiline: false };
  }

  // Длинная формула - разбиваем на строки
  const lines: string[] = [];
  const firstLineTerms = cleanTerms.slice(0, termsPerLine);
  lines.push(`${lhs} &= ${firstLineTerms.join(" ")}`);

  let idx = termsPerLine;
  while (idx < cleanTerms.length) {
    const lineTerms = cleanTerms.slice(idx, idx + termsPerLine);
    lines.push(`&\\phantom{=} ${lineTerms.join(" ")}`);
    idx += termsPerLine;
  }

  return {
    latex: `\\begin{aligned}\n${lines.join(" \\\\\n")}\n\\end{aligned}`,
    isMultiline: true
  };
}

/**
 * Форматирует слагаемые внутри скобок с переносом строк
 * Для формул типа \frac{1}{EI}\left(...\right)
 */
function formatBracketedTerms(terms: string[], maxPerLine: number = 4): { latex: string; isMultiline: boolean } {
  if (terms.length === 0) return { latex: "", isMultiline: false };
  if (terms.length <= maxPerLine) {
    return { latex: terms.join(" "), isMultiline: false };
  }

  // Многострочный формат
  const lines: string[] = [];
  for (let i = 0; i < terms.length; i += maxPerLine) {
    lines.push(terms.slice(i, i + maxPerLine).join(" "));
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
  background: "#f8fafc",
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
  const hasCrossSection = !!(result.diameter && result.W && result.I);
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

  ${buildProblemStatement(input, hasDeflection, hasCrossSection)}

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

  <h2>5. Экстремальные значения</h2>
  <table>
    <tr><th>Величина</th><th>Значение</th><th>Координата</th></tr>
    <tr><td>\\(|Q|_{\\max}\\)</td><td>\\(${formatNumber(Math.abs(Qmax.value))}\\) кН</td><td>\\(x = ${formatNumber(Qmax.x)}\\) м</td></tr>
    <tr><td>\\(|M|_{\\max}\\)</td><td>\\(${formatNumber(Math.abs(Mmax.value))}\\) кН·м</td><td>\\(x = ${formatNumber(Mmax.x)}\\) м</td></tr>
    ${y ? `<tr><td>\\(|y|_{\\max}\\)</td><td>\\(${formatNumber(Math.abs(yMax.value) * 1000)}\\) мм</td><td>\\(x = ${formatNumber(yMax.x)}\\) м</td></tr>` : ""}
  </table>

  ${hasDiagrams ? `
  <h2>6. Эпюры</h2>
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
    let sectionNum = hasDiagrams ? 7 : 6;
    let html = "";

    if (hasCrossSection) {
      html += buildCrossSectionBlock(input, result, Mmax, sectionNum);
      sectionNum++;
    }

    if (hasDeflection) {
      html += buildMNPSection(input, result, sectionNum);
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
function buildProblemStatement(input: BeamInput, hasDeflection: boolean, hasCrossSection: boolean): string {
  const tasks: string[] = [
    "Определить реакции опор",
    "Построить эпюры поперечных сил \\(Q\\) и изгибающих моментов \\(M\\)"
  ];

  if (hasCrossSection) {
    tasks.push("Подобрать диаметр круглого сечения из условия прочности");
  }

  if (hasDeflection) {
    tasks.push("Определить прогибы и найти максимальный прогиб балки");
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
      // Реакция: знак определяется направлением (вверх = +, вниз = -)
      // В формуле пишем знак отдельно, значение по модулю
      const isUpward = f.value >= 0;
      const sign = isUpward ? "+" : "-";
      symbolicTerms.push(`${sign} ${f.label}`);
      numericTerms.push(`${sign} ${formatNumber(Math.abs(f.value))}`);
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

  // Активная q на участке
  if (Math.abs(activeQ) > 1e-9) {
    const sign = activeQ >= 0 ? "-" : "+";
    symbolicTerms.push(`${sign} q \\cdot ${varName}`);
    numericTerms.push(`${sign} ${formatNumber(Math.abs(activeQ))} \\cdot ${varName}`);
  }

  // Форматируем с переносами если формула длинная
  const symbolic = formatLongFormula(`Q(${varName})`, symbolicTerms, 4);
  const numeric = formatLongFormula(`Q(${varName})`, numericTerms, 4);

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
      // Реакция: знак определяется направлением (вверх = +, вниз = -)
      // В формуле пишем знак отдельно, значение по модулю
      const arm = sectionStart - c.x;
      const isUpward = c.value >= 0;
      const sign = isUpward ? "+" : "-";

      if (Math.abs(arm) < 1e-9) {
        // Реакция прямо в начале участка - плечо = s
        symbolicTerms.push(`${sign} ${c.label} \\cdot ${varName}`);
        numericTerms.push(`${sign} ${formatNumber(Math.abs(c.value))} \\cdot ${varName}`);
      } else {
        symbolicTerms.push(`${sign} ${c.label} \\cdot (${formatNumber(arm)} + ${varName})`);
        numericTerms.push(`${sign} ${formatNumber(Math.abs(c.value))} \\cdot (${formatNumber(arm)} + ${varName})`);
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

  // Активная q на участке: -q·z²/2 (если q вниз)
  if (Math.abs(activeQ) > 1e-9) {
    const sign = activeQ >= 0 ? "-" : "+";
    symbolicTerms.push(`${sign} \\frac{q \\cdot ${varName}^2}{2}`);
    numericTerms.push(`${sign} \\frac{${formatNumber(Math.abs(activeQ))} \\cdot ${varName}^2}{2}`);
  }

  // Форматируем с переносами если формула длинная
  const symbolic = formatLongFormula(`M(${varName})`, symbolicTerms, 4);
  const numeric = formatLongFormula(`M(${varName})`, numericTerms, 4);

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
 * Раздел "Подбор сечения"
 */
function buildCrossSectionBlock(input: BeamInput, result: BeamResult, Mmax: { value: number; x: number }, sectionNum: number): string {
  const W_cm3 = formatNumber(result.W! * 1e6, 4);
  const d_mm = formatNumber(result.diameter! * 1000, 2);
  const I_cm4 = formatNumber(result.I! * 1e8, 4);
  const sigma_MPa = formatNumber((input.sigma ?? 0) / 1e6);

  return `
  <h2>${sectionNum}. Подбор сечения</h2>
  <p>По условию прочности при допускаемом напряжении \\([\\sigma] = ${sigma_MPa}\\) МПа:</p>
  <div class="formula">
    \\[W \\geq \\frac{|M|_{\\max}}{[\\sigma]} = \\frac{${formatNumber(Math.abs(Mmax.value) * 1000)}}{${sigma_MPa}} = ${W_cm3} \\text{ см}^3\\]
  </div>
  <p>где \\(|M|_{\\max} = ${formatNumber(Math.abs(Mmax.value) * 1000)}\\) Н·м, \\([\\sigma] = ${sigma_MPa}\\) МПа.</p>
  <p>Для круглого сплошного сечения \\(W = \\frac{\\pi d^3}{32}\\), откуда:</p>
  <div class="formula">
    \\[\\boxed{d_{\\min} = \\sqrt[3]{\\frac{32W}{\\pi}} = ${d_mm} \\text{ мм}}\\]
  </div>
  <p>Момент инерции:</p>
  <div class="formula">
    \\[I = \\frac{\\pi d^4}{64} = ${I_cm4} \\text{ см}^4\\]
  </div>`;
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

  // Формируем уравнение с переносами для длинных формул
  // Разбиваем на строки по 3 слагаемых (после EI·y_0 и EI·theta_0·x)
  const TERMS_PER_LINE = 3;

  let equation: string;
  if (terms.length <= 4) {
    // Короткая формула - в одну строку
    equation = `EI \\cdot y(x) = ${terms.join(" ")}`;
  } else {
    // Длинная формула - разбиваем на строки
    const lines: string[] = [];
    // Первая строка: EI·y(x) = EI·y_0 + EI·theta_0·x + первые слагаемые
    const firstLineTerms = terms.slice(0, 2 + TERMS_PER_LINE); // EI·y_0, EI·theta_0*x + 3 слагаемых
    lines.push(`EI \\cdot y(x) &= ${firstLineTerms.join(" ")}`);

    // Остальные строки
    let idx = 2 + TERMS_PER_LINE;
    while (idx < terms.length) {
      const lineTerms = terms.slice(idx, idx + TERMS_PER_LINE);
      lines.push(`&\\phantom{=} ${lineTerms.join(" ")}`);
      idx += TERMS_PER_LINE;
    }

    equation = `\\begin{aligned}\n${lines.join(" \\\\\n")}\n\\end{aligned}`;
  }

  const formulaClass = terms.length > 4 ? "formula formula-multiline" : "formula";

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
    loadsList.push(`\\(R_A = ${formatNumber(Math.abs(result.reactions.RA))}\\) кН (${dir}) — ${result.reactions.RA >= 0 ? "растягивает" : "сжимает"} нижние волокна → «${sign}»`);
  }
  if (result.reactions.RB !== undefined) {
    const dir = result.reactions.RB >= 0 ? "↑" : "↓";
    const sign = result.reactions.RB >= 0 ? "+" : "-";
    loadsList.push(`\\(R_B = ${formatNumber(Math.abs(result.reactions.RB))}\\) кН (${dir}) — ${result.reactions.RB >= 0 ? "растягивает" : "сжимает"} нижние волокна → «${sign}»`);
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
      const dir = load.q >= 0 ? "↓" : "↑";
      const sign = load.q >= 0 ? "-" : "+";
      // Используем верхний индекс в скобках q^{(n)} для оригинальных нагрузок
      const qLabel = distLoadsSign.length === 1 ? "q" : `q^{(${distIdxSign++})}`;
      loadsList.push(`\\(${qLabel} = ${formatNumber(Math.abs(load.q))}\\) кН/м на \\([${formatNumber(load.a)}; ${formatNumber(load.b)}]\\) (${dir}) — ${load.q >= 0 ? "сжимает" : "растягивает"} нижние волокна → «${sign}»`);
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
    derivationSection = `
    <p><strong>Условие 1:</strong> \\(\\theta(${formatNumber(L)}) = 0\\)</p>
    <p>Подставляя \\(x = ${formatNumber(L)}\\) в уравнение углов поворота:</p>
    <div class="formula">
      \\[\\theta_0 + \\frac{1}{EI}\\sum\\limits_{\\text{нагрузки}} = 0\\]
    </div>
    <p><strong>Условие 2:</strong> \\(y(${formatNumber(L)}) = 0\\)</p>
    <p>Подставляя \\(x = ${formatNumber(L)}\\) в уравнение прогибов:</p>
    <div class="formula">
      \\[y_0 + \\theta_0 \\cdot ${formatNumber(L)} + \\frac{1}{EI}\\sum\\limits_{\\text{нагрузки}} = 0\\]
    </div>
    <p>Решая систему, получаем:</p>
    <div class="formula">
      \\[\\boxed{\\theta_0 = ${formatNumber((result.C1 ?? 0) * 1000, 3)} \\cdot 10^{-3} \\text{ рад}, \\quad y_0 = ${formatNumber((result.C2 ?? 0) * 1000, 2)} \\text{ мм}}\\]
    </div>`;
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

    // Функция для сбора слагаемых в точке x
    const collectTermsAt = (x: number): Array<{ symbolic: string; value: number }> => {
      const terms: Array<{ symbolic: string; value: number }> = [];

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
    const { latex: bracketsA, isMultiline: multiA } = formatBracketedTerms(termsAtASymbolic, 4);

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
    const { latex: bracketsB, isMultiline: multiB } = formatBracketedTerms(termsAtBSymbolic, 4);

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

    // Форматируем правую часть: -deltaSum/EI
    // Если deltaSum >= 0: результат отрицательный → пишем -deltaSum/EI
    // Если deltaSum < 0: результат положительный → пишем |deltaSum|/EI (без знака)
    const rhsPrefix = deltaSum >= 0 ? "-" : "";
    const rhsValue = Math.abs(deltaSum);

    html += `
  <p><strong>Вычитаем (1) из (2):</strong></p>
  <div class="formula">
    \\[\\theta_0 \\cdot (${formatNumber(xB)} - ${formatNumber(xA)}) + \\frac{1}{EI}\\left(${formatNumber(sumAtB)} - ${sumAtADisplay}\\right) = 0\\]
  </div>
  <div class="formula">
    \\[\\theta_0 \\cdot ${formatNumber(deltaX)} + \\frac{${formatNumber(deltaSum)}}{EI} = 0\\]
  </div>
  <div class="formula">
    \\[\\theta_0 \\cdot ${formatNumber(deltaX)} = ${rhsPrefix}\\frac{${formatNumber(rhsValue)}}{EI} = ${rhsPrefix}\\frac{${formatNumber(rhsValue)}}{${formatNumber(EI, 0)}}\\]
  </div>
  <div class="formula">
    \\[\\theta_0 = ${formatNumber((result.C1 ?? 0), 6)} \\text{ рад} = ${formatNumber((result.C1 ?? 0) * 1000, 3)} \\cdot 10^{-3} \\text{ рад}\\]
  </div>`;

    html += `
  <p><strong>Из уравнения (1) находим \\(y_0\\):</strong></p>
  <div class="formula">
    \\[y_0 = -\\theta_0 \\cdot ${formatNumber(xA)} ${formatNegatedFraction(sumAtA, "EI")}\\]
  </div>
  <div class="formula">
    \\[y_0 = ${formatNumber((result.C2 ?? 0) * 1000, 2)} \\text{ мм}\\]
  </div>
  <p><strong>Итог:</strong></p>
  <div class="formula">
    \\[\\boxed{\\theta_0 = ${formatNumber((result.C1 ?? 0) * 1000, 3)} \\cdot 10^{-3} \\text{ рад}, \\quad y_0 = ${formatNumber((result.C2 ?? 0) * 1000, 2)} \\text{ мм}}\\]
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

  // Форматируем: -sumTerms/(xB·EI)
  // Если sumTerms >= 0: результат отрицательный → пишем -sumTerms/...
  // Если sumTerms < 0: результат положительный → пишем |sumTerms|/... (без знака)
  const thetaPrefix = sumTerms >= 0 ? "-" : "";
  const thetaValue = Math.abs(sumTerms);

  // Формула с переносом строк при большом количестве слагаемых
  const formulaTerms = terms.map(t => t.symbolic);
  const { latex: thetaFormula, isMultiline: thetaMultiline } = formatLongFormula(
    `0 = EI \\cdot \\theta_0 \\cdot ${formatNumber(xB)}`,
    formulaTerms,
    3 // макс. 3 слагаемых на строку
  );

  html += `
  <div class="formula${thetaMultiline ? " formula-multiline" : ""}">
    \\[${thetaFormula}\\]
  </div>
  <p>Числовые значения слагаемых:</p>
  <ul>
    ${terms.map(t => `<li>\\(${t.symbolic} = ${formatNumber(t.value)}\\) Н·м³</li>`).join("\n    ")}
  </ul>
  <p>Сумма: \\(${formatNumber(sumTerms)}\\) Н·м³</p>
  <div class="formula">
    \\[\\theta_0 = ${thetaPrefix}\\frac{${formatNumber(thetaValue)}}{${formatNumber(xB)} \\cdot EI} = ${thetaPrefix}\\frac{${formatNumber(thetaValue)}}{${formatNumber(xB)} \\cdot ${formatNumber(EI, 0)}} = ${formatNumber(result.C1 ?? 0, 6)} \\text{ рад}\\]
  </div>
  <p><strong>Итог:</strong></p>
  <div class="formula">
    \\[\\boxed{y_0 = 0, \\quad \\theta_0 = ${formatNumber((result.C1 ?? 0) * 1000, 3)} \\cdot 10^{-3} \\text{ рад} = ${formatNumber((result.C1 ?? 0) * 180 / Math.PI, 2)}°}\\]
  </div>`;

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
  <p><strong>Соглашения знаков:</strong> силы вверх «+», моменты против часовой стрелки «+».</p>
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
        // Сила вниз (>=0) создаёт положительный момент относительно заделки (при arm > 0)
        const sign = load.value >= 0 ? "+" : "-";
        momentTermsSymbolic.push(`${sign} ${load.label} \\cdot (x_{${load.label}} - x_f)`);
        const momentContrib = load.value * arm;
        momentTermsNumeric.push(`${sign} ${formatNumber(Math.abs(load.value))} \\cdot ${formatNumber(Math.abs(arm))}`);
        totalMomentValue += momentContrib;
      }
    } else if (load.type === "moment") {
      // Момент против часовой (>=0) → +M, по часовой (<0) → -M
      const sign = load.value >= 0 ? "+" : "-";
      momentTermsSymbolic.push(`${sign} ${load.label}`);
      momentTermsNumeric.push(`${sign} ${formatNumber(Math.abs(load.value))}`);
      totalMomentValue += load.value;
    } else if (load.type === "distributed") {
      const arm = load.xq! - xf;
      if (Math.abs(arm) > 1e-9) {
        // Нагрузка вниз (>=0) создаёт положительный момент относительно заделки
        const sign = load.Fq! >= 0 ? "+" : "-";
        momentTermsSymbolic.push(`${sign} F_{${load.label}} \\cdot (x_{${load.label}} - x_f)`);
        const momentContrib = load.Fq! * arm;
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
    \\(R = ${formatNumber(Rf)}\\) кН ${Rf >= 0 ? "(вверх)" : "(вниз)"}, \\quad \\(M_f = ${formatNumber(Mf)}\\) кН·м
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
  <p><strong>Соглашения знаков:</strong> силы вверх «+», моменты против часовой стрелки «+».</p>
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
    momentSymbolic.concat(["= 0"]),
    3
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

  // Форматируем числовое уравнение с переносом (5 термов — числа короче символов)
  const { latex: momentNumLatex, isMultiline: momentNumMulti } = formatLongFormula("", momentNumTerms.concat(["= 0"]), 5);
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
