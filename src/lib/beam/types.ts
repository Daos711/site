// Типы нагрузок и балок

import type { ProfileData, ProfileType } from './gost-profiles';

/** Тип поперечного сечения */
export type SectionType = 'round' | ProfileType;

export type BeamType =
  | "simply-supported"           // Двухопорная (опоры на концах)
  | "simply-supported-overhang-left"   // Двухопорная с консолью слева
  | "simply-supported-overhang-right"  // Двухопорная с консолью справа
  | "simply-supported-overhang-both"   // Двухконсольная (опоры внутри)
  | "cantilever-left"            // Заделка слева
  | "cantilever-right";          // Заделка справа

export interface DistributedLoad {
  type: "distributed";
  q: number;    // кН/м (+ вверх, - вниз)
  a: number;    // начало, м
  b: number;    // конец, м
}

export interface PointForce {
  type: "force";
  F: number;    // кН (+ вверх, - вниз)
  x: number;    // координата, м
}

export interface PointMoment {
  type: "moment";
  M: number;    // кН·м (+ против часовой)
  x: number;    // координата, м
}

export type Load = DistributedLoad | PointForce | PointMoment;

export interface BeamSupport {
  type: "pin" | "roller" | "fixed";
  x: number;
}

export interface BeamInput {
  L: number;              // длина балки, м
  beamType: BeamType;
  supports: BeamSupport[];
  loads: Load[];
  E?: number;             // модуль упругости, Па (для прогибов)
  I?: number;             // момент инерции, м^4 (для прогибов) — если задан вручную
  sigma?: number;         // допускаемое напряжение, Па (для подбора сечения)
  sectionType?: SectionType;  // тип сечения (круглое, двутавр, швеллер)
}

export interface Reactions {
  RA?: number;    // реакция в точке A, кН
  RB?: number;    // реакция в точке B, кН
  Rf?: number;    // реакция в заделке, кН
  Mf?: number;    // момент в заделке, кН·м
  xA?: number;    // координата опоры A
  xB?: number;    // координата опоры B
  xf?: number;    // координата заделки
}

export interface BeamResult {
  reactions: Reactions;
  Q: (x: number) => number;
  M: (x: number) => number;
  theta?: (x: number) => number;  // угол поворота
  y?: (x: number) => number;      // прогиб
  C1?: number;                    // константа интегрирования для θ
  C2?: number;                    // константа интегрирования для y
  Mmax: { value: number; x: number };
  Qmax: { value: number; x: number };
  events: number[];  // точки разрыва/перегиба
  // Подбор сечения (если задано sigma)
  sectionType?: SectionType;   // тип сечения
  diameter?: number;           // подобранный диаметр для круглого, м
  selectedProfile?: ProfileData;  // выбранный профиль из ГОСТ (для двутавра/швеллера)
  I?: number;                  // момент инерции, м^4
  W?: number;                  // момент сопротивления, м^3
  Wreq?: number;               // требуемый момент сопротивления, см³
}

export interface DiagramData {
  x: number[];
  values: number[];
  label: string;
  unit: string;
}
