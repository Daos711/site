// Типы нагрузок и балок

export type BeamType =
  | "simply-supported"      // Двухопорная
  | "cantilever-left"       // Заделка слева
  | "cantilever-right";     // Заделка справа

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
  I?: number;             // момент инерции, м^4 (для прогибов)
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
  Mmax: { value: number; x: number };
  Qmax: { value: number; x: number };
  events: number[];  // точки разрыва/перегиба
}

export interface DiagramData {
  x: number[];
  values: number[];
  label: string;
  unit: string;
}
