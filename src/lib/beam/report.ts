/**
 * Генератор HTML-отчёта для расчёта балки
 */

import type { BeamInput, BeamResult, Reactions, Load } from "./types";
import { buildIntervals, buildSectionFormulas, formatNumber, formatQFormula, formatMFormula } from "./sections";

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
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 20px;
      line-height: 1.7;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm 15mm;
      background: white;
      color: black;
    }
    h1 { font-size: 30px; text-align: center; margin-bottom: 28px; }
    h2 { font-size: 24px; margin-top: 32px; margin-bottom: 16px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    h3 { font-size: 22px; margin-top: 24px; margin-bottom: 12px; }
    table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 18px; }
    th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
    th { background: #f5f5f5; }
    .formula { margin: 12px 0; padding: 12px 0; font-size: 18px; }
    .result { color: #0066cc; font-weight: bold; }
    .extremes-block { break-inside: avoid; }
    .diagram-block { break-inside: avoid; margin: 24px 0; text-align: center; }
    .diagram-block img { max-width: 100%; height: auto; }
    .diagram-title { font-weight: bold; margin-bottom: 10px; font-size: 18px; }
    ul { margin: 10px 0; padding-left: 28px; }
    li { margin: 6px 0; }
    @media print {
      body { padding: 10mm; }
      .no-print { display: none; }
      h2 { page-break-after: avoid; }
      h3 { page-break-after: avoid; }
    }
    .print-btn {
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 12px 24px;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    .print-btn:hover { background: #0055aa; }
    .print-btn:disabled { background: #999; cursor: wait; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="prepareAndPrint()" id="printBtn">Сохранить PDF</button>

  <h1>Расчёт балки</h1>

  <h2>1. Расчётная схема</h2>
  <div style="text-align: center; margin-bottom: 20px;">
    ${beamSchemaSVG || generateBeamSVG(input, result)}
  </div>

  <h2>2. Исходные данные</h2>
  <table>
    <tr><th>Параметр</th><th>Значение</th></tr>
    <tr><td>Тип балки</td><td>${formatBeamType(input.beamType)}</td></tr>
    <tr><td>Длина балки \\(L\\)</td><td>\\(${formatNumber(input.L)}\\) м</td></tr>
    ${input.E ? `<tr><td>Модуль упругости \\(E\\)</td><td>\\(${formatNumber(input.E / 1e9)}\\) ГПа</td></tr>` : ""}
    ${input.I ? `<tr><td>Момент инерции \\(I\\)</td><td>\\(${formatNumber(input.I * 1e8)}\\) см⁴</td></tr>` : ""}
  </table>

  <h3>Нагрузки</h3>
  <table>
    <tr><th>Тип</th><th>Значение</th><th>Положение</th></tr>
    ${input.loads.map(load => {
      if (load.type === "distributed") {
        const dir = load.q >= 0 ? "↓" : "↑";
        return `<tr><td>Распределённая \\(q\\)</td><td>\\(${formatNumber(Math.abs(load.q))}\\) кН/м ${dir}</td><td>от \\(${formatNumber(load.a)}\\) до \\(${formatNumber(load.b)}\\) м</td></tr>`;
      } else if (load.type === "force") {
        const dir = load.F >= 0 ? "↓" : "↑";
        return `<tr><td>Сосредоточенная сила \\(F\\)</td><td>\\(${formatNumber(Math.abs(load.F))}\\) кН ${dir}</td><td>\\(x = ${formatNumber(load.x)}\\) м</td></tr>`;
      } else {
        const dir = load.M >= 0 ? "↺" : "↻";
        return `<tr><td>Момент \\(M\\)</td><td>\\(${formatNumber(Math.abs(load.M))}\\) кН·м ${dir}</td><td>\\(x = ${formatNumber(load.x)}\\) м</td></tr>`;
      }
    }).join("\n    ")}
  </table>

  ${(() => {
    const resultingLoads = computeResultingLoads(input);
    if (resultingLoads.length === 0) return "";

    // Проверяем, отличаются ли результирующие от исходных
    const distributedCount = input.loads.filter(l => l.type === "distributed").length;
    if (resultingLoads.length === distributedCount && distributedCount === 1) return ""; // Если одна нагрузка - таблица не нужна

    return `
  <h3>Результирующие распределённые нагрузки (на схеме)</h3>
  <p>При наложении нескольких распределённых нагрузок на одном участке они суммируются:</p>
  <table>
    <tr><th>Участок</th><th>Обозначение</th><th>Интенсивность</th><th>Направление</th><th>Границы участка</th></tr>
    ${resultingLoads.map((seg, i) =>
      `<tr><td>${i + 1}</td><td>\\(q_{${i + 1}}\\)</td><td>\\(${formatNumber(Math.abs(seg.q))}\\) кН/м</td><td>${seg.q >= 0 ? "↓ вниз" : "↑ вверх"}</td><td>от \\(${formatNumber(seg.a)}\\) до \\(${formatNumber(seg.b)}\\) м</td></tr>`
    ).join("\n    ")}
  </table>`;
  })()}

  <h2>3. Определение реакций опор</h2>
  ${buildReactionsSection(input, reactions)}

  <h2>4. Экстремальные значения</h2>
  <div class="extremes-block">
  <table>
    <tr><th>Величина</th><th>Значение</th><th>Координата</th></tr>
    <tr><td>\\(|Q|_{\\max}\\)</td><td class="result">${formatNumber(Math.abs(Qmax.value))} кН</td><td>\\(x = ${formatNumber(Qmax.x)}\\) м</td></tr>
    <tr><td>\\(|M|_{\\max}\\)</td><td class="result">${formatNumber(Math.abs(Mmax.value))} кН·м</td><td>\\(x = ${formatNumber(Mmax.x)}\\) м</td></tr>
    ${y ? `<tr><td>\\(|y|_{\\max}\\)</td><td class="result">${formatNumber(Math.abs(yMax.value) * 1000)} мм</td><td>\\(x = ${formatNumber(yMax.x)}\\) м</td></tr>` : ""}
  </table>
  </div>

  ${diagrams?.Q || diagrams?.M || diagrams?.y ? `
  <h2>5. Эпюры</h2>
  ${diagrams.Q ? `
  <div class="diagram-block">
    <div class="diagram-title">Эпюра поперечных сил \\(Q(x)\\)</div>
    <img src="${diagrams.Q}" alt="Эпюра Q(x)" />
  </div>
  ` : ""}
  ${diagrams.M ? `
  <div class="diagram-block">
    <div class="diagram-title">Эпюра изгибающих моментов \\(M(x)\\)</div>
    <img src="${diagrams.M}" alt="Эпюра M(x)" />
  </div>
  ` : ""}
  ${diagrams.y ? `
  <div class="diagram-block">
    <div class="diagram-title">Эпюра прогибов \\(y(x)\\)</div>
    <img src="${diagrams.y}" alt="Эпюра y(x)" />
  </div>
  ` : ""}
  ` : ""}

  ${(() => {
    const hasDiagrams = diagrams?.Q || diagrams?.M || diagrams?.y;
    const sectionNum = hasDiagrams ? 6 : 5;
    const W_cm3 = result.W ? formatNumber(result.W * 1e6, 4) : "";
    const d_mm = result.diameter ? formatNumber(result.diameter * 1000, 2) : "";
    return result.diameter && result.W && result.I ? `
  <h2>${sectionNum}. Подбор сечения (круглое)</h2>
  <p>По условию прочности: \\([\\sigma] = ${formatNumber((input.sigma ?? 0) / 1e6)}\\) МПа</p>
  <div class="formula">
    \\(W \\geq \\frac{|M|_{\\max}}{[\\sigma]} = \\frac{${formatNumber(Math.abs(Mmax.value) * 1000)}}{${formatNumber((input.sigma ?? 0) / 1e6)}} = ${W_cm3}\\) см³
  </div>
  <p>Для круглого сечения: \\(W = \\frac{\\pi d^3}{32}\\), откуда:</p>
  <div class="formula">
    \\(d_{\\min} = \\sqrt[3]{\\frac{32W}{\\pi}} = \\sqrt[3]{\\frac{32 \\cdot ${W_cm3}}{\\pi}} = ${d_mm}\\) мм
  </div>
  <p>Момент инерции:</p>
  <div class="formula">
    \\(I = \\frac{\\pi d^4}{64} = \\frac{\\pi \\cdot ${d_mm}^4}{64} = ${formatNumber(result.I * 1e8, 4)}\\) см⁴
  </div>
  ` : "";
  })()}

  <h2>${(() => {
    const hasDiagrams = diagrams?.Q || diagrams?.M || diagrams?.y;
    let num = 5;
    if (hasDiagrams) num++;
    if (result.diameter) num++;
    return num;
  })()}. Метод сечений — внутренние усилия по участкам</h2>

  <p>Разобьём балку на участки по характерным точкам (опоры, точки приложения нагрузок). Для каждого участка составим выражения для поперечной силы \\(Q\\) и изгибающего момента \\(M\\).</p>

  ${sections.map(section => `
  <h3>Участок ${section.interval.idx}: \\(x \\in [${formatNumber(section.interval.a)}; ${formatNumber(section.interval.b)}]\\) м</h3>

  <p>Введём локальную координату: \\(s = x - ${formatNumber(section.interval.a)}\\), где \\(s \\in [0; ${formatNumber(section.interval.b - section.interval.a)}]\\) м.</p>

  ${Math.abs(section.q) > 1e-9 ? `<p>На этом участке действует распределённая нагрузка \\(q = ${formatNumber(section.q)}\\) кН/м.</p>` : "<p>Распределённая нагрузка на участке отсутствует.</p>"}

  <p><strong>Поперечная сила:</strong></p>
  <div class="formula">
    \\(Q(s) = ${formatQFormula(section.polyQ)}\\) кН
  </div>

  <p><strong>Изгибающий момент:</strong></p>
  <div class="formula">
    \\(M(s) = ${formatMFormula(section.polyM)}\\) кН·м
  </div>

  <p><strong>Значения на границах участка:</strong></p>
  <ul>
    <li>При \\(x = ${formatNumber(section.interval.a)}^+\\): \\(Q = ${formatNumber(section.Qa)}\\) кН, \\(M = ${formatNumber(section.Ma)}\\) кН·м</li>
    <li>При \\(x = ${formatNumber(section.interval.b)}^-\\): \\(Q = ${formatNumber(section.Qb)}\\) кН, \\(M = ${formatNumber(section.Mb)}\\) кН·м</li>
  </ul>
  `).join("\n")}

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

      // Ждём рендер формул если ещё не готово
      if (!mathRendered) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Даём браузеру перерисовать
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
    \\(M_f ${momentTermsNumeric.join(" ")} = 0 \\quad \\Rightarrow \\quad \\boxed{M_f = ${formatNumber(Mf)} \\text{ кН·м}}\\)
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
        momentNumTerms.push(`${sign} ${formatNumber(Math.abs(load.value))} \\cdot ${formatNumber(arm)}`);
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
        momentNumTerms.push(`${sign} ${formatNumber(Math.abs(load.Fq!))} \\cdot ${formatNumber(arm)}`);
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

  // Проверка
  html += `
  <p><strong>Проверка:</strong></p>
  <div class="formula">
    \\(R_A + R_B = ${formatNumber(RA)} + (${formatNumber(RB)}) = ${formatNumber(RA + RB)}\\text{ кН}\\)
  </div>`;

  const checkResult = Math.abs(RA + RB - totalLoad) < 0.01;
  html += `
  <p>Сумма внешних сил: \\(${formatNumber(totalLoad)}\\) кН. ${checkResult ? "Проверка выполнена ✓" : "Расхождение!"}</p>`;

  return html;
}
