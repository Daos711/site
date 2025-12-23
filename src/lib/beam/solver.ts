import { macaulay, macaulayIntegral, macaulayDoubleIntegral } from "./macaulay";
import type {
  BeamInput,
  BeamResult,
  Reactions,
  Load,
  DistributedLoad,
  PointForce,
  PointMoment,
} from "./types";

/**
 * Основной решатель балки
 */
export function solveBeam(input: BeamInput): BeamResult {
  const { L, beamType, loads } = input;

  // Вычисляем реакции
  const reactions = computeReactions(input);

  // Собираем все точки событий (разрывы, перегибы)
  const events = collectEvents(input, reactions);

  // Создаём функции Q(x) и M(x)
  const Q = createQFunction(input, reactions);
  const M = createMFunction(input, reactions);

  // Находим экстремумы
  const Mmax = findExtremum(M, events, L);
  const Qmax = findExtremum(Q, events, L, true);

  // Прогибы (если заданы E и I)
  let theta: ((x: number) => number) | undefined;
  let y: ((x: number) => number) | undefined;

  if (input.E && input.I) {
    const deflectionResult = computeDeflections(input, reactions, M);
    theta = deflectionResult.theta;
    y = deflectionResult.y;
  }

  return {
    reactions,
    Q,
    M,
    theta,
    y,
    Mmax,
    Qmax,
    events,
  };
}

/**
 * Вычисление реакций опор
 *
 * Конвенция знаков (инженерная):
 * - q, F: положительные = вниз (по направлению силы тяжести)
 * - M: положительный = против часовой стрелки
 * - Реакции: положительные = вверх
 */
function computeReactions(input: BeamInput): Reactions {
  const { L, beamType, loads, supports } = input;

  // Суммы от нагрузок (инвертируем q и F, так как + = вниз)
  let sumF = 0; // сумма вертикальных сил (в нашей системе + вверх)
  let sumM0 = 0; // сумма моментов относительно x=0

  for (const load of loads) {
    if (load.type === "distributed") {
      const { q, a, b } = load;
      const length = b - a;
      // q положительный = вниз, в формулах нужен отрицательный
      const resultant = -q * length;
      const arm = (a + b) / 2;
      sumF += resultant;
      sumM0 += resultant * arm;
    } else if (load.type === "force") {
      // F положительный = вниз, в формулах нужен отрицательный
      sumF -= load.F;
      sumM0 -= load.F * load.x;
    } else if (load.type === "moment") {
      sumM0 += load.M; // момент: + = против часовой (оставляем)
    }
  }

  if (beamType === "simply-supported") {
    // Двухопорная балка
    const xA = supports.find((s) => s.type === "pin")?.x ?? 0;
    const xB = supports.find((s) => s.type === "roller")?.x ?? L;

    // Моменты относительно A
    let sumMA = 0;
    for (const load of loads) {
      if (load.type === "distributed") {
        const { q, a, b } = load;
        const length = b - a;
        const resultant = -q * length; // инверсия
        const arm = (a + b) / 2 - xA;
        sumMA += resultant * arm;
      } else if (load.type === "force") {
        sumMA -= load.F * (load.x - xA); // инверсия
      } else if (load.type === "moment") {
        sumMA += load.M;
      }
    }

    const RB = -sumMA / (xB - xA);
    const RA = -sumF - RB;

    return { RA, RB, xA, xB };
  } else if (beamType === "cantilever-left") {
    // Заделка слева (x = 0)
    const xf = 0;
    const Rf = -sumF;
    const Mf = -sumM0;

    return { Rf, Mf, xf };
  } else {
    // Заделка справа (x = L)
    const xf = L;

    // Моменты относительно заделки
    let sumMf = 0;
    for (const load of loads) {
      if (load.type === "distributed") {
        const { q, a, b } = load;
        const length = b - a;
        const resultant = -q * length; // инверсия
        const arm = (a + b) / 2 - xf;
        sumMf += resultant * arm;
      } else if (load.type === "force") {
        sumMf -= load.F * (load.x - xf); // инверсия
      } else if (load.type === "moment") {
        sumMf += load.M;
      }
    }

    const Rf = -sumF;
    const Mf = -sumMf;

    return { Rf, Mf, xf };
  }
}

/**
 * Создание функции Q(x) через Маколея
 * Конвенция: q, F положительные = вниз (инвертируем в формулах)
 */
function createQFunction(
  input: BeamInput,
  reactions: Reactions
): (x: number) => number {
  const { loads, beamType } = input;

  return (x: number): number => {
    let Q = 0;

    // Реакции (уже с правильным знаком: + = вверх)
    if (beamType === "simply-supported") {
      if (reactions.xA !== undefined && reactions.RA !== undefined) {
        Q += reactions.RA * macaulay(x, reactions.xA, 0);
      }
      if (reactions.xB !== undefined && reactions.RB !== undefined) {
        Q += reactions.RB * macaulay(x, reactions.xB, 0);
      }
    } else {
      if (reactions.xf !== undefined && reactions.Rf !== undefined) {
        Q += reactions.Rf * macaulay(x, reactions.xf, 0);
      }
    }

    // Нагрузки (инвертируем: пользователь вводит + = вниз)
    for (const load of loads) {
      if (load.type === "distributed") {
        const { q, a, b } = load;
        // Q от q: линейное изменение на участке [a, b]
        // Минус, потому что q+ = вниз
        if (x >= a && x < b) {
          Q -= q * (x - a);
        } else if (x >= b) {
          Q -= q * (b - a);
        }
      } else if (load.type === "force") {
        // Минус, потому что F+ = вниз
        Q -= load.F * macaulay(x, load.x, 0);
      }
    }

    return Q;
  };
}

/**
 * Создание функции M(x) через Маколея
 * Конвенция: q, F положительные = вниз (инвертируем в формулах)
 */
function createMFunction(
  input: BeamInput,
  reactions: Reactions
): (x: number) => number {
  const { loads, beamType } = input;

  return (x: number): number => {
    let M = 0;

    // Вклад реакций (уже с правильным знаком: + = вверх)
    if (beamType === "simply-supported") {
      if (reactions.xA !== undefined && reactions.RA !== undefined) {
        M += reactions.RA * macaulay(x, reactions.xA, 1);
      }
      if (reactions.xB !== undefined && reactions.RB !== undefined) {
        M += reactions.RB * macaulay(x, reactions.xB, 1);
      }
    } else {
      if (reactions.xf !== undefined) {
        if (reactions.Rf !== undefined) {
          M += reactions.Rf * macaulay(x, reactions.xf, 1);
        }
        if (reactions.Mf !== undefined) {
          // Знак минус: реакция момента в заделке противодействует внешним нагрузкам,
          // поэтому её вклад во внутренний момент отрицателен
          M -= reactions.Mf * macaulay(x, reactions.xf, 0);
        }
      }
    }

    // Вклад нагрузок (инвертируем: пользователь вводит + = вниз)
    for (const load of loads) {
      if (load.type === "distributed") {
        const { q, a, b } = load;
        // M от распределённой: -(q/2) * (<x-a>^2 - <x-b>^2)
        // Минус, потому что q+ = вниз
        M -= (q / 2) * (macaulay(x, a, 2) - macaulay(x, b, 2));
      } else if (load.type === "force") {
        // Минус, потому что F+ = вниз
        M -= load.F * macaulay(x, load.x, 1);
      } else if (load.type === "moment") {
        // Внешний момент даёт скачок ВНИЗ на M в эпюре изгибающих моментов
        // (момент против часовой стрелки = +M в уравнении равновесия,
        //  но −M в формуле внутреннего момента)
        M -= load.M * macaulay(x, load.x, 0);
      }
    }

    return M;
  };
}

/**
 * Вычисление прогибов
 */
function computeDeflections(
  input: BeamInput,
  reactions: Reactions,
  M: (x: number) => number
): { theta: (x: number) => number; y: (x: number) => number } {
  const { L, beamType, loads, E, I } = input;
  // E в Па (Н/м²), I в м⁴ => EI в Н·м²
  // Нагрузки в кН => моменты в кН·м => интегралы в кН·м², кН·м³
  // Чтобы получить прогиб в м, делим EI на 1000 (переводим в кН·м²)
  const EI = (E! * I!) / 1000;

  // Интегралы M(x) для theta и y
  // theta = (1/EI) * ∫M dx + C1
  // y = (1/EI) * ∫∫M dx + C1*x + C2

  // Функция однократного интеграла M
  const integralM = (x: number): number => {
    let result = 0;

    // От реакций
    if (beamType === "simply-supported") {
      if (reactions.xA !== undefined && reactions.RA !== undefined) {
        result += reactions.RA * macaulayIntegral(x, reactions.xA, 1);
      }
      if (reactions.xB !== undefined && reactions.RB !== undefined) {
        result += reactions.RB * macaulayIntegral(x, reactions.xB, 1);
      }
    } else {
      if (reactions.xf !== undefined) {
        if (reactions.Rf !== undefined) {
          result += reactions.Rf * macaulayIntegral(x, reactions.xf, 1);
        }
        if (reactions.Mf !== undefined) {
          // Знак минус, как в M(x)
          result -= reactions.Mf * macaulayIntegral(x, reactions.xf, 0);
        }
      }
    }

    // От нагрузок (инвертируем: + = вниз)
    for (const load of loads) {
      if (load.type === "distributed") {
        const { q, a, b } = load;
        // Минус, потому что q+ = вниз
        result -=
          (q / 2) *
          (macaulayIntegral(x, a, 2) - macaulayIntegral(x, b, 2));
      } else if (load.type === "force") {
        // Минус, потому что F+ = вниз
        result -= load.F * macaulayIntegral(x, load.x, 1);
      } else if (load.type === "moment") {
        // Знак минус, как в M(x)
        result -= load.M * macaulayIntegral(x, load.x, 0);
      }
    }

    return result;
  };

  // Функция двойного интеграла M
  const doubleIntegralM = (x: number): number => {
    let result = 0;

    // От реакций
    if (beamType === "simply-supported") {
      if (reactions.xA !== undefined && reactions.RA !== undefined) {
        result += reactions.RA * macaulayDoubleIntegral(x, reactions.xA, 1);
      }
      if (reactions.xB !== undefined && reactions.RB !== undefined) {
        result += reactions.RB * macaulayDoubleIntegral(x, reactions.xB, 1);
      }
    } else {
      if (reactions.xf !== undefined) {
        if (reactions.Rf !== undefined) {
          result += reactions.Rf * macaulayDoubleIntegral(x, reactions.xf, 1);
        }
        if (reactions.Mf !== undefined) {
          // Знак минус, как в M(x)
          result -= reactions.Mf * macaulayDoubleIntegral(x, reactions.xf, 0);
        }
      }
    }

    // От нагрузок (инвертируем: + = вниз)
    for (const load of loads) {
      if (load.type === "distributed") {
        const { q, a, b } = load;
        // Минус, потому что q+ = вниз
        result -=
          (q / 2) *
          (macaulayDoubleIntegral(x, a, 2) - macaulayDoubleIntegral(x, b, 2));
      } else if (load.type === "force") {
        // Минус, потому что F+ = вниз
        result -= load.F * macaulayDoubleIntegral(x, load.x, 1);
      } else if (load.type === "moment") {
        // Знак минус, как в M(x)
        result -= load.M * macaulayDoubleIntegral(x, load.x, 0);
      }
    }

    return result;
  };

  // Определение констант C1 и C2 из граничных условий
  let C1 = 0;
  let C2 = 0;

  if (beamType === "simply-supported") {
    const xA = reactions.xA ?? 0;
    const xB = reactions.xB ?? L;

    // y(xA) = 0 и y(xB) = 0
    // y(x) = (1/EI) * doubleIntegralM(x) + C1*x + C2

    // y(xA) = 0: (1/EI) * doubleIntegralM(xA) + C1*xA + C2 = 0
    // y(xB) = 0: (1/EI) * doubleIntegralM(xB) + C1*xB + C2 = 0

    const yA_partial = doubleIntegralM(xA) / EI;
    const yB_partial = doubleIntegralM(xB) / EI;

    // Система: C1*xA + C2 = -yA_partial
    //          C1*xB + C2 = -yB_partial
    // C1 = (-yB_partial + yA_partial) / (xB - xA)
    // C2 = -yA_partial - C1*xA

    C1 = (-yB_partial + yA_partial) / (xB - xA);
    C2 = -yA_partial - C1 * xA;
  } else if (beamType === "cantilever-left") {
    // y(0) = 0, y'(0) = 0
    C1 = 0;
    C2 = 0;
  } else {
    // cantilever-right: y(L) = 0, y'(L) = 0
    const yL_partial = doubleIntegralM(L) / EI;
    const thetaL_partial = integralM(L) / EI;

    // theta(L) = 0: thetaL_partial + C1 = 0 => C1 = -thetaL_partial
    // y(L) = 0: yL_partial + C1*L + C2 = 0 => C2 = -yL_partial - C1*L

    C1 = -thetaL_partial;
    C2 = -yL_partial - C1 * L;
  }

  const theta = (x: number): number => {
    return integralM(x) / EI + C1;
  };

  const y = (x: number): number => {
    return doubleIntegralM(x) / EI + C1 * x + C2;
  };

  return { theta, y };
}

/**
 * Сбор всех точек событий
 */
function collectEvents(input: BeamInput, reactions: Reactions): number[] {
  const events = new Set<number>([0, input.L]);

  // Опоры
  if (reactions.xA !== undefined) events.add(reactions.xA);
  if (reactions.xB !== undefined) events.add(reactions.xB);
  if (reactions.xf !== undefined) events.add(reactions.xf);

  // Нагрузки
  for (const load of input.loads) {
    if (load.type === "distributed") {
      events.add(load.a);
      events.add(load.b);
    } else {
      events.add(load.x);
    }
  }

  return Array.from(events).sort((a, b) => a - b);
}

/**
 * Поиск экстремума функции
 */
function findExtremum(
  fn: (x: number) => number,
  events: number[],
  L: number,
  checkJumps = false
): { value: number; x: number } {
  let maxValue = 0;
  let maxX = 0;

  const numPoints = 1000;
  const dx = L / numPoints;

  for (let i = 0; i <= numPoints; i++) {
    const x = i * dx;
    const value = Math.abs(fn(x));
    if (value > maxValue) {
      maxValue = value;
      maxX = x;
    }
  }

  // Проверяем точки событий
  for (const e of events) {
    const value = Math.abs(fn(e));
    if (value > maxValue) {
      maxValue = value;
      maxX = e;
    }
  }

  return { value: fn(maxX), x: maxX };
}

/**
 * Генерация данных для графика
 */
export function generateDiagramData(
  fn: (x: number) => number,
  L: number,
  events: number[],
  numPoints = 500
): { x: number[]; values: number[] } {
  const x: number[] = [];
  const values: number[] = [];

  // Генерируем точки с учётом событий
  const allPoints = new Set<number>();

  for (let i = 0; i <= numPoints; i++) {
    allPoints.add((i / numPoints) * L);
  }

  // Добавляем точки рядом с событиями для корректного отображения скачков
  for (const e of events) {
    allPoints.add(e);
    allPoints.add(Math.max(0, e - 1e-9));
    allPoints.add(Math.min(L, e + 1e-9));
  }

  const sortedPoints = Array.from(allPoints).sort((a, b) => a - b);

  for (const p of sortedPoints) {
    x.push(p);
    values.push(fn(p));
  }

  return { x, values };
}
