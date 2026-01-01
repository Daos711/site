/**
 * Детерминированный генератор псевдослучайных чисел (PRNG)
 * Использует алгоритм mulberry32 для воспроизводимости результатов
 */
export class PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * Возвращает число от 0 до 1 (не включая 1)
   */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Целое число от min до max (включительно)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Случайный элемент массива
   */
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Перемешать массив (Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Возвращает true с вероятностью p (0..1)
   */
  chance(p: number): boolean {
    return this.next() < p;
  }
}
