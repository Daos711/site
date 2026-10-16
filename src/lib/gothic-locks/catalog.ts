/**
 * Curated factual lock observations from Arminek/nameless-locksmith (MIT declaration).
 * Pinned source and attribution: vendor/Arminek-NOTICE.txt; research: audit-catalog.md.
 * Configurations are source-reported, not independently verified in the game.
 */
import type { LockConfig } from './types';

export interface LockEntry {
  id: string;
  name: string;
  originalName: string;
  camp: 'old' | 'new' | 'swamp' | 'other';
  sector: string;
  route: string | null;
  type: 'chest' | 'door';
  floor: string | null;
  contents: string[];
  valuable: boolean;
  warnings: string[];
  config: LockConfig | null;
  gameVersion: string | null;
  source: { name: string; url: string; license: string; revision?: string };
  /** Public references for location facts; not the configuration source. */
  locationSources?: { name: string; url: string }[];
  verification: 'source' | 'unknown';
  notes: string;
}

export const CATALOG_LAST_REVIEWED = '2026-10-16';
export const LOCK_CATALOG: LockEntry[] = [
  {
    "id": "cavalorn-above",
    "name": "Сундук над хижиной Кавалорна",
    "originalName": "Chest above Cavalorn's cottage (near two New Camp thieves)",
    "camp": "other",
    "sector": "Окрестности хижины Кавалорна",
    "route": "Над хижиной Кавалорна; ориентир в записи автора — двое воров из Нового лагеря.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "В названии источника ориентир — двое воров из Нового лагеря."
    ],
    "config": {
      "positions": [
        1,
        4,
        5,
        2,
        1,
        4
      ],
      "links": [
        [
          0,
          0,
          1,
          0,
          -1,
          0
        ],
        [
          0,
          0,
          -1,
          -1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          1
        ],
        [
          -1,
          0,
          -1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх.",
    "locationSources": [
      {
        "name": "Arminek — исходный ориентир",
        "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md"
      }
    ]
  },
  {
    "id": "cavalorn-tower-door",
    "name": "Дверь Разрушенной башни у Кавалорна",
    "originalName": "Door to tower near Cavalorn's cottage",
    "camp": "other",
    "sector": "Разрушенная башня у Кавалорна",
    "route": "Вход в Разрушенную башню неподалёку от хижины Кавалорна; в гайде башня расположена восточнее Нового лагеря.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": {
      "positions": [
        5,
        6,
        2,
        2,
        1,
        1
      ],
      "links": [
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          -1,
          1,
          1,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          -1,
          1,
          -1,
          0,
          0,
          -1
        ],
        [
          -1,
          1,
          0,
          0,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх. Ориентир дополнительно сопоставлен с Gothic.tools: опубликованная там последовательность безопасно открывает эту неизменённую конфигурацию. Это проверка согласованности источников, не собственная игровая проверка.",
    "locationSources": [
      {
        "name": "Gothic.tools — ориентиры и комбинации",
        "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions"
      }
    ]
  },
  {
    "id": "tower-chest-first",
    "name": "Разрушенная башня — сундук у лестницы",
    "originalName": "First chest in the tower",
    "camp": "other",
    "sector": "Разрушенная башня у Кавалорна",
    "route": "Внутри Разрушенной башни найдите сундук возле лестницы. В гайде он обозначен как первый.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "У второго сундука наверху башни другая конфигурация. Сверьте все шесть стартовых позиций."
    ],
    "config": {
      "positions": [
        3,
        1,
        7,
        4,
        3,
        2
      ],
      "links": [
        [
          0,
          -1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          -1,
          -1,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          -1,
          0,
          0,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх. Ориентир дополнительно сопоставлен с Gothic.tools: опубликованная там последовательность безопасно открывает эту неизменённую конфигурацию. Это проверка согласованности источников, не собственная игровая проверка.",
    "locationSources": [
      {
        "name": "Gothic.tools — ориентиры и комбинации",
        "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions"
      }
    ]
  },
  {
    "id": "tower-chest-second",
    "name": "Разрушенная башня — верхний сундук",
    "originalName": "Second chest in the tower",
    "camp": "other",
    "sector": "Разрушенная башня у Кавалорна",
    "route": "Поднимитесь наверх Разрушенной башни. Этот сундук расположен выше первого сундука у лестницы.",
    "type": "chest",
    "floor": "Наверху башни",
    "contents": [],
    "valuable": false,
    "warnings": [
      "Автор исправил связь пластины 4 после повторного наблюдения. Использована исправленная запись источника."
    ],
    "config": {
      "positions": [
        5,
        3,
        6,
        7,
        2,
        7
      ],
      "links": [
        [
          0,
          0,
          1,
          0,
          0,
          -1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          -1,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          -1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          -1,
          0,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх. Ориентир дополнительно сопоставлен с Gothic.tools: опубликованная там последовательность безопасно открывает эту неизменённую конфигурацию. Это проверка согласованности источников, не собственная игровая проверка.",
    "locationSources": [
      {
        "name": "Gothic.tools — ориентиры и комбинации",
        "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions"
      }
    ]
  },
  {
    "id": "kharim-chest",
    "name": "Сундук Харима",
    "originalName": "kharim chest",
    "camp": "old",
    "sector": "Арена — вход",
    "route": "Старый лагерь, возле входа на арену: сундук Харима. Сам Харим участвует в боях на этой арене.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": {
      "positions": [
        3,
        3,
        4,
        2,
        3,
        7,
        1
      ],
      "links": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          -1,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          -1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          -1,
          0,
          1,
          0,
          0
        ],
        [
          -1,
          0,
          0,
          -1,
          0,
          1,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх.",
    "locationSources": [
      {
        "name": "Gothic Lock Picking — сундук Харима",
        "url": "https://gothic-lock-picking.com/en/locks/kharims-chest"
      },
      {
        "name": "StopGame — Харим у арены",
        "url": "https://stopgame.ru/show/161656/gothic_1_remake_prohozhdenie_glava_1_vse_syuzhetnye_i_pobochnye_kvesty/p2"
      }
    ]
  },
  {
    "id": "arena-big-house",
    "name": "Сундук на первом этаже здания арены",
    "originalName": "chest near arena big home",
    "camp": "old",
    "sector": "Арена — здание",
    "route": "Старый лагерь: первый этаж здания у арены. Это отдельный шестипластинный сундук, а не пяти­пластинный сундук Скатти.",
    "type": "chest",
    "floor": "1-й этаж",
    "contents": [],
    "valuable": false,
    "warnings": [
      "Не путать с сундуками Скатти и Харима рядом с ареной. Сверьте шесть стартовых позиций."
    ],
    "config": {
      "positions": [
        5,
        6,
        1,
        3,
        2,
        1
      ],
      "links": [
        [
          0,
          0,
          0,
          -1,
          0,
          0
        ],
        [
          -1,
          0,
          0,
          1,
          0,
          -1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          -1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          0,
          -1
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх. Ориентир дополнительно сопоставлен с Gothic.tools: опубликованная там последовательность безопасно открывает эту неизменённую конфигурацию. Это проверка согласованности источников, не собственная игровая проверка.",
    "locationSources": [
      {
        "name": "Gothic.tools — ориентиры и комбинации",
        "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions"
      }
    ]
  },
  {
    "id": "scatty-chest",
    "name": "Сундук Скатти",
    "originalName": "scatty chest",
    "camp": "old",
    "sector": "Хижина Скатти — между ареной и Снафом",
    "route": "Старый лагерь: хижина Скатти между ареной и Снафом; рядом стоит Фингерс. Нужный сундук находится внутри хижины.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кольцо для задания Фингерса"
    ],
    "valuable": true,
    "warnings": [
      "Это сундук Скатти для задания Фингерса. Не выбирайте другой сундук только по имени квестодателя."
    ],
    "config": {
      "positions": [
        6,
        3,
        2,
        1,
        7
      ],
      "links": [
        [
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          -1
        ],
        [
          0,
          1,
          -1,
          0,
          -1
        ],
        [
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх. Лагерь и назначение кольца дополнительно сверены по публичным страницам Gothic Locks и UnlockMyLoot; их код, тексты и база не импортировались.",
    "locationSources": [
      {
        "name": "Gothic Locks — Старый лагерь",
        "url": "https://gothiclocks.com/locks/scattys-chest/"
      },
      {
        "name": "UnlockMyLoot — кольцо для Фингерса",
        "url": "https://unlockmyloot.com/locks/scatty-chest/"
      },
      {
        "name": "Gothic.tools — ориентиры и комбинации",
        "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions"
      }
    ]
  },
  {
    "id": "ubert-mine-second",
    "name": "Второй сундук за Ульбертом",
    "originalName": "second chest behind ubert in mine",
    "camp": "other",
    "sector": "Старая шахта — кладовка Ульберта",
    "route": "В Старой шахте найдите склад, охраняемый Ульбертом на нижних уровнях. Вторая запись автора относится к сундуку за Ульбертом; рядом со складом есть второй тайник.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "В исходнике имя записано как Ubert. Здесь пять пластин; у первого сундука — шесть. Принадлежность именно к тайнику с припасами отдельно не проверена."
    ],
    "config": {
      "positions": [
        1,
        6,
        2,
        3,
        3
      ],
      "links": [
        [
          0,
          0,
          -1,
          0,
          0
        ],
        [
          -1,
          0,
          1,
          0,
          1
        ],
        [
          1,
          1,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          -1,
          1,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх.",
    "locationSources": [
      {
        "name": "ShowGamer — кладовка Ульберта",
        "url": "https://showgamer.com/guides/4511-gde-nayti-klyuch-ot-kladovki-ul-berta-v-gothic-1-remake"
      }
    ]
  },
  {
    "id": "ubert-mine-first",
    "name": "Первый сундук за Ульбертом",
    "originalName": "first chest behind ubert mine",
    "camp": "other",
    "sector": "Старая шахта — кладовка Ульберта",
    "route": "В Старой шахте спуститесь ниже места Аарона и Снайпса к Ульберту, который охраняет склад. Эта запись — первый сундук за ним по нумерации автора.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "В исходнике имя записано как Ubert. У двух сундуков за Ульбертом разные механизмы: здесь шесть пластин. Сверьте стартовые позиции."
    ],
    "config": {
      "positions": [
        7,
        6,
        2,
        6,
        4,
        2
      ],
      "links": [
        [
          0,
          1,
          0,
          0,
          -1,
          0
        ],
        [
          -1,
          0,
          0,
          -1,
          0,
          1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          -1,
          0,
          0,
          -1,
          1
        ],
        [
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх.",
    "locationSources": [
      {
        "name": "ShowGamer — кладовка Ульберта",
        "url": "https://showgamer.com/guides/4511-gde-nayti-klyuch-ot-kladovki-ul-berta-v-gothic-1-remake"
      }
    ]
  },
  {
    "id": "aaron-chest",
    "name": "Сундук Аарона",
    "originalName": "aaron chest",
    "camp": "other",
    "sector": "Старая шахта — главный ствол",
    "route": "В Старой шахте найдите Аарона возле его сундука в главном стволе; рядом находится Снайпс.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": {
      "positions": [
        1,
        5,
        6,
        6,
        6,
        5
      ],
      "links": [
        [
          0,
          0,
          0,
          0,
          0,
          -1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          -1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          -1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          1,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх.",
    "locationSources": [
      {
        "name": "Colony Guide — Аарон в Старой шахте",
        "url": "https://colony-guide.com/gothic-1-remake/npcs/aaron/"
      },
      {
        "name": "Gothic Lock Picking — сундук Аарона",
        "url": "https://gothic-lock-picking.com/en/locks/aarons-chest"
      }
    ]
  },
  {
    "id": "cor-galom-recipe",
    "name": "Кор Галом — сундук с рецептом",
    "originalName": "first cor kalom chest",
    "camp": "swamp",
    "sector": "Лаборатория Кор Галома",
    "route": "В лаборатории Кор Галома, между рабочими столами на первом этаже.",
    "type": "chest",
    "floor": "1-й этаж",
    "contents": [
      "Рецепт для задания Декстера"
    ],
    "valuable": true,
    "warnings": [
      "Отдельный замок на 4 пластины. Не путать с 6-пластинным сундуком в спальне."
    ],
    "config": {
      "positions": [
        7,
        7,
        6,
        1
      ],
      "links": [
        [
          0,
          0,
          0,
          1
        ],
        [
          1,
          0,
          0,
          1
        ],
        [
          1,
          -1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх. Назначение и этаж сверены по публичным страницам Gothic Locks и UnlockMyLoot. Матрица и позиции взяты только из MIT-источника Arminek.",
    "locationSources": [
      {
        "name": "Gothic Locks — сундук с рецептом",
        "url": "https://gothiclocks.com/locks/cor-kaloms-chest-recipe/"
      },
      {
        "name": "UnlockMyLoot — лаборатория, первый этаж",
        "url": "https://unlockmyloot.com/locks/cor-galom-chest/"
      }
    ]
  },
  {
    "id": "cor-galom-second-variant",
    "name": "Кор Галом — второй сундук, вариант источника",
    "originalName": "second cor kalom chest",
    "camp": "swamp",
    "sector": "Кор Галом — второй сундук",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Вариант Arminek начинается с 6, 5, 5, 7, 1, 4. У UnlockMyLoot для спальни указано 6, 6, 5, 7, 1, 4. Сверьте все шесть позиций; это разные исходные состояния.",
      "Исходная запись не указывает этаж. Привязка именно к спальне не подтверждена; сундук с рецептом имеет 4 пластины."
    ],
    "config": {
      "positions": [
        6,
        5,
        5,
        7,
        1,
        4
      ],
      "links": [
        [
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          -1,
          0,
          0,
          -1,
          0
        ],
        [
          -1,
          0,
          1,
          0,
          0,
          0
        ],
        [
          0,
          -1,
          0,
          1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх. Сохранён исходный вариант автора на 59 ходов без исправления по чужой базе. Этаж, маршрут и содержимое оставлены неизвестными."
  },
  {
    "id": "flooded-mine-left",
    "name": "Левый сундук у тела Каина",
    "originalName": "Left chest near cain body flooded mine",
    "camp": "other",
    "sector": "Заброшенная шахта — зал Неупокоенного орка",
    "route": "В Заброшенной шахте пройдите затопленные тоннели до финального зала с Неупокоенным орком и телом Каина. Нужен левый сундук в этом зале.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Не путать с подводным сундуком на развилке по пути к Каину: у него другой механизм."
    ],
    "config": {
      "positions": [
        4,
        5,
        6,
        5,
        1
      ],
      "links": [
        [
          0,
          0,
          0,
          -1,
          0
        ],
        [
          1,
          0,
          -1,
          0,
          -1
        ],
        [
          -1,
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          -1,
          0,
          -1
        ],
        [
          1,
          -1,
          0,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх. Ориентир дополнительно сопоставлен с Gothic.tools: опубликованная там последовательность безопасно открывает эту неизменённую конфигурацию. Это проверка согласованности источников, не собственная игровая проверка.",
    "locationSources": [
      {
        "name": "Gothic.tools — ориентиры и комбинации",
        "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions"
      },
      {
        "name": "Gothic Lock Picking — левый сундук в зале орка",
        "url": "https://gothic-lock-picking.com/en/locks/abandoned-mine-undead-orc-chest"
      },
      {
        "name": "WTFTime — Каин в Заброшенной шахте",
        "url": "https://wtftime.ru/guides/165215/propavshij-uchenik-v-gothic-1-remake-gde-najti-kaina/"
      }
    ]
  },
  {
    "id": "trial-of-fire-chest",
    "name": "Сундук «Испытание огнём»",
    "originalName": "Trial of fire chest",
    "camp": "other",
    "sector": "Испытание огнём — точное место не указано",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": {
      "positions": [
        5,
        1,
        7,
        7,
        6,
        4
      ],
      "links": [
        [
          0,
          0,
          0,
          0,
          1,
          -1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          1
        ],
        [
          -1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          -1,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          -1
        ],
        [
          0,
          0,
          -1,
          0,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх."
  },
  {
    "id": "stone-fortress-first",
    "name": "Горная крепость — первый сундук лаборатории",
    "originalName": "First chest stone fortress",
    "camp": "other",
    "sector": "Горная крепость — скрытая лаборатория",
    "route": "В скрытой лаборатории Горной крепости. Гайд называет его первым сундуком; чтобы отличить от второго, сверяйте исходные позиции.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Точная сторона помещения для первого сундука в проверенном гайде не указана."
    ],
    "config": {
      "positions": [
        5,
        7,
        7,
        6,
        3,
        1
      ],
      "links": [
        [
          0,
          1,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          -1,
          0,
          -1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          -1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          1,
          0,
          0,
          0,
          -1,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх. Ориентир дополнительно сопоставлен с Gothic.tools: опубликованная там последовательность безопасно открывает эту неизменённую конфигурацию. Это проверка согласованности источников, не собственная игровая проверка.",
    "locationSources": [
      {
        "name": "Gothic.tools — ориентиры и комбинации",
        "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions"
      }
    ]
  },
  {
    "id": "stone-fortress-second",
    "name": "Горная крепость — второй сундук лаборатории",
    "originalName": "second chect stone fortress",
    "camp": "other",
    "sector": "Горная крепость — скрытая лаборатория",
    "route": "В скрытой лаборатории Горной крепости. Это второй сундук по нумерации гайда; механизм отличается от первого.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Точная сторона помещения для второго сундука в проверенном гайде не указана."
    ],
    "config": {
      "positions": [
        2,
        2,
        6,
        6,
        4,
        7
      ],
      "links": [
        [
          0,
          0,
          1,
          0,
          -1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          -1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          -1,
          1,
          0,
          0,
          0,
          0
        ],
        [
          -1,
          -1,
          1,
          0,
          0,
          0
        ],
        [
          -1,
          0,
          0,
          -1,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх. Ориентир дополнительно сопоставлен с Gothic.tools: опубликованная там последовательность безопасно открывает эту неизменённую конфигурацию. Это проверка согласованности источников, не собственная игровая проверка.",
    "locationSources": [
      {
        "name": "Gothic.tools — ориентиры и комбинации",
        "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions"
      }
    ]
  },
  {
    "id": "stone-fortress-top",
    "name": "Горная крепость — сундук на вершине башни",
    "originalName": "Chest on top stone fortress",
    "camp": "other",
    "sector": "Горная крепость — вершина башни",
    "route": "На вершине башни Горной крепости. В гайде для подъёма указан навык лазания и встреча с гарпиями.",
    "type": "chest",
    "floor": "Наверху башни",
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": {
      "positions": [
        2,
        7,
        4,
        7,
        1,
        6
      ],
      "links": [
        [
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          -1,
          0,
          0,
          1
        ],
        [
          0,
          1,
          0,
          0,
          1,
          -1
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          -1,
          1,
          0,
          -1
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх. Ориентир дополнительно сопоставлен с Gothic.tools: опубликованная там последовательность безопасно открывает эту неизменённую конфигурацию. Это проверка согласованности источников, не собственная игровая проверка.",
    "locationSources": [
      {
        "name": "Gothic.tools — ориентиры и комбинации",
        "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions"
      }
    ]
  },
  {
    "id": "underwater-unspecified",
    "name": "Подводный сундук — место не указано",
    "originalName": "under water chest",
    "camp": "other",
    "sector": "Водоём не указан",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Эту запись нельзя уверенно отнести к конкретному водоёму. Сверьте механизм."
    ],
    "config": {
      "positions": [
        2,
        5,
        7,
        7
      ],
      "links": [
        [
          0,
          1,
          0,
          1
        ],
        [
          1,
          0,
          1,
          0
        ],
        [
          1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх."
  },
  {
    "id": "new-camp-buster-level-two",
    "name": "Сундук возле Бастера — взлом II",
    "originalName": "Lockpicking II: Chest inside new camp near buster",
    "camp": "new",
    "sector": "Внутри Нового лагеря, возле Бастера",
    "route": "Внутри Нового лагеря, возле Бастера. Точное положение относительно его хижины в исходнике не уточнено.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Автор пометил конфигурацию как Lockpicking II. Для другого уровня навыка связи могут отличаться."
    ],
    "config": {
      "positions": [
        5,
        4,
        3,
        1,
        2,
        2
      ],
      "links": [
        [
          0,
          0,
          0,
          0,
          -1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          1,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          -1,
          0,
          1,
          0,
          0,
          1
        ],
        [
          -1,
          1,
          -1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          -1,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх.",
    "locationSources": [
      {
        "name": "Arminek — исходный ориентир",
        "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md"
      }
    ]
  },
  {
    "id": "aarlan-cage",
    "name": "Клетка Aarlan",
    "originalName": "Aarlan prison cage",
    "camp": "other",
    "sector": "Тюремная клетка — точное место не указано",
    "route": null,
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Имя Aarlan сохранено как у автора: русское написание не проверено."
    ],
    "config": {
      "positions": [
        1,
        1,
        3,
        1,
        7,
        6,
        7
      ],
      "links": [
        [
          0,
          0,
          0,
          0,
          0,
          -1,
          0
        ],
        [
          0,
          0,
          1,
          0,
          -1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          -1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          -1,
          0,
          0
        ],
        [
          0,
          0,
          0,
          -1,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ],
        [
          -1,
          0,
          -1,
          0,
          0,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md",
      "license": "MIT",
      "revision": "98739a78084a1506530c4081a83e30bc0ca1c526"
    },
    "verification": "source",
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх."
  }
];
