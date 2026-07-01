"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Play, Pause, RotateCcw, Shuffle, Info, Volume2, VolumeX } from "lucide-react";

// Типы
type ArrayElement = {
  value: number;
  state: "default" | "comparing" | "swapping" | "sorted" | "pivot";
};

type SortingStep = {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  pivot?: number;
};

type Algorithm = {
  id: string;
  name: string;
  description: string;
  complexity: string;
};

// Алгоритмы сортировки
const algorithms: Algorithm[] = [
  {
    id: "bubble",
    name: "Пузырьковая",
    description: "Простой алгоритм: соседние элементы сравниваются и меняются местами",
    complexity: "O(n²)",
  },
  {
    id: "selection",
    name: "Выбором",
    description: "Находит минимум и ставит его в начало",
    complexity: "O(n²)",
  },
  {
    id: "insertion",
    name: "Вставками",
    description: "Каждый элемент вставляется на своё место в отсортированной части",
    complexity: "O(n²)",
  },
  {
    id: "merge",
    name: "Слиянием",
    description: "Разделяй и властвуй: делит массив пополам и сливает",
    complexity: "O(n log n)",
  },
  {
    id: "quick",
    name: "Быстрая",
    description: "Разделяй и властвуй: выбирает опорный элемент и разбивает массив",
    complexity: "O(n log n)",
  },
  {
    id: "heap",
    name: "Пирамидальная",
    description: "Использует структуру данных heap (куча)",
    complexity: "O(n log n)",
  },
];

// Генератор шагов для пузырьковой сортировки
function* bubbleSort(arr: number[]): Generator<SortingStep> {
  const array = [...arr];
  const n = array.length;
  const sorted: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield { array: [...array], comparing: [j, j + 1], swapping: [], sorted: [...sorted] };

      if (array[j] > array[j + 1]) {
        yield { array: [...array], comparing: [], swapping: [j, j + 1], sorted: [...sorted] };
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
      }
    }
    sorted.unshift(n - i - 1);
  }
  sorted.unshift(0);
  yield { array: [...array], comparing: [], swapping: [], sorted: [...sorted] };
}

// Генератор шагов для сортировки выбором
function* selectionSort(arr: number[]): Generator<SortingStep> {
  const array = [...arr];
  const n = array.length;
  const sorted: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    for (let j = i + 1; j < n; j++) {
      yield { array: [...array], comparing: [minIdx, j], swapping: [], sorted: [...sorted] };

      if (array[j] < array[minIdx]) {
        minIdx = j;
      }
    }

    if (minIdx !== i) {
      yield { array: [...array], comparing: [], swapping: [i, minIdx], sorted: [...sorted] };
      [array[i], array[minIdx]] = [array[minIdx], array[i]];
    }
    sorted.push(i);
  }
  sorted.push(n - 1);
  yield { array: [...array], comparing: [], swapping: [], sorted: [...sorted] };
}

// Генератор шагов для сортировки вставками
function* insertionSort(arr: number[]): Generator<SortingStep> {
  const array = [...arr];
  const n = array.length;
  const sorted: number[] = [0];

  for (let i = 1; i < n; i++) {
    const key = array[i];
    let j = i - 1;

    yield { array: [...array], comparing: [i], swapping: [], sorted: [...sorted] };

    while (j >= 0 && array[j] > key) {
      yield { array: [...array], comparing: [j, j + 1], swapping: [], sorted: [...sorted] };
      yield { array: [...array], comparing: [], swapping: [j, j + 1], sorted: [...sorted] };
      array[j + 1] = array[j];
      j--;
    }
    array[j + 1] = key;
    sorted.push(i);
  }

  yield { array: [...array], comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i) };
}

// Генератор шагов для сортировки слиянием
function* mergeSort(arr: number[]): Generator<SortingStep> {
  const array = [...arr];
  const n = array.length;

  function* mergeSortHelper(start: number, end: number): Generator<SortingStep> {
    if (start >= end) return;

    const mid = Math.floor((start + end) / 2);
    yield* mergeSortHelper(start, mid);
    yield* mergeSortHelper(mid + 1, end);

    // Merge
    const left = array.slice(start, mid + 1);
    const right = array.slice(mid + 1, end + 1);
    let i = 0, j = 0, k = start;

    while (i < left.length && j < right.length) {
      yield { array: [...array], comparing: [start + i, mid + 1 + j], swapping: [], sorted: [] };

      if (left[i] <= right[j]) {
        array[k] = left[i];
        i++;
      } else {
        array[k] = right[j];
        j++;
      }
      yield { array: [...array], comparing: [], swapping: [k], sorted: [] };
      k++;
    }

    while (i < left.length) {
      array[k] = left[i];
      yield { array: [...array], comparing: [], swapping: [k], sorted: [] };
      i++;
      k++;
    }

    while (j < right.length) {
      array[k] = right[j];
      yield { array: [...array], comparing: [], swapping: [k], sorted: [] };
      j++;
      k++;
    }
  }

  yield* mergeSortHelper(0, n - 1);
  yield { array: [...array], comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i) };
}

// Генератор шагов для быстрой сортировки
function* quickSort(arr: number[]): Generator<SortingStep> {
  const array = [...arr];
  const n = array.length;

  function* quickSortHelper(low: number, high: number): Generator<SortingStep> {
    if (low >= high) return;

    // Partition
    const pivot = array[high];
    yield { array: [...array], comparing: [], swapping: [], sorted: [], pivot: high };

    let i = low - 1;

    for (let j = low; j < high; j++) {
      yield { array: [...array], comparing: [j, high], swapping: [], sorted: [], pivot: high };

      if (array[j] < pivot) {
        i++;
        if (i !== j) {
          yield { array: [...array], comparing: [], swapping: [i, j], sorted: [], pivot: high };
          [array[i], array[j]] = [array[j], array[i]];
        }
      }
    }

    i++;
    if (i !== high) {
      yield { array: [...array], comparing: [], swapping: [i, high], sorted: [], pivot: high };
      [array[i], array[high]] = [array[high], array[i]];
    }

    yield* quickSortHelper(low, i - 1);
    yield* quickSortHelper(i + 1, high);
  }

  yield* quickSortHelper(0, n - 1);
  yield { array: [...array], comparing: [], swapping: [], sorted: Array.from({ length: n }, (_, i) => i) };
}

// Генератор шагов для пирамидальной сортировки
function* heapSort(arr: number[]): Generator<SortingStep> {
  const array = [...arr];
  const n = array.length;
  const sorted: number[] = [];

  function* heapify(size: number, root: number): Generator<SortingStep> {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;

    if (left < size) {
      yield { array: [...array], comparing: [largest, left], swapping: [], sorted: [...sorted] };
      if (array[left] > array[largest]) {
        largest = left;
      }
    }

    if (right < size) {
      yield { array: [...array], comparing: [largest, right], swapping: [], sorted: [...sorted] };
      if (array[right] > array[largest]) {
        largest = right;
      }
    }

    if (largest !== root) {
      yield { array: [...array], comparing: [], swapping: [root, largest], sorted: [...sorted] };
      [array[root], array[largest]] = [array[largest], array[root]];
      yield* heapify(size, largest);
    }
  }

  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* heapify(n, i);
  }

  // Extract elements from heap
  for (let i = n - 1; i > 0; i--) {
    yield { array: [...array], comparing: [], swapping: [0, i], sorted: [...sorted] };
    [array[0], array[i]] = [array[i], array[0]];
    sorted.unshift(i);
    yield* heapify(i, 0);
  }

  sorted.unshift(0);
  yield { array: [...array], comparing: [], swapping: [], sorted: [...sorted] };
}

// Генератор случайного массива
function generateRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1);
}

// AudioContext для звука
let audioContext: AudioContext | null = null;

function playSound(frequency: number, duration: number = 50) {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

export default function SortingPage() {
  const [arraySize, setArraySize] = useState(30);
  const [array, setArray] = useState<number[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Генерируем массив только на клиенте чтобы избежать hydration mismatch
  useEffect(() => {
    setArray(generateRandomArray(30));
    setIsClient(true);
  }, []);
  const [comparing, setComparing] = useState<number[]>([]);
  const [swapping, setSwapping] = useState<number[]>([]);
  const [sorted, setSorted] = useState<number[]>([]);
  const [pivot, setPivot] = useState<number | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [algorithm, setAlgorithm] = useState<string>("bubble");
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const generatorRef = useRef<Generator<SortingStep> | null>(null);
  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const isPausedRef = useRef(false);

  // Синхронизация паузы
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Получить генератор для алгоритма
  const getGenerator = useCallback((alg: string, arr: number[]) => {
    switch (alg) {
      case "bubble": return bubbleSort(arr);
      case "selection": return selectionSort(arr);
      case "insertion": return insertionSort(arr);
      case "merge": return mergeSort(arr);
      case "quick": return quickSort(arr);
      case "heap": return heapSort(arr);
      default: return bubbleSort(arr);
    }
  }, []);

  // Анимация
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = Math.max(1, 101 - speed);

    const animate = (timestamp: number) => {
      if (isPausedRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (timestamp - lastUpdateRef.current >= interval) {
        if (generatorRef.current) {
          const result = generatorRef.current.next();

          if (result.done) {
            setIsRunning(false);
            setComparing([]);
            setSwapping([]);
            setPivot(undefined);
            // Все отсортированы
            setSorted(Array.from({ length: array.length }, (_, i) => i));
          } else {
            const step = result.value;
            setArray(step.array);
            setComparing(step.comparing);
            setSwapping(step.swapping);
            setSorted(step.sorted);
            setPivot(step.pivot);

            if (step.comparing.length > 0) {
              setComparisons(c => c + 1);
              if (soundEnabled && step.comparing.length >= 2) {
                const freq = 200 + (step.array[step.comparing[0]] / 100) * 800;
                playSound(freq, 30);
              }
            }
            if (step.swapping.length > 0) {
              setSwaps(s => s + 1);
              if (soundEnabled && step.swapping.length >= 2) {
                const freq = 200 + (step.array[step.swapping[0]] / 100) * 800;
                playSound(freq, 50);
              }
            }
          }
        }
        lastUpdateRef.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, isPaused, speed, soundEnabled, array.length]);

  // Старт сортировки
  const handleStart = () => {
    if (isRunning) {
      setIsPaused(!isPaused);
    } else {
      setComparisons(0);
      setSwaps(0);
      setSorted([]);
      setComparing([]);
      setSwapping([]);
      setPivot(undefined);
      generatorRef.current = getGenerator(algorithm, array);
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  // Сброс
  const handleReset = () => {
    cancelAnimationFrame(animationRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setComparing([]);
    setSwapping([]);
    setSorted([]);
    setPivot(undefined);
    setComparisons(0);
    setSwaps(0);
    generatorRef.current = null;
  };

  // Новый массив
  const handleNewArray = () => {
    handleReset();
    setArray(generateRandomArray(arraySize));
  };

  // Изменение размера массива
  const handleSizeChange = (newSize: number) => {
    handleReset();
    setArraySize(newSize);
    setArray(generateRandomArray(newSize));
  };

  // Смена алгоритма
  const handleAlgorithmChange = (alg: string) => {
    handleReset();
    setAlgorithm(alg);
  };

  // Максимальное значение для масштабирования
  const maxValue = array.length > 0 ? Math.max(...array) : 100;

  // Текущий алгоритм
  const currentAlgorithm = algorithms.find(a => a.id === algorithm)!;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Сортировки"
        description="Визуализация алгоритмов сортировки со звуком"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Визуализация */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">{currentAlgorithm.name} сортировка</span>
            <span className="text-xs text-muted">
              {comparisons} сравнений, {swaps} перестановок
            </span>
          </div>

          {/* Бары */}
          <div
            className="flex items-end justify-center gap-[1px] p-4 h-80"
            style={{ background: "#0f172a" }}
          >
            {!isClient ? (
              <div className="text-muted text-sm">Загрузка...</div>
            ) : array.map((value, index) => {
              const height = (value / maxValue) * 100;
              let bgColor = "bg-cyan-500";

              if (sorted.includes(index)) {
                bgColor = "bg-green-500";
              } else if (swapping.includes(index)) {
                bgColor = "bg-red-500";
              } else if (comparing.includes(index)) {
                bgColor = "bg-yellow-500";
              } else if (pivot === index) {
                bgColor = "bg-purple-500";
              }

              return (
                <div
                  key={index}
                  className={`${bgColor} transition-all duration-75 rounded-t`}
                  style={{
                    height: `${height}%`,
                    width: `${Math.max(2, 100 / array.length - 1)}%`,
                  }}
                />
              );
            })}
          </div>

          {/* Легенда */}
          <div className="p-3 border-t border-border flex flex-wrap gap-4 text-xs text-muted">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-cyan-500"></div>
              <span>Обычный</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span>Сравнение</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>Обмен</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span>Опорный</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Отсортирован</span>
            </div>
          </div>
        </div>

        {/* Управление */}
        <div className="space-y-4">
          {/* Кнопки управления */}
          <div className="flex gap-2">
            <button
              onClick={handleStart}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                isRunning && !isPaused
                  ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              }`}
            >
              {isRunning && !isPaused ? <Pause size={18} /> : <Play size={18} />}
              {isRunning && !isPaused ? "Пауза" : isRunning ? "Продолжить" : "Старт"}
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center justify-center px-4 py-3 rounded-lg transition-all ${
                soundEnabled
                  ? "bg-accent/20 text-accent"
                  : "bg-muted/10 text-muted hover:bg-muted/20"
              }`}
              title={soundEnabled ? "Выключить звук" : "Включить звук"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`flex items-center justify-center px-4 py-3 rounded-lg transition-all ${
                showInfo ? "bg-accent/20 text-accent" : "bg-muted/10 text-muted hover:bg-muted/20"
              }`}
            >
              <Info size={18} />
            </button>
          </div>

          {/* Действия */}
          <div className="flex gap-2">
            <button
              onClick={handleNewArray}
              disabled={isRunning && !isPaused}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all disabled:opacity-50"
            >
              <Shuffle size={16} />
              Новый массив
            </button>
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            >
              <RotateCcw size={16} />
              Сброс
            </button>
          </div>

          {/* Выбор алгоритма */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Алгоритм</h3>
            <div className="grid grid-cols-2 gap-2">
              {algorithms.map((alg) => (
                <button
                  key={alg.id}
                  onClick={() => handleAlgorithmChange(alg.id)}
                  disabled={isRunning && !isPaused}
                  className={`px-3 py-2 rounded-lg text-sm transition-all text-left ${
                    algorithm === alg.id
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "bg-muted/10 text-muted hover:bg-muted/20 disabled:opacity-50"
                  }`}
                >
                  <div className="font-medium">{alg.name}</div>
                  <div className="text-xs opacity-70">{alg.complexity}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Скорость */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Скорость</span>
              <span className="font-mono">{speed}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Размер массива */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Размер массива</span>
              <span className="font-mono">{arraySize}</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={arraySize}
              onChange={(e) => handleSizeChange(parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full accent-cyan-500 disabled:opacity-50"
            />
          </div>

          {/* Справка */}
          {showInfo && (
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 text-sm space-y-3">
              <h3 className="font-medium text-accent">{currentAlgorithm.name}</h3>
              <p className="text-xs text-muted">{currentAlgorithm.description}</p>
              <div className="text-xs">
                <span className="text-muted">Сложность: </span>
                <span className="font-mono text-accent">{currentAlgorithm.complexity}</span>
              </div>
              <div className="border-t border-border/50 pt-3 mt-3 text-xs text-muted">
                <p>Включите звук чтобы &quot;услышать&quot; сортировку!</p>
                <p className="mt-1">Высота звука зависит от значения элемента.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
