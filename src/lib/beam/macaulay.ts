/**
 * Функция Маколея (singularity function)
 * <x - a>^n = (x >= a) ? (x - a)^n : 0
 */
export function macaulay(x: number, a: number, n: number): number {
  if (x < a) return 0;
  return Math.pow(x - a, n);
}

/**
 * Интеграл функции Маколея
 * ∫<x-a>^n dx = <x-a>^(n+1) / (n+1)
 */
export function macaulayIntegral(x: number, a: number, n: number): number {
  if (x < a) return 0;
  return Math.pow(x - a, n + 1) / (n + 1);
}

/**
 * Двойной интеграл функции Маколея
 * ∫∫<x-a>^n dx dx = <x-a>^(n+2) / ((n+1)(n+2))
 */
export function macaulayDoubleIntegral(x: number, a: number, n: number): number {
  if (x < a) return 0;
  return Math.pow(x - a, n + 2) / ((n + 1) * (n + 2));
}
