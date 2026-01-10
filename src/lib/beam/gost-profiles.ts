/**
 * Справочник сортамента по ГОСТ
 *
 * Двутавры: ГОСТ 8239-89 (горячекатаные)
 * Швеллеры: ГОСТ 8240-97 (с уклоном полок У и параллельными полками П)
 */

export type ProfileType = 'i-beam' | 'channel-u' | 'channel-p';

export interface ProfileData {
  type: ProfileType;
  number: string;     // номер профиля (например, "10", "18а", "20П")
  h: number;          // высота, мм
  b: number;          // ширина полки, мм
  s: number;          // толщина стенки, мм
  t: number;          // толщина полки, мм
  Ix: number;         // момент инерции Ix, см⁴
  Wx: number;         // момент сопротивления Wx, см³
  A: number;          // площадь сечения, см²
  gost: string;       // ГОСТ
}

/**
 * Двутавры по ГОСТ 8239-89
 * Горячекатаные двутавры с уклоном внутренних граней полок
 */
export const I_BEAMS: ProfileData[] = [
  { type: 'i-beam', number: '10',  h: 100, b: 55,  s: 4.5, t: 7.2,  Ix: 198,   Wx: 39.7,  A: 12.0,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '12',  h: 120, b: 64,  s: 4.8, t: 7.3,  Ix: 350,   Wx: 58.4,  A: 14.7,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '14',  h: 140, b: 73,  s: 4.9, t: 7.5,  Ix: 572,   Wx: 81.7,  A: 17.4,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '16',  h: 160, b: 81,  s: 5.0, t: 7.8,  Ix: 873,   Wx: 109,   A: 20.2,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '18',  h: 180, b: 90,  s: 5.1, t: 8.1,  Ix: 1290,  Wx: 143,   A: 23.4,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '18а', h: 180, b: 100, s: 5.1, t: 8.3,  Ix: 1430,  Wx: 159,   A: 25.4,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '20',  h: 200, b: 100, s: 5.2, t: 8.4,  Ix: 1840,  Wx: 184,   A: 26.8,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '20а', h: 200, b: 110, s: 5.2, t: 8.6,  Ix: 2030,  Wx: 203,   A: 28.9,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '22',  h: 220, b: 110, s: 5.4, t: 8.7,  Ix: 2550,  Wx: 232,   A: 30.6,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '22а', h: 220, b: 120, s: 5.4, t: 8.9,  Ix: 2790,  Wx: 254,   A: 32.8,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '24',  h: 240, b: 115, s: 5.6, t: 9.5,  Ix: 3460,  Wx: 289,   A: 34.8,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '24а', h: 240, b: 125, s: 5.6, t: 9.8,  Ix: 3800,  Wx: 317,   A: 37.5,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '27',  h: 270, b: 125, s: 6.0, t: 9.8,  Ix: 5010,  Wx: 371,   A: 40.2,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '27а', h: 270, b: 135, s: 6.0, t: 10.2, Ix: 5500,  Wx: 407,   A: 43.2,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '30',  h: 300, b: 135, s: 6.5, t: 10.2, Ix: 7080,  Wx: 472,   A: 46.5,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '30а', h: 300, b: 145, s: 6.5, t: 10.7, Ix: 7780,  Wx: 518,   A: 49.9,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '33',  h: 330, b: 140, s: 7.0, t: 11.2, Ix: 9840,  Wx: 597,   A: 53.8,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '36',  h: 360, b: 145, s: 7.5, t: 12.3, Ix: 13380, Wx: 743,   A: 61.9,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '40',  h: 400, b: 155, s: 8.3, t: 13.0, Ix: 19062, Wx: 953,   A: 72.6,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '45',  h: 450, b: 160, s: 9.0, t: 14.2, Ix: 27696, Wx: 1231,  A: 84.7,  gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '50',  h: 500, b: 170, s: 10.0, t: 15.2, Ix: 39727, Wx: 1589, A: 100.0, gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '55',  h: 550, b: 180, s: 11.0, t: 16.5, Ix: 55962, Wx: 2035, A: 118.0, gost: 'ГОСТ 8239-89' },
  { type: 'i-beam', number: '60',  h: 600, b: 190, s: 12.0, t: 17.8, Ix: 76806, Wx: 2560, A: 138.0, gost: 'ГОСТ 8239-89' },
];

/**
 * Швеллеры с уклоном внутренних граней полок по ГОСТ 8240-97
 */
export const CHANNELS_U: ProfileData[] = [
  { type: 'channel-u', number: '5У',   h: 50,  b: 32,  s: 4.4, t: 7.0,  Ix: 22.8,   Wx: 9.1,   A: 6.16,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '6.5У', h: 65,  b: 36,  s: 4.4, t: 7.2,  Ix: 48.6,   Wx: 15.0,  A: 7.51,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '8У',   h: 80,  b: 40,  s: 4.5, t: 7.4,  Ix: 89.4,   Wx: 22.4,  A: 8.98,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '10У',  h: 100, b: 46,  s: 4.5, t: 7.6,  Ix: 174,    Wx: 34.8,  A: 10.9,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '12У',  h: 120, b: 52,  s: 4.8, t: 7.8,  Ix: 304,    Wx: 50.6,  A: 13.3,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '14У',  h: 140, b: 58,  s: 4.9, t: 8.1,  Ix: 491,    Wx: 70.2,  A: 15.6,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '16У',  h: 160, b: 64,  s: 5.0, t: 8.4,  Ix: 747,    Wx: 93.4,  A: 18.1,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '18У',  h: 180, b: 70,  s: 5.1, t: 8.7,  Ix: 1090,   Wx: 121,   A: 20.7,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '20У',  h: 200, b: 76,  s: 5.2, t: 9.0,  Ix: 1520,   Wx: 152,   A: 23.4,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '22У',  h: 220, b: 82,  s: 5.4, t: 9.5,  Ix: 2110,   Wx: 192,   A: 26.7,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '24У',  h: 240, b: 90,  s: 5.6, t: 10.0, Ix: 2900,   Wx: 242,   A: 30.6,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '27У',  h: 270, b: 95,  s: 6.0, t: 10.5, Ix: 4160,   Wx: 308,   A: 35.2,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '30У',  h: 300, b: 100, s: 6.5, t: 11.0, Ix: 5810,   Wx: 387,   A: 40.5,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '33У',  h: 330, b: 105, s: 7.0, t: 11.7, Ix: 7980,   Wx: 484,   A: 46.5,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '36У',  h: 360, b: 110, s: 7.5, t: 12.6, Ix: 10820,  Wx: 601,   A: 53.4,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-u', number: '40У',  h: 400, b: 115, s: 8.0, t: 13.5, Ix: 15220,  Wx: 761,   A: 61.5,  gost: 'ГОСТ 8240-97' },
];

/**
 * Швеллеры с параллельными гранями полок по ГОСТ 8240-97
 */
export const CHANNELS_P: ProfileData[] = [
  { type: 'channel-p', number: '5П',   h: 50,  b: 32,  s: 4.4, t: 7.0,  Ix: 22.8,   Wx: 9.1,   A: 6.16,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '6.5П', h: 65,  b: 36,  s: 4.4, t: 7.2,  Ix: 48.6,   Wx: 15.0,  A: 7.51,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '8П',   h: 80,  b: 40,  s: 4.5, t: 7.4,  Ix: 89.4,   Wx: 22.4,  A: 8.98,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '10П',  h: 100, b: 46,  s: 4.5, t: 7.6,  Ix: 174,    Wx: 34.8,  A: 10.9,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '12П',  h: 120, b: 52,  s: 4.8, t: 7.8,  Ix: 304,    Wx: 50.6,  A: 13.3,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '14П',  h: 140, b: 58,  s: 4.9, t: 8.1,  Ix: 491,    Wx: 70.2,  A: 15.6,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '16П',  h: 160, b: 64,  s: 5.0, t: 8.4,  Ix: 747,    Wx: 93.4,  A: 18.1,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '18П',  h: 180, b: 70,  s: 5.1, t: 8.7,  Ix: 1090,   Wx: 121,   A: 20.7,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '20П',  h: 200, b: 76,  s: 5.2, t: 9.0,  Ix: 1520,   Wx: 152,   A: 23.4,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '22П',  h: 220, b: 82,  s: 5.4, t: 9.5,  Ix: 2110,   Wx: 192,   A: 26.7,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '24П',  h: 240, b: 90,  s: 5.6, t: 10.0, Ix: 2900,   Wx: 242,   A: 30.6,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '27П',  h: 270, b: 95,  s: 6.0, t: 10.5, Ix: 4160,   Wx: 308,   A: 35.2,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '30П',  h: 300, b: 100, s: 6.5, t: 11.0, Ix: 5810,   Wx: 387,   A: 40.5,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '33П',  h: 330, b: 105, s: 7.0, t: 11.7, Ix: 7980,   Wx: 484,   A: 46.5,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '36П',  h: 360, b: 110, s: 7.5, t: 12.6, Ix: 10820,  Wx: 601,   A: 53.4,  gost: 'ГОСТ 8240-97' },
  { type: 'channel-p', number: '40П',  h: 400, b: 115, s: 8.0, t: 13.5, Ix: 15220,  Wx: 761,   A: 61.5,  gost: 'ГОСТ 8240-97' },
];

/**
 * Получить список профилей по типу
 */
export function getProfilesByType(type: ProfileType): ProfileData[] {
  switch (type) {
    case 'i-beam':
      return I_BEAMS;
    case 'channel-u':
      return CHANNELS_U;
    case 'channel-p':
      return CHANNELS_P;
  }
}

/**
 * Подобрать профиль по требуемому моменту сопротивления
 * @param type - тип профиля
 * @param Wreq - требуемый момент сопротивления, см³
 * @returns ProfileData | null - подобранный профиль или null если не найден
 */
export function selectProfile(type: ProfileType, Wreq: number): ProfileData | null {
  const profiles = getProfilesByType(type);

  // Профили уже отсортированы по возрастанию Wx
  // Находим первый профиль, у которого Wx >= Wreq
  for (const profile of profiles) {
    if (profile.Wx >= Wreq) {
      return profile;
    }
  }

  // Если требуемый Wx больше максимального в сортаменте
  return null;
}

/**
 * Получить название типа профиля на русском
 */
export function getProfileTypeName(type: ProfileType): string {
  switch (type) {
    case 'i-beam':
      return 'Двутавр';
    case 'channel-u':
      return 'Швеллер с уклоном полок';
    case 'channel-p':
      return 'Швеллер с параллельными полками';
  }
}

/**
 * Получить краткое название типа профиля
 */
export function getProfileTypeShortName(type: ProfileType): string {
  switch (type) {
    case 'i-beam':
      return 'Двутавр';
    case 'channel-u':
      return 'Швеллер У';
    case 'channel-p':
      return 'Швеллер П';
  }
}
