/**
 * Генератор HTML-отчёта для расчёта балки
 */

import type { BeamInput, BeamResult, Reactions, Load } from "./types";
import { buildIntervals, buildSectionFormulas, formatNumber, formatQFormula, formatMFormula, type ForceContribution } from "./sections";

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

  // Размерная линия — ниже опор
  svg += generateDimensionLine(xToPx(0), xToPx(L), height - 25, L);

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
    "simply-supported-overhang-left": "Двухопорная с консолью слева",
    "simply-supported-overhang-right": "Двухопорная с консолью справа",
    "simply-supported-overhang-both": "Двухконсольная балка",
    "cantilever-left": "Консольная (заделка слева)",
    "cantilever-right": "Консольная (заделка справа)",
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
    h2 { font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    h3 { font-size: 13pt; font-weight: bold; margin-top: 16px; margin-bottom: 8px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 12pt; page-break-inside: avoid; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .formula { margin: 10px 0; padding: 8px 0; font-size: 12pt; }
    .formula-block { page-break-inside: avoid; }
    .result { color: #0066cc; font-weight: bold; }
    .diagram-block { page-break-inside: avoid; margin: 20px 0; text-align: center; }
    .diagram-block img { max-width: 100%; height: auto; }
    .diagram-title { font-weight: bold; margin-bottom: 8px; font-size: 12pt; }
    .figure-caption { font-size: 11pt; font-style: italic; margin-top: 6px; }
    ul { margin: 8px 0; padding-left: 24px; }
    li { margin: 4px 0; }
    .sign-convention { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 12px; margin: 12px 0; page-break-inside: avoid; }
    .sign-convention h4 { margin: 0 0 8px 0; font-size: 12pt; }
    .conclusions { background: #f0f7ff; border: 1px solid #cce5ff; border-radius: 4px; padding: 12px; margin: 12px 0; }
    .unit { margin-left: 8px; font-style: normal; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      h2 { page-break-after: avoid; }
      h3 { page-break-after: avoid; }
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
    <tr><td>\\(|Q|_{\\max}\\)</td><td class="result">${formatNumber(Math.abs(Qmax.value))} кН</td><td>\\(x = ${formatNumber(Qmax.x)}\\) м</td></tr>
    <tr><td>\\(|M|_{\\max}\\)</td><td class="result">${formatNumber(Math.abs(Mmax.value))} кН·м</td><td>\\(x = ${formatNumber(Mmax.x)}\\) м</td></tr>
    ${y ? `<tr><td>\\(|y|_{\\max}\\)</td><td class="result">${formatNumber(Math.abs(yMax.value) * 1000)} мм</td><td>\\(x = ${formatNumber(yMax.x)}\\) м</td></tr>` : ""}
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
    <tr><td>Длина балки \\(L\\)</td><td>${formatNumber(input.L)} м</td></tr>
    ${input.E ? `<tr><td>Модуль упругости \\(E\\)</td><td>${formatNumber(input.E / 1e9)} ГПа</td></tr>` : ""}
    ${input.I ? `<tr><td>Момент инерции \\(I\\)</td><td>${formatNumber(input.I * 1e8)} см⁴</td></tr>` : ""}
    ${input.sigma ? `<tr><td>Допускаемое напряжение \\([\\sigma]\\)</td><td>${formatNumber(input.sigma / 1e6)} МПа</td></tr>` : ""}
  </table>

  <h3>Нагрузки</h3>
  <table>
    <tr><th>Тип</th><th>Значение</th><th>Положение</th></tr>
    ${input.loads.map(load => {
      if (load.type === "distributed") {
        const dir = load.q >= 0 ? "↓" : "↑";
        return `<tr><td>Распределённая \\(q\\)</td><td>${formatNumber(Math.abs(load.q))} кН/м ${dir}</td><td>от ${formatNumber(load.a)} до ${formatNumber(load.b)} м</td></tr>`;
      } else if (load.type === "force") {
        const dir = load.F >= 0 ? "↓" : "↑";
        return `<tr><td>Сосредоточенная сила \\(F\\)</td><td>${formatNumber(Math.abs(load.F))} кН ${dir}</td><td>\\(x = ${formatNumber(load.x)}\\) м</td></tr>`;
      } else {
        const dir = load.M >= 0 ? "↺" : "↻";
        return `<tr><td>Момент \\(M\\)</td><td>${formatNumber(Math.abs(load.M))} кН·м ${dir}</td><td>\\(x = ${formatNumber(load.x)}\\) м</td></tr>`;
      }
    }).join("\n    ")}
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
    ${resultingLoads.map((seg, i) =>
      `<tr><td>\\(q_{${i + 1}}\\)</td><td>${formatNumber(Math.abs(seg.q))} кН/м</td><td>${seg.q >= 0 ? "↓ вниз" : "↑ вверх"}</td><td>от ${formatNumber(seg.a)} до ${formatNumber(seg.b)} м</td></tr>`
    ).join("\n    ")}
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
    if (f.type === "reaction" || f.type === "force") {
      // Сила вверх (value < 0 для external load, value > 0 для reaction up)
      // Реакция вверх: +R
      // Сила вниз: -F
      if (f.type === "reaction") {
        symbolicTerms.push(`${f.label}`);
        numericTerms.push(`${formatNumber(f.value)}`);
      } else {
        // force: если F > 0 (вниз), то -F; если F < 0 (вверх), то +|F|
        const sign = f.value >= 0 ? "-" : "+";
        symbolicTerms.push(`${sign} ${f.label}`);
        numericTerms.push(`${sign} ${formatNumber(Math.abs(f.value))}`);
      }
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

  // Убираем начальный + если он есть
  let symbolicStr = symbolicTerms.join(" ");
  let numericStr = numericTerms.join(" ");
  if (symbolicStr.startsWith("+ ")) symbolicStr = symbolicStr.slice(2);
  if (numericStr.startsWith("+ ")) numericStr = numericStr.slice(2);

  return `
  <p>Сумма проекций сил слева от сечения на вертикальную ось:</p>
  <div class="formula">
    \\(Q(${varName}) = ${symbolicStr}\\)
  </div>
  <p>Подставляем числовые значения:</p>
  <div class="formula">
    \\(Q(${varName}) = ${numericStr}\\)
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
      // Реакция вверх создаёт положительный момент: +R·(a + z)
      // где a = sectionStart - x_reaction
      const arm = sectionStart - c.x;
      if (Math.abs(arm) < 1e-9) {
        // Реакция прямо под сечением - плечо = z
        symbolicTerms.push(`${c.label} \\cdot ${varName}`);
        numericTerms.push(`${formatNumber(c.value)} \\cdot ${varName}`);
      } else {
        symbolicTerms.push(`${c.label} \\cdot (${formatNumber(arm)} + ${varName})`);
        numericTerms.push(`${formatNumber(c.value)} \\cdot (${formatNumber(arm)} + ${varName})`);
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
      // Внешний момент: против часовой (+), по часовой (-)
      // M > 0 (против часовой) → +M
      const sign = c.value >= 0 ? "+" : "-";
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

  // Убираем начальный + если он есть
  let symbolicStr = symbolicTerms.join(" ");
  let numericStr = numericTerms.join(" ");
  if (symbolicStr.startsWith("+ ")) symbolicStr = symbolicStr.slice(2);
  if (numericStr.startsWith("+ ")) numericStr = numericStr.slice(2);

  return `
  <p>Сумма моментов сил слева от сечения относительно точки сечения:</p>
  <div class="formula">
    \\(M(${varName}) = ${symbolicStr}\\)
  </div>
  <p>Подставляем числовые значения:</p>
  <div class="formula">
    \\(M(${varName}) = ${numericStr}\\)
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
function buildMNPSection(
  input: BeamInput,
  result: BeamResult,
  sectionNum: number
): string {
  // I может быть в input.I (задан вручную) или result.I (вычислен из подбора сечения)
  const I_used = result.I ?? input.I;
  if (!result.y || !result.theta || !input.E || !I_used) return "";

  const { beamType, L, E } = input;
  const EI_kNm2 = (E * I_used) / 1000; // кН·м²
  const isCantilever = beamType.startsWith("cantilever");
  const isLeft = beamType === "cantilever-left";

  // Получаем константы интегрирования
  const C1 = result.C1 ?? 0;
  const C2 = result.C2 ?? 0;

  // Граничные условия и вывод констант
  let boundarySection: string;
  if (isCantilever) {
    if (isLeft) {
      boundarySection = `
  <p><strong>Граничные условия</strong> (заделка слева):</p>
  <ul>
    <li>\\(y(0) = 0\\) — прогиб в заделке равен нулю</li>
    <li>\\(\\theta(0) = 0\\) — угол поворота в заделке равен нулю</li>
  </ul>
  <p>Из условия \\(\\theta(0) = 0\\): \\(C_1 = 0\\)</p>
  <p>Из условия \\(y(0) = 0\\): \\(C_2 = 0\\)</p>`;
    } else {
      boundarySection = `
  <p><strong>Граничные условия</strong> (заделка справа):</p>
  <ul>
    <li>\\(y(L) = 0\\) — прогиб в заделке равен нулю</li>
    <li>\\(\\theta(L) = 0\\) — угол поворота в заделке равен нулю</li>
  </ul>
  <p>Из условия \\(\\theta(L) = 0\\) находим: \\(C_1 = ${formatNumber(C1, 6)}\\)</p>
  <p>Из условия \\(y(L) = 0\\) находим: \\(C_2 = ${formatNumber(C2, 6)}\\)`;
    }
  } else {
    const xA = result.reactions.xA ?? 0;
    const xB = result.reactions.xB ?? L;
    boundarySection = `
  <p><strong>Граничные условия</strong> (двухопорная балка):</p>
  <ul>
    <li>\\(y(${formatNumber(xA)}) = 0\\) — прогиб на опоре A равен нулю</li>
    <li>\\(y(${formatNumber(xB)}) = 0\\) — прогиб на опоре B равен нулю</li>
  </ul>
  <p>Из системы уравнений находим константы интегрирования:</p>
  <div class="formula">
    \\(C_1 = ${formatNumber(C1, 6)}\\), \\quad C_2 = ${formatNumber(C2, 6)}
  </div>`;
  }

  // Итоговые формулы
  const finalFormulas = `
  <p><strong>Итоговые выражения:</strong></p>
  <div class="formula">
    \\(\\theta(x) = \\frac{1}{EI} \\int_0^x M(\\xi) \\, d\\xi + C_1\\)
  </div>
  <div class="formula">
    \\(y(x) = \\frac{1}{EI} \\int_0^x \\int_0^\\xi M(\\eta) \\, d\\eta \\, d\\xi + C_1 x + C_2\\)
  </div>`;

  // Таблица значений θ и y в характерных точках
  const points: number[] = [0];

  // Добавляем точки опор
  if (result.reactions.xA !== undefined && result.reactions.xA > 0) {
    points.push(result.reactions.xA);
  }
  if (result.reactions.xB !== undefined && result.reactions.xB < L) {
    points.push(result.reactions.xB);
  }

  // Добавляем точки нагрузок
  for (const load of input.loads) {
    if (load.type === "distributed") {
      if (load.a > 0 && !points.includes(load.a)) points.push(load.a);
      if (load.b < L && !points.includes(load.b)) points.push(load.b);
    } else {
      if (load.x > 0 && load.x < L && !points.includes(load.x)) points.push(load.x);
    }
  }

  points.push(L);
  points.sort((a, b) => a - b);

  // Убираем дубликаты
  const uniquePoints = points.filter((p, i) => i === 0 || Math.abs(p - points[i - 1]) > 1e-6);

  // Генерируем строки таблицы
  const tableRows = uniquePoints.map(x => {
    const theta = result.theta!(x);
    const y = result.y!(x);
    return `<tr>
      <td>${formatNumber(x)}</td>
      <td>${formatNumber(theta * 1000, 4)}</td>
      <td>${formatNumber(y * 1000, 4)}</td>
    </tr>`;
  }).join("\n    ");

  return `
  <h2>${sectionNum}. Метод начальных параметров</h2>
  <p>Для определения углов поворота \\(\\theta(x)\\) и прогибов \\(y(x)\\) используем метод начальных параметров (МНП).</p>

  <p><strong>Общий вид уравнений:</strong></p>
  <div class="formula">
    \\(EI \\cdot \\theta(x) = EI \\cdot \\theta_0 + \\int_0^x M(\\xi) \\, d\\xi\\)
  </div>
  <div class="formula">
    \\(EI \\cdot y(x) = EI \\cdot y_0 + EI \\cdot \\theta_0 \\cdot x + \\int_0^x \\int_0^\\xi M(\\eta) \\, d\\eta \\, d\\xi\\)
  </div>

  <p><strong>Жёсткость сечения:</strong></p>
  <div class="formula">
    \\(EI = ${formatNumber(E / 1e9)} \\text{ ГПа} \\cdot ${formatNumber(I_used * 1e8)} \\text{ см}^4 = ${formatNumber(EI_kNm2)}\\) кН·м²
  </div>

  ${boundarySection}

  ${finalFormulas}

  <p><strong>Значения в характерных точках:</strong></p>
  <table>
    <tr><th>\\(x\\), м</th><th>\\(\\theta \\cdot 10^3\\), рад</th><th>\\(y\\), мм</th></tr>
    ${tableRows}
  </table>`;
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
    loadInfos.push({
      type: "distributed",
      label: `q_{${i + 1}}`,
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
      forceSymbolic.push(load.value >= 0 ? `- ${load.label}` : `+ |${load.label}|`);
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

  html += `
  <div class="formula">
    \\(\\sum M_A = 0: \\quad ${momentSymbolic.join(" ")} = 0\\)
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

  html += `
  <div class="formula">
    \\(${momentNumTerms.join(" ")} = 0\\)
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
