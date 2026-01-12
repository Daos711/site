import Decimal from 'decimal.js/decimal.mjs';

// Настройка точности - 100 значащих цифр
Decimal.set({ precision: 100 });

export interface ReferenceOrbit {
  zx: number[];  // Re(Z_n) для каждой итерации
  zy: number[];  // Im(Z_n) для каждой итерации
  escaped: boolean;
  escapeIter: number;
}

/**
 * Вычисляет опорную орбиту для центра экрана в произвольной точности.
 * Возвращает массивы zx и zy как float32 для передачи в GPU.
 */
export function computeReferenceOrbit(
  centerX: string | number,
  centerY: string | number,
  maxIter: number
): ReferenceOrbit {
  const cx = new Decimal(centerX);
  const cy = new Decimal(centerY);

  const zx: number[] = [];
  const zy: number[] = [];

  let zxD = new Decimal(0);
  let zyD = new Decimal(0);

  let escaped = false;
  let escapeIter = maxIter;

  for (let i = 0; i < maxIter; i++) {
    // Сохраняем текущее z как float для GPU
    zx.push(zxD.toNumber());
    zy.push(zyD.toNumber());

    // |z|² > 4 (или большее значение для стабильности)
    const zx2 = zxD.mul(zxD);
    const zy2 = zyD.mul(zyD);
    const magSq = zx2.plus(zy2);

    if (magSq.gt(1e10)) {  // Большой bailout для perturbation стабильности
      escaped = true;
      escapeIter = i;
      break;
    }

    // z = z² + c в высокой точности
    const zxy = zxD.mul(zyD);
    const newZx = zx2.minus(zy2).plus(cx);
    const newZy = zxy.mul(2).plus(cy);

    zxD = newZx;
    zyD = newZy;
  }

  return { zx, zy, escaped, escapeIter };
}

/**
 * Вычисляет δc (смещение точки от центра) в высокой точности.
 * Возвращает как два float (hi, lo) для DD арифметики на GPU.
 */
export function computeDeltaC(
  centerX: string | number,
  centerY: string | number,
  pointX: string | number,
  pointY: string | number
): { dcxHi: number; dcxLo: number; dcyHi: number; dcyLo: number } {
  const cx = new Decimal(centerX);
  const cy = new Decimal(centerY);
  const px = new Decimal(pointX);
  const py = new Decimal(pointY);

  const dcx = px.minus(cx);
  const dcy = py.minus(cy);

  // Упаковываем в (hi, lo) пары
  const dcxNum = dcx.toNumber();
  const dcyNum = dcy.toNumber();

  const dcxHi = Math.fround(dcxNum);
  const dcxLo = dcxNum - dcxHi;
  const dcyHi = Math.fround(dcyNum);
  const dcyLo = dcyNum - dcyHi;

  return { dcxHi, dcxLo, dcyHi, dcyLo };
}

/**
 * Упаковка опорной орбиты в Float32Array для текстуры.
 * Формат: RGBA float текстура, R=zx, G=zy
 */
export function packOrbitForTexture(orbit: ReferenceOrbit): Float32Array {
  const size = orbit.zx.length;
  const data = new Float32Array(size * 4);

  for (let i = 0; i < size; i++) {
    data[i * 4 + 0] = orbit.zx[i];  // R
    data[i * 4 + 1] = orbit.zy[i];  // G
    data[i * 4 + 2] = 0;            // B (не используется)
    data[i * 4 + 3] = 1;            // A
  }

  return data;
}

/**
 * Проверяет нужно ли пересчитать опорную орбиту.
 * Возвращает true если центр сдвинулся значительно.
 */
export function shouldRecomputeOrbit(
  oldCenterX: number,
  oldCenterY: number,
  newCenterX: number,
  newCenterY: number,
  scale: number
): boolean {
  // Пересчитываем если сдвиг больше 10% от размера экрана
  const threshold = scale * 0.1;
  const dx = Math.abs(newCenterX - oldCenterX);
  const dy = Math.abs(newCenterY - oldCenterY);

  return dx > threshold || dy > threshold;
}
