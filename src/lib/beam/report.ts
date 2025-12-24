/**
 * Генератор HTML-отчёта для расчёта балки
 */

import type { BeamInput, BeamResult, Reactions, Load } from "./types";
import { buildIntervals, buildSectionFormulas, formatNumber, formatQFormula, formatMFormula } from "./sections";

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

interface ReportData {
  input: BeamInput;
  result: BeamResult;
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
  const { reactions } = result;

  // Размеры SVG
  const width = 600;
  const height = 200;
  const padding = { left: 60, right: 40, top: 60, bottom: 60 };
  const beamY = height / 2;
  const beamThickness = 12;

  // Масштаб
  const scale = (width - padding.left - padding.right) / L;
  const xToPx = (x: number) => padding.left + x * scale;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background: ${SVG_COLORS.background}; border: 1px solid #e5e7eb; border-radius: 4px;">`;

  // Маркеры для стрелок
  svg += `
    <defs>
      <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="${SVG_COLORS.distributedLoad}"/>
      </marker>
      <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="${SVG_COLORS.pointForce}"/>
      </marker>
      <marker id="arrowPurple" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="${SVG_COLORS.moment}"/>
      </marker>
      <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="${SVG_COLORS.reaction}"/>
      </marker>
    </defs>
  `;

  // Балка
  svg += `<rect x="${xToPx(0)}" y="${beamY - beamThickness / 2}" width="${xToPx(L) - xToPx(0)}" height="${beamThickness}" fill="${SVG_COLORS.beam}" rx="2"/>`;

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

  // Распределённые нагрузки
  const distributedLoads = loads.filter((l): l is Extract<Load, { type: "distributed" }> => l.type === "distributed");
  for (const load of distributedLoads) {
    svg += generateDistributedLoad(xToPx(load.a), xToPx(load.b), beamY - beamThickness / 2, load.q);
  }

  // Сосредоточенные силы
  const forces = loads.filter((l): l is Extract<Load, { type: "force" }> => l.type === "force");
  for (const load of forces) {
    svg += generatePointForce(xToPx(load.x), beamY - beamThickness / 2, load.F);
  }

  // Моменты
  const moments = loads.filter((l): l is Extract<Load, { type: "moment" }> => l.type === "moment");
  for (const load of moments) {
    svg += generateMoment(xToPx(load.x), beamY, load.M);
  }

  // Размерная линия
  svg += generateDimensionLine(xToPx(0), xToPx(L), beamY + 70, L);

  // Подписи опор
  const isSimplySupported = beamType.startsWith("simply-supported");
  if (isSimplySupported) {
    const pinSupport = supports.find(s => s.type === "pin");
    const rollerSupport = supports.find(s => s.type === "roller");
    if (pinSupport) {
      svg += `<text x="${xToPx(pinSupport.x)}" y="${beamY + 85}" text-anchor="middle" fill="${SVG_COLORS.text}" font-size="14" font-weight="bold">A</text>`;
    }
    if (rollerSupport) {
      svg += `<text x="${xToPx(rollerSupport.x)}" y="${beamY + 85}" text-anchor="middle" fill="${SVG_COLORS.text}" font-size="14" font-weight="bold">B</text>`;
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
  const arrowLen = 25;
  const numArrows = Math.max(3, Math.floor((x2 - x1) / 40));
  let svg = "";

  if (q >= 0) {
    // Сверху вниз
    const baseY = beamTopY;
    svg += `<line x1="${x1}" y1="${baseY - arrowLen}" x2="${x2}" y2="${baseY - arrowLen}" stroke="${SVG_COLORS.distributedLoad}" stroke-width="2"/>`;

    for (let i = 0; i < numArrows; i++) {
      const px = x1 + (i / (numArrows - 1)) * (x2 - x1);
      svg += `<line x1="${px}" y1="${baseY - arrowLen}" x2="${px}" y2="${baseY - 6}" stroke="${SVG_COLORS.distributedLoad}" stroke-width="2" marker-end="url(#arrowBlue)"/>`;
    }

    svg += `<text x="${(x1 + x2) / 2}" y="${baseY - arrowLen - 6}" text-anchor="middle" fill="${SVG_COLORS.distributedLoad}" font-size="11" font-weight="600">q = ${Math.abs(q)} кН/м</text>`;
  } else {
    // Снизу вверх
    const baseY = beamTopY + 12; // beamBottom
    svg += `<line x1="${x1}" y1="${baseY + arrowLen}" x2="${x2}" y2="${baseY + arrowLen}" stroke="${SVG_COLORS.distributedLoad}" stroke-width="2"/>`;

    for (let i = 0; i < numArrows; i++) {
      const px = x1 + (i / (numArrows - 1)) * (x2 - x1);
      svg += `<line x1="${px}" y1="${baseY + arrowLen}" x2="${px}" y2="${baseY + 6}" stroke="${SVG_COLORS.distributedLoad}" stroke-width="2"/>`;
    }

    svg += `<text x="${(x1 + x2) / 2}" y="${baseY + arrowLen + 14}" text-anchor="middle" fill="${SVG_COLORS.distributedLoad}" font-size="11" font-weight="600">q = ${Math.abs(q)} кН/м</text>`;
  }

  return svg;
}

/**
 * Генерирует SVG для сосредоточенной силы
 */
function generatePointForce(x: number, y: number, F: number): string {
  const arrowLen = 50;
  let svg = "";

  if (F >= 0) {
    // Вниз
    svg += `<line x1="${x}" y1="${y - arrowLen}" x2="${x}" y2="${y - 6}" stroke="${SVG_COLORS.pointForce}" stroke-width="2" marker-end="url(#arrowRed)"/>`;
    svg += `<text x="${x + 8}" y="${y - arrowLen - 4}" fill="${SVG_COLORS.pointForce}" font-size="11" font-weight="600">F = ${Math.abs(F)} кН</text>`;
  } else {
    // Вверх
    svg += `<line x1="${x}" y1="${y + 50}" x2="${x}" y2="${y + 20}" stroke="${SVG_COLORS.pointForce}" stroke-width="2" marker-end="url(#arrowRed)"/>`;
    svg += `<text x="${x + 8}" y="${y + 60}" fill="${SVG_COLORS.pointForce}" font-size="11" font-weight="600">F = ${Math.abs(F)} кН</text>`;
  }

  return svg;
}

/**
 * Генерирует SVG для момента
 */
function generateMoment(x: number, y: number, M: number): string {
  const R = 16;
  const H = 30;
  const gap = 5;
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
  svg += `<line x1="${x}" y1="${y - gap}" x2="${x1}" y2="${y1}" stroke="${SVG_COLORS.moment}" stroke-width="2"/>`;

  // Дуга
  const sweepFlag = isCW ? 1 : 0;
  svg += `<path d="M ${x1} ${y1} A ${R} ${R} 0 0 ${sweepFlag} ${x2} ${y2}" fill="none" stroke="${SVG_COLORS.moment}" stroke-width="2" marker-end="url(#arrowPurple)"/>`;

  // Подпись
  svg += `<text x="${x + 25}" y="${Cy}" fill="${SVG_COLORS.moment}" font-size="11" font-weight="600">M = ${Math.abs(M)} кН·м</text>`;

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
  const { input, result } = data;
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
      font-size: 14px;
      line-height: 1.6;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm 15mm;
      background: white;
      color: black;
    }
    h1 { font-size: 18px; text-align: center; margin-bottom: 20px; }
    h2 { font-size: 16px; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    h3 { font-size: 14px; margin-top: 16px; margin-bottom: 8px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .formula { margin: 8px 0; padding: 8px; background: #f9f9f9; border-radius: 4px; }
    .result { color: #0066cc; font-weight: bold; }
    .section-block { margin: 16px 0; padding: 12px; border: 1px solid #ddd; border-radius: 4px; }
    .section-title { font-weight: bold; margin-bottom: 8px; }
    @media print {
      body { padding: 10mm; }
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
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Сохранить PDF</button>

  <h1>Расчёт балки</h1>

  <h2>1. Расчётная схема</h2>
  <div style="margin: 16px 0; text-align: center;">
    ${generateBeamSVG(input, result)}
  </div>

  <h2>2. Исходные данные</h2>
  <table>
    <tr><th>Параметр</th><th>Значение</th></tr>
    <tr><td>Тип балки</td><td>${formatBeamType(input.beamType)}</td></tr>
    <tr><td>Длина балки \\(L\\)</td><td>${formatNumber(input.L)} м</td></tr>
    ${input.E ? `<tr><td>Модуль упругости \\(E\\)</td><td>${formatNumber(input.E / 1e9)} ГПа</td></tr>` : ""}
    ${input.I ? `<tr><td>Момент инерции \\(I\\)</td><td>${formatNumber(input.I * 1e8)} см⁴</td></tr>` : ""}
  </table>

  <h3>Нагрузки</h3>
  <table>
    <tr><th>Тип</th><th>Значение</th><th>Положение</th></tr>
    ${input.loads.map(load => {
      if (load.type === "distributed") {
        return `<tr><td>Распределённая \\(q\\)</td><td>${formatNumber(load.q)} кН/м</td><td>от ${formatNumber(load.a)} до ${formatNumber(load.b)} м</td></tr>`;
      } else if (load.type === "force") {
        return `<tr><td>Сосредоточенная сила \\(F\\)</td><td>${formatNumber(load.F)} кН</td><td>\\(x = ${formatNumber(load.x)}\\) м</td></tr>`;
      } else {
        return `<tr><td>Момент \\(M\\)</td><td>${formatNumber(load.M)} кН·м</td><td>\\(x = ${formatNumber(load.x)}\\) м</td></tr>`;
      }
    }).join("\n    ")}
  </table>

  <h2>3. Реакции опор</h2>
  ${buildReactionsSection(reactions)}

  <h2>4. Экстремальные значения</h2>
  <table>
    <tr><th>Величина</th><th>Значение</th><th>Координата</th></tr>
    <tr><td>\\(|Q|_{\\max}\\)</td><td class="result">${formatNumber(Math.abs(Qmax.value))} кН</td><td>\\(x = ${formatNumber(Qmax.x)}\\) м</td></tr>
    <tr><td>\\(|M|_{\\max}\\)</td><td class="result">${formatNumber(Math.abs(Mmax.value))} кН·м</td><td>\\(x = ${formatNumber(Mmax.x)}\\) м</td></tr>
    ${y ? `<tr><td>\\(|y|_{\\max}\\)</td><td class="result">${formatNumber(Math.abs(yMax.value) * 1000)} мм</td><td>\\(x = ${formatNumber(yMax.x)}\\) м</td></tr>` : ""}
  </table>

  ${result.diameter && result.W && result.I ? `
  <h2>5. Подбор сечения (круглое)</h2>
  <p>По условию прочности: \\([\\sigma] = ${formatNumber((input.sigma ?? 0) / 1e6)}\\) МПа</p>
  <div class="formula">
    \\(W \\geq \\frac{|M|_{\\max}}{[\\sigma]} = \\frac{${formatNumber(Math.abs(Mmax.value) * 1000)}}{${formatNumber((input.sigma ?? 0) / 1e6)}} = ${formatNumber(result.W * 1e6, 4)}\\) см³
  </div>
  <p>Для круглого сечения: \\(W = \\frac{\\pi d^3}{32}\\), откуда:</p>
  <div class="formula">
    \\(d_{\\min} = \\sqrt[3]{\\frac{32 W}{\\pi}} = ${formatNumber(result.diameter * 1000)}\\) мм
  </div>
  <p>Момент инерции:</p>
  <div class="formula">
    \\(I = \\frac{\\pi d^4}{64} = ${formatNumber(result.I * 1e8, 4)}\\) см⁴
  </div>
  ` : ""}

  <h2>${result.diameter ? "6" : "5"}. Метод сечений — формулы по участкам</h2>
  ${sections.map(section => `
    <div class="section-block">
      <div class="section-title">Участок ${section.interval.idx}: \\(x \\in [${formatNumber(section.interval.a)}; ${formatNumber(section.interval.b)}]\\) м</div>
      <p>Локальная координата: \\(s = x - ${formatNumber(section.interval.a)}\\), \\(s \\in [0; ${formatNumber(section.interval.b - section.interval.a)}]\\)</p>
      ${Math.abs(section.q) > 1e-9 ? `<p>Активная распределённая нагрузка: \\(q = ${formatNumber(section.q)}\\) кН/м</p>` : ""}
      <div class="formula">
        \\(Q(s) = ${formatQFormula(section.polyQ)}\\) кН
      </div>
      <div class="formula">
        \\(M(s) = ${formatMFormula(section.polyM)}\\) кН·м
      </div>
      <p>Значения на границах:</p>
      <ul>
        <li>\\(Q(${formatNumber(section.interval.a)}^+) = ${formatNumber(section.Qa)}\\) кН, \\(M(${formatNumber(section.interval.a)}^+) = ${formatNumber(section.Ma)}\\) кН·м</li>
        <li>\\(Q(${formatNumber(section.interval.b)}^-) = ${formatNumber(section.Qb)}\\) кН, \\(M(${formatNumber(section.interval.b)}^-) = ${formatNumber(section.Mb)}\\) кН·м</li>
      </ul>
    </div>
  `).join("\n")}

  <script>
    document.addEventListener("DOMContentLoaded", function() {
      renderMathInElement(document.body, {
        delimiters: [
          {left: "\\\\(", right: "\\\\)", display: false},
          {left: "\\\\[", right: "\\\\]", display: true}
        ],
        throwOnError: false
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Генерирует секцию с реакциями
 */
function buildReactionsSection(reactions: Reactions): string {
  const rows: string[] = [];

  if (reactions.RA !== undefined) {
    rows.push(`<tr><td>\\(R_A\\)</td><td class="result">${formatNumber(reactions.RA)} кН</td><td>\\(x = ${formatNumber(reactions.xA ?? 0)}\\) м</td></tr>`);
  }
  if (reactions.RB !== undefined) {
    rows.push(`<tr><td>\\(R_B\\)</td><td class="result">${formatNumber(reactions.RB)} кН</td><td>\\(x = ${formatNumber(reactions.xB ?? 0)}\\) м</td></tr>`);
  }
  if (reactions.Rf !== undefined) {
    rows.push(`<tr><td>\\(R\\)</td><td class="result">${formatNumber(reactions.Rf)} кН</td><td>\\(x = ${formatNumber(reactions.xf ?? 0)}\\) м</td></tr>`);
  }
  if (reactions.Mf !== undefined) {
    rows.push(`<tr><td>\\(M_f\\)</td><td class="result">${formatNumber(reactions.Mf)} кН·м</td><td>\\(x = ${formatNumber(reactions.xf ?? 0)}\\) м</td></tr>`);
  }

  return `
  <table>
    <tr><th>Реакция</th><th>Значение</th><th>Координата</th></tr>
    ${rows.join("\n    ")}
  </table>`;
}
