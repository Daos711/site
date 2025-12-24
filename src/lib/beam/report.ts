/**
 * Генератор HTML-отчёта для расчёта балки
 */

import type { BeamInput, BeamResult, Reactions } from "./types";
import { buildIntervals, buildSectionFormulas, formatNumber, formatQFormula, formatMFormula } from "./sections";

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

  <h2>1. Исходные данные</h2>
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

  <h2>2. Реакции опор</h2>
  ${buildReactionsSection(reactions)}

  <h2>3. Экстремальные значения</h2>
  <table>
    <tr><th>Величина</th><th>Значение</th><th>Координата</th></tr>
    <tr><td>\\(|Q|_{\\max}\\)</td><td class="result">${formatNumber(Math.abs(Qmax.value))} кН</td><td>\\(x = ${formatNumber(Qmax.x)}\\) м</td></tr>
    <tr><td>\\(|M|_{\\max}\\)</td><td class="result">${formatNumber(Math.abs(Mmax.value))} кН·м</td><td>\\(x = ${formatNumber(Mmax.x)}\\) м</td></tr>
    ${y ? `<tr><td>\\(|y|_{\\max}\\)</td><td class="result">${formatNumber(Math.abs(yMax.value) * 1000)} мм</td><td>\\(x = ${formatNumber(yMax.x)}\\) м</td></tr>` : ""}
  </table>

  <h2>4. Метод сечений — формулы по участкам</h2>
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
