/** Independently curated factual index. See docs/gothic-locks/FULL-AUDIT.md for provenance and exclusions. */
import type { LockConfig } from './types';
import type { Skill } from './skill';
export interface LockEntry {
 id:string; name:string; originalName:string; camp:'old'|'new'|'swamp'|'other'; region:string; sector:string;
 route:string|null; type:'chest'|'door'|'underwater'|'other'|'unknown'; floor:string|null; contents:string[]; valuable:boolean;
 warnings:string[]; config:LockConfig|null; profiles?:Partial<Record<Skill,LockConfig>>; gameVersion:string|null; chapter:string|null;
 source:{name:string;url:string;license:string;revision?:string}; locationSources?:{name:string;url:string}[];
 verification:'source'|'unknown'; notes:string; locationPrecision:'landmark'|'area'|'unknown'; identity:'known'|'uncertain';
 relatedIds?:string[];tags?:string[];plateCount:number|null; solutionStatus:'confirmed'|'unconfirmed';
}
export const CATALOG_LAST_REVIEWED='2026-10-16';
export const REGIONS=[
  {
    "id": "old-camp",
    "name": "Старый лагерь"
  },
  {
    "id": "new-camp",
    "name": "Новый лагерь"
  },
  {
    "id": "swamp-camp",
    "name": "Болотный лагерь"
  },
  {
    "id": "old-mine",
    "name": "Старая шахта"
  },
  {
    "id": "free-mine",
    "name": "Свободная шахта"
  },
  {
    "id": "abandoned-mine",
    "name": "Заброшенная шахта"
  },
  {
    "id": "mountain-fortress",
    "name": "Горная крепость"
  },
  {
    "id": "ruined-tower",
    "name": "Разрушенная башня"
  },
  {
    "id": "fog-tower",
    "name": "Туманная башня"
  },
  {
    "id": "cavalorn",
    "name": "Окрестности Кавалорна"
  },
  {
    "id": "caves",
    "name": "Пещеры"
  },
  {
    "id": "underwater",
    "name": "Подводные области"
  },
  {
    "id": "orc-cemetery",
    "name": "Кладбище орков"
  },
  {
    "id": "forest",
    "name": "Лес и лесорубы"
  },
  {
    "id": "monastery",
    "name": "Монастырь / испытание огня"
  },
  {
    "id": "alberto-mine",
    "name": "Шахта Альберто"
  },
  {
    "id": "wilderness",
    "name": "Дороги и дикая Колония"
  },
  {
    "id": "unknown",
    "name": "Место не установлено"
  }
];
export const TYPE_NAMES:Record<LockEntry['type'],string>={chest:'Сундук',door:'Дверь',underwater:'Подводный сундук',other:'Другой контейнер',unknown:'Тип не установлен'};
export const LOCK_CATALOG:LockEntry[] = [
  {
    "id": "cavalorn-above",
    "name": "Сундук у двух разбойников",
    "originalName": "Сундук у двух разбойников",
    "camp": "other",
    "sector": "Окрестности Кавалорна",
    "route": "Тропа между Старым и Новым лагерями; рядом двое разбойников, требующих имущество путника.",
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
      },
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/old-to-new-camp-bandits-chest/"
      }
    ],
    "region": "cavalorn",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "relatedIds": [],
    "tags": []
  },
  {
    "id": "cavalorn-tower-door",
    "name": "Дверь Разрушенной башни",
    "originalName": "Дверь Разрушенной башни",
    "camp": "other",
    "sector": "Окрестности Кавалорна",
    "route": "В основании разрушенной башни по дороге возле Старого лагеря.",
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
      },
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/ruined-tower-door/"
      }
    ],
    "region": "cavalorn",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "relatedIds": [],
    "tags": [
      "tower"
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
    ],
    "region": "ruined-tower",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "tags": [
      "tower"
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
    ],
    "region": "ruined-tower",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "tags": [
      "tower"
    ]
  },
  {
    "id": "kharim-chest",
    "name": "Сундук Кирго / «Харима» — спорная запись",
    "originalName": "kharim chest Kirgo",
    "camp": "old",
    "sector": "Арена — вход",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "В наблюдении указаны 7 пластин. Руководство по Хариму указывает 5; граф похож на замок Кирго. Принадлежность не установлена, маршрут Харима не подтверждает эту конфигурацию."
    ],
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
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх. Начальный вектор совпадает с прежней карточкой «Харим» на семь пластин. Golden Lockpick называет владельца Кирго; принадлежность требует проверки в игре.",
    "locationSources": [
      {
        "name": "Gothic Lock Picking — сундук Харима",
        "url": "https://gothic-lock-picking.com/en/locks/kharims-chest"
      },
      {
        "name": "StopGame — Харим у арены",
        "url": "https://stopgame.ru/show/161656/gothic_1_remake_prohozhdenie_glava_1_vse_syuzhetnye_i_pobochnye_kvesty/p2"
      },
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/kirgo/"
      }
    ],
    "region": "old-camp",
    "locationPrecision": "area",
    "identity": "uncertain",
    "chapter": null,
    "plateCount": 7,
    "solutionStatus": "unconfirmed",
    "relatedIds": [
      "kharim-chest"
    ],
    "tags": []
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
    ],
    "region": "old-camp",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "tags": []
  },
  {
    "id": "scatty-chest",
    "name": "Сундук Скатти",
    "originalName": "Scatty's chest",
    "camp": "old",
    "sector": "Старый лагерь",
    "route": "Жилище Скатти в Старом лагере.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кольцо для задания Фингерса",
      "Кольцо Скатти для Фингерса"
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
      },
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/scatty/"
      }
    ],
    "region": "old-camp",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "relatedIds": [],
    "tags": []
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
      },
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/ulbert/"
      }
    ],
    "region": "old-mine",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "relatedIds": [],
    "tags": [
      "mine"
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
    ],
    "region": "old-mine",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "tags": [
      "mine"
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
      },
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/aaron/"
      }
    ],
    "region": "old-mine",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "relatedIds": [],
    "tags": [
      "mine"
    ]
  },
  {
    "id": "cor-galom-recipe",
    "name": "Сундук Кор Галома — рецепт",
    "originalName": "Cor Kalom's chest",
    "camp": "swamp",
    "sector": "Болотный лагерь",
    "route": "Нижний этаж лаборатории Кор Галома; сундук помещён между рабочими столами.",
    "type": "chest",
    "floor": "1-й этаж",
    "contents": [
      "Рецепт для задания Декстера",
      "Рецепт для Декстера"
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
      },
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/corkalom/"
      }
    ],
    "region": "swamp-camp",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 4,
    "solutionStatus": "unconfirmed",
    "relatedIds": [],
    "tags": []
  },
  {
    "id": "cor-galom-second-variant",
    "name": "Второй сундук Кор Галома — спальня / спорное состояние",
    "originalName": "Сундук в спальне Кор Галома",
    "camp": "swamp",
    "sector": "Болотный лагерь",
    "route": "Спальня над лабораторией Кор Галома, второй этаж.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кольцо очищения",
      "Свиток пиромантии",
      "Алхимические материалы"
    ],
    "valuable": true,
    "warnings": [
      "Вариант Arminek начинается с 6, 5, 5, 7, 1, 4. У UnlockMyLoot для спальни указано 6, 6, 5, 7, 1, 4. Сверьте все шесть позиций; это разные исходные состояния.",
      "Исходная запись не указывает этаж. Привязка именно к спальне не подтверждена; сундук с рецептом имеет 4 пластины.",
      "Карточка объединяет сведения о спальне с предположительно относящимся к ней старым наблюдением. Это не третий подтверждённый сундук. Опубликованную старую конфигурацию используйте только после полной сверки."
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
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх. Сохранён исходный вариант автора на 59 ходов без исправления по чужой базе. Место и добыча относятся к описанию спальни; связь со старым наблюдением не подтверждена. Спальня — отдельный сундук над лабораторией. Начальный вектор руководства отличается от старой записи second-variant одной пластиной; переносить прежнее решение на эту карточку без проверки нельзя.",
    "region": "swamp-camp",
    "locationPrecision": "landmark",
    "identity": "uncertain",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/cor-galom-bedroom-chest/"
      }
    ],
    "relatedIds": [
      "cor-galom-second-variant"
    ],
    "tags": []
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
    ],
    "region": "abandoned-mine",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "tags": [
      "mine"
    ]
  },
  {
    "id": "trial-of-fire-chest",
    "name": "Ящик у огненного ящера",
    "originalName": "Ящик у огненного ящера",
    "camp": "other",
    "sector": "Пещеры",
    "route": "Малая пещера возле каменного круга с огненным ящером на востоке Колонии.",
    "type": "other",
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
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх.",
    "region": "caves",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/"
      }
    ],
    "relatedIds": [],
    "tags": [
      "cave"
    ]
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
    ],
    "region": "mountain-fortress",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "tags": [
      "castle"
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
    ],
    "region": "mountain-fortress",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "tags": [
      "castle"
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
    ],
    "region": "mountain-fortress",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "tags": [
      "castle"
    ]
  },
  {
    "id": "underwater-unspecified",
    "name": "Подводный сундук — место не указано",
    "originalName": "under water chest",
    "camp": "other",
    "sector": "Водоём не указан",
    "route": null,
    "type": "underwater",
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
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх.",
    "region": "underwater",
    "locationPrecision": "unknown",
    "identity": "uncertain",
    "chapter": null,
    "plateCount": 4,
    "solutionStatus": "unconfirmed",
    "tags": [
      "underwater"
    ]
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
    ],
    "region": "new-camp",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "tags": []
  },
  {
    "id": "aarlan-cage",
    "name": "Дверь камеры Арлина",
    "originalName": "Дверь камеры Арлина",
    "camp": "old",
    "sector": "Старый лагерь",
    "route": "Камеры под замком Старого лагеря, дальше входной двери темницы. Альтернатива взлому — ключ стражника.",
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
    "notes": "Конфигурация опубликована автором источника; в игре нами не проверена. Версия игры в записи отсутствует. Нумерация пластин снизу вверх.",
    "region": "old-camp",
    "locationPrecision": "landmark",
    "identity": "uncertain",
    "chapter": null,
    "plateCount": 7,
    "solutionStatus": "unconfirmed",
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/arlin-dungeon-key/"
      }
    ],
    "relatedIds": [],
    "tags": [
      "dungeon"
    ]
  },
  {
    "id": "bridge-near-new-camp",
    "name": "Замок у моста возле Нового лагеря",
    "originalName": "Замок у моста возле Нового лагеря",
    "camp": "other",
    "relatedIds": [],
    "tags": [],
    "region": "wilderness",
    "sector": "Дороги и дикая Колония",
    "route": null,
    "type": "unknown",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Тип предмета не уточнён в названии исходного наблюдения.",
      "Навык и версия игры для этой конфигурации не указаны; она не считается профилем «без навыка»."
    ],
    "config": {
      "positions": [
        6,
        5,
        2,
        5,
        7,
        4
      ],
      "links": [
        [
          0,
          1,
          -1,
          -1,
          1,
          1
        ],
        [
          -1,
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
          0,
          0,
          0,
          0,
          -1,
          0
        ],
        [
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
          0,
          0,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith — наблюдения игрока",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md#L663",
      "license": "MIT declaration in README/Cargo.toml; no standalone LICENSE"
    },
    "verification": "source",
    "notes": "Наблюдение игрока. Название указывает район; конкретный тип и принадлежность предмета не установлены.",
    "chapter": null,
    "plateCount": 6,
    "identity": "uncertain",
    "locationPrecision": "area",
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "orc-cemetery-baal-lukor",
    "name": "Замок на Кладбище орков у Баала Лукора",
    "originalName": "Замок на Кладбище орков у Баала Лукора",
    "camp": "other",
    "relatedIds": [],
    "tags": [],
    "region": "orc-cemetery",
    "sector": "Кладбище орков",
    "route": null,
    "type": "unknown",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Тип предмета не уточнён в названии исходного наблюдения.",
      "Навык и версия игры для этой конфигурации не указаны; она не считается профилем «без навыка»."
    ],
    "config": {
      "positions": [
        4,
        5,
        6,
        1,
        5,
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
          -1,
          1,
          -1,
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
      "name": "Arminek / nameless-locksmith — наблюдения игрока",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md#L740",
      "license": "MIT declaration in README/Cargo.toml; no standalone LICENSE"
    },
    "verification": "source",
    "notes": "Наблюдение игрока. Название указывает район; конкретный тип и принадлежность предмета не установлены.",
    "chapter": null,
    "plateCount": 6,
    "identity": "uncertain",
    "locationPrecision": "area",
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "wood-camp-stone-circle",
    "name": "Замок у лагеря лесорубов и каменного круга",
    "originalName": "Замок у лагеря лесорубов и каменного круга",
    "camp": "other",
    "relatedIds": [],
    "tags": [],
    "region": "forest",
    "sector": "Лес и лесорубы",
    "route": null,
    "type": "unknown",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Тип предмета не уточнён в названии исходного наблюдения.",
      "Навык и версия игры для этой конфигурации не указаны; она не считается профилем «без навыка»."
    ],
    "config": {
      "positions": [
        7,
        5,
        1,
        7,
        6,
        5,
        6
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
          1,
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
          1
        ],
        [
          1,
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
          -1,
          0,
          0,
          1
        ],
        [
          1,
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
          0,
          1,
          0
        ]
      ],
      "direction": "right-decreases"
    },
    "gameVersion": null,
    "source": {
      "name": "Arminek / nameless-locksmith — наблюдения игрока",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md#L831",
      "license": "MIT declaration in README/Cargo.toml; no standalone LICENSE"
    },
    "verification": "source",
    "notes": "Наблюдение игрока. Название указывает район; конкретный тип и принадлежность предмета не установлены.",
    "chapter": null,
    "plateCount": 7,
    "identity": "uncertain",
    "locationPrecision": "area",
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "guide-alberto",
    "name": "Сундук Альберто",
    "originalName": "Alberto's chest",
    "camp": "other",
    "region": "old-mine",
    "sector": "Старая шахта",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Принадлежность объекта в источниках расходится; нужна проверка в игре."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/alberto/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/alberto/"
      }
    ],
    "verification": "unknown",
    "notes": "Golden Lockpick указывает Старую шахту и шесть пластин. Три именованные карточки шахты Альберто в другом источнике имеют 5, 4 и 5 пластин; считать их дублями без подтверждения нельзя.",
    "tags": [
      "mine"
    ]
  },
  {
    "id": "guide-arto",
    "name": "Сундук Арто у ближней кровати",
    "originalName": "Arto's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Комната Арто; кровать, которая ближе к двери.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кольцо мощи",
      "Экстракт жизни",
      "Руда",
      "Столовые приборы"
    ],
    "valuable": true,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/arto/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/arto/"
      },
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/arto-near-bed-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "guide-baalcadar",
    "name": "Сундук Баала Кадара",
    "originalName": "Baal Cadar's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Болотный лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/baalcadar/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/baalcadar/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-baalnamib",
    "name": "Сундук Баала Намиба",
    "originalName": "Baal Namib's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Болотный лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/baalnamib/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/baalnamib/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-baalorun",
    "name": "Сундук Баала Оруна",
    "originalName": "Baal Orun's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Болотный лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/baalorun/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/baalorun/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-baalparvez",
    "name": "Сундук Баала Парвеза",
    "originalName": "Baal Parvez's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/baalparvez/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/baalparvez/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-baaltondral",
    "name": "Сундук Баала Тондрала",
    "originalName": "Baal Tondral's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Болотный лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/baaltondral/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/baaltondral/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-balam",
    "name": "Сундук Балама",
    "originalName": "Balam's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/balam/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/balam/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-bartholo",
    "name": "Сундук Бартоло",
    "originalName": "Bartholo's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/bartholo/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/bartholo/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-bettingowner",
    "name": "Сундук букмекера",
    "originalName": "Bookmaker's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/bettingowner/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/bettingowner/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-blade",
    "name": "Сундук Блэйда",
    "originalName": "Blade's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/blade/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/blade/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-bloodwyn",
    "name": "Сундук Бладвина",
    "originalName": "Bloodwyn's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/bloodwyn/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/bloodwyn/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-bruce",
    "name": "Сундук Брюса",
    "originalName": "Bruce's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/bruce/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/bruce/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-bullit",
    "name": "Сундук Буллита",
    "originalName": "Bullit's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/bullit/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/bullit/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-buster",
    "name": "Сундук Бастера",
    "originalName": "Buster's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/buster/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/buster/"
      }
    ],
    "verification": "unknown",
    "notes": "Существующая запись «у Бастера, 2-й уровень» имеет другой начальный вектор. Совпадение владельца и объекта не установлено.",
    "tags": []
  },
  {
    "id": "guide-butch",
    "name": "Сундук Бутча",
    "originalName": "Butch's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/butch/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/butch/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-chani",
    "name": "Сундук Чани",
    "originalName": "Chani's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Болотный лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/chani/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/chani/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-cipher",
    "name": "Сундук Сайфера",
    "originalName": "Cipher's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/cipher/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/cipher/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-corangar",
    "name": "Сундук Кор Ангара",
    "originalName": "Cor Angar's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Болотный лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/corangar/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/corangar/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-cord",
    "name": "Сундук Корда",
    "originalName": "Cord's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/cord/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/cord/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-corristo",
    "name": "Сундук Корристо",
    "originalName": "Corristo's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Часть замка Старого лагеря, занятая магами Огня.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/corristo/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/corristo/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-cronos",
    "name": "Сундук Кроноса",
    "originalName": "Cronos's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/cronos/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/cronos/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-cutter",
    "name": "Сундук Каттера",
    "originalName": "Cutter's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/cutter/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/cutter/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-damarok",
    "name": "Сундук Дамарока",
    "originalName": "Damarok's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/damarok/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/damarok/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-dexter",
    "name": "Сундук Декстера",
    "originalName": "Dexter's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 4,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/dexter/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/dexter/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-diego",
    "name": "Сундук Диего",
    "originalName": "Diego's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Дом юго-восточнее ворот внутреннего замка; у входа красная ткань и шкуры.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Эссенции исцеления",
      "Отмычки",
      "Руда"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/diego/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/diego/"
      },
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/diego-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "guide-drago",
    "name": "Сундук Драго",
    "originalName": "Drago's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/drago/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/drago/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-dusty",
    "name": "Сундук Дасти",
    "originalName": "Dusty's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/dusty/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/dusty/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-fingers",
    "name": "Сундук Фингерса",
    "originalName": "Fingers's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/fingers/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/fingers/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-fletcher",
    "name": "Сундук Флетчера",
    "originalName": "Fletcher's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/fletcher/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/fletcher/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-fortuno",
    "name": "Сундук Фортуно",
    "originalName": "Fortuno's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Болотный лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 7,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/fortuno/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/fortuno/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-gomez",
    "name": "Сундук у кровати Гомеза",
    "originalName": "Gomez's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Спальня Гомеза: сундук у ножного конца кровати.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Амулет защиты от пламени",
      "Экстракт силы",
      "Целебный эликсир",
      "Северные тёмные цветки"
    ],
    "valuable": true,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/gomez/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/gomez/"
      },
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/gomez-bedside-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "guide-gorhanis",
    "name": "Сундук Гор Ханиса",
    "originalName": "Gor Hanis's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/gorhanis/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/gorhanis/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-gorn",
    "name": "Сундук Горна",
    "originalName": "Gorn's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/gorn/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/gorn/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-graham",
    "name": "Сундук Грэхэма",
    "originalName": "Graham's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Хижина картографа у северных ворот: слева, перед первым котлом.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/graham/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/graham/"
      },
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/graham-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "guide-gravo",
    "name": "Сундук Граво",
    "originalName": "Gravo's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Хижина у входа во внутренний замок, напротив жилища Диего.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/gravo/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/gravo/"
      },
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "guide-grim",
    "name": "Сундук Грима",
    "originalName": "Grim's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Возле Диего у замковых ворот, с левой стороны.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/grim/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/grim/"
      },
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "guide-guy",
    "name": "Сундук Гая",
    "originalName": "Guy's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 7,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/guy/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/guy/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-herek",
    "name": "Сундук Херека",
    "originalName": "Herek's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 4,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/herek/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/herek/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-homer",
    "name": "Сундук Гомера",
    "originalName": "Homer's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/homer/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/homer/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-huno",
    "name": "Сундук Хуно",
    "originalName": "Huno's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кузница Хуно; сундук около наковальни.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/huno/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/huno/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-jackal",
    "name": "Сундук Шакала",
    "originalName": "Jackal's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/jackal/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/jackal/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-jeremiah",
    "name": "Сундук Иеремии",
    "originalName": "Jeremiah's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/jeremiah/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/jeremiah/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-jesse",
    "name": "Сундук Джесси",
    "originalName": "Jesse's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/jesse/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/jesse/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-kharim",
    "name": "Сундук Харима",
    "originalName": "Kharim's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Принадлежность объекта в источниках расходится; нужна проверка в игре."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/kharim/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/kharim/"
      }
    ],
    "verification": "unknown",
    "notes": "Golden Lockpick описывает пять пластин. Не объединять с прежней семи-пластинной карточкой «Харим»: её начальный вектор соответствует статье о Кирго.",
    "tags": []
  },
  {
    "id": "guide-kyle",
    "name": "Сундук Кайла",
    "originalName": "Kyle's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/kyle/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/kyle/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-lares",
    "name": "Сундук Лареса",
    "originalName": "Lares's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/lares/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/lares/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-lee",
    "name": "Сундук Ли",
    "originalName": "Lee's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/lee/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/lee/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-lefty",
    "name": "Сундук Лефти",
    "originalName": "Lefty's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/lefty/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/lefty/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-merdarion",
    "name": "Сундук Мердариона",
    "originalName": "Merdarion's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/merdarion/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/merdarion/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-milten",
    "name": "Сундук Мильтена",
    "originalName": "Milten's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 4,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/milten/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/milten/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-mordrag",
    "name": "Сундук Мордрага",
    "originalName": "Mordrag's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/mordrag/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/mordrag/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-mud",
    "name": "Сундук Мада",
    "originalName": "Mud's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/mud/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/mud/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-myxir",
    "name": "Сундук Миксира",
    "originalName": "Myxir's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/myxir/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/myxir/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-natalia",
    "name": "Сундук Наталии",
    "originalName": "Natalia's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Болотный лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/natalia/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/natalia/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-nefarius",
    "name": "Сундук Нефариуса",
    "originalName": "Nefarius's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Жилища магов Воды в Новом лагере.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/nefarius/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/nefarius/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-nyras",
    "name": "Сундук Нираса",
    "originalName": "Nyras's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Болотный лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/nyras/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/nyras/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-omid",
    "name": "Сундук Омида",
    "originalName": "Omid's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/omid/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/omid/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-orik",
    "name": "Сундук Орика",
    "originalName": "Orik's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/orik/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/orik/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-raven",
    "name": "Сундук у кровати Ворона",
    "originalName": "Raven's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Комната Ворона справа от покоев Гомеза; сундук рядом с кроватью.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Ключ от башни Ворона",
      "Кольцо защиты от огня",
      "Лечебные средства",
      "Монеты"
    ],
    "valuable": true,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 7,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/raven/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/raven/"
      },
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/voran-bedside-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "guide-ricelord",
    "name": "Сундук Рисового лорда",
    "originalName": "Rice Lord's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/ricelord/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/ricelord/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-riordian",
    "name": "Сундук Риордиана",
    "originalName": "Riordian's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Часть Нового лагеря, где находятся маги Воды.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/riordian/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/riordian/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-rodriguez",
    "name": "Сундук Родригеса",
    "originalName": "Rodriguez's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 4,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/rodriguez/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/rodriguez/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-santino",
    "name": "Сундук Сантино",
    "originalName": "Santino's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/santino/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/santino/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-saturas",
    "name": "Сундук Сатураса",
    "originalName": "Saturas's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Территория магов Воды в Новом лагере.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/saturas/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/saturas/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-scar",
    "name": "Сундук Шрама",
    "originalName": "Scar's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/scar/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/scar/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-scorpio",
    "name": "Сундук Скорпио",
    "originalName": "Scorpio's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/scorpio/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/scorpio/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-sharky",
    "name": "Сундук Шарки",
    "originalName": "Sharky's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/sharky/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/sharky/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-silas",
    "name": "Сундук Силаса",
    "originalName": "Silas's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/silas/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/silas/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-skip",
    "name": "Сундук Скипа",
    "originalName": "Skip's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/skip/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/skip/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-sly",
    "name": "Сундук Слая",
    "originalName": "Sly's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/sly/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/sly/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-snaf",
    "name": "Сундук Снафа",
    "originalName": "Snaf's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/snaf/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/snaf/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-stone",
    "name": "Сундук Стоуна",
    "originalName": "Stone's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/stone/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/stone/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-swiney",
    "name": "Сундук Суини",
    "originalName": "Swiney's chest",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/swiney/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/swiney/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [
      "mine"
    ]
  },
  {
    "id": "guide-thorus",
    "name": "Сундук Торуса",
    "originalName": "Thorus's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/thorus/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/thorus/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-torlof",
    "name": "Сундук Торлофа",
    "originalName": "Torlof's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/torlof/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/torlof/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-torrez",
    "name": "Сундук Торреза",
    "originalName": "Torrez's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/torrez/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/torrez/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-viran",
    "name": "Сундук Вирана",
    "originalName": "Viran's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Болотный лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/viran/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/viran/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-wedge",
    "name": "Сундук Веджа",
    "originalName": "Wedge's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/wedge/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/wedge/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-whistler",
    "name": "Сундук Уистлера",
    "originalName": "Whistler's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 4,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/whistler/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/whistler/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-wolf",
    "name": "Сундук Вольфа",
    "originalName": "Wolf's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/wolf/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/wolf/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "guide-yberion",
    "name": "Сундук Ю’Бериона",
    "originalName": "Yberion's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Болотный лагерь",
    "route": null,
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/yberion/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/yberion/"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": []
  },
  {
    "id": "fisk-hut-door",
    "name": "Входная дверь Фиска",
    "originalName": "Fisk hut-door",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Наружный вход в дом торговца Фиска.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено.",
    "tags": []
  },
  {
    "id": "fisk-storage-door",
    "name": "Дверь склада Фиска",
    "originalName": "Fisk storage-door",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Внутренняя дверь, ведущая из дома Фиска в кладовую.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено.",
    "tags": []
  },
  {
    "id": "fisk-chest-1",
    "name": "Сундук Фиска №1",
    "originalName": "Fisk chest-1",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кладовая Фиска за второй дверью; номер по источнику.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено.",
    "tags": []
  },
  {
    "id": "fisk-chest-2",
    "name": "Сундук Фиска №2",
    "originalName": "Fisk chest-2",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кладовая Фиска за второй дверью; номер по источнику.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено.",
    "tags": []
  },
  {
    "id": "fisk-chest-3",
    "name": "Сундук Фиска №3",
    "originalName": "Fisk chest-3",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кладовая Фиска за второй дверью; номер по источнику.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено.",
    "tags": []
  },
  {
    "id": "fisk-chest-4",
    "name": "Сундук Фиска №4",
    "originalName": "Fisk chest-4",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кладовая Фиска за второй дверью; номер по источнику.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено.",
    "tags": []
  },
  {
    "id": "fisk-chest-5",
    "name": "Сундук Фиска №5",
    "originalName": "Fisk chest-5",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кладовая Фиска за второй дверью; номер по источнику.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено.",
    "tags": []
  },
  {
    "id": "fisk-chest-6",
    "name": "Сундук Фиска №6",
    "originalName": "Fisk chest-6",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кладовая Фиска за второй дверью; номер по источнику.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено.",
    "tags": []
  },
  {
    "id": "fisk-chest-7",
    "name": "Сундук Фиска №7",
    "originalName": "Fisk chest-7",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кладовая Фиска за второй дверью; номер по источнику.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено.",
    "tags": []
  },
  {
    "id": "fisk-chest-8",
    "name": "Сундук Фиска №8",
    "originalName": "Fisk chest-8",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кладовая Фиска за второй дверью; номер по источнику.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "area",
    "identity": "uncertain",
    "plateCount": 4,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/fisk/"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено.",
    "tags": []
  },
  {
    "id": "swamp-camp-forge-chest",
    "name": "Сундук болотной кузницы",
    "originalName": "Сундук болотной кузницы",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Болотный лагерь",
    "route": "Внутри кузницы Болотного лагеря.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Одноручный топор",
      "Металл, древесина и кожаные полоски"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/swamp-camp-forge-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/swamp-camp-forge-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "rice-lord-storeroom",
    "name": "Дверь склада Рисового лорда, 3-й этаж",
    "originalName": "Дверь склада Рисового лорда, 3-й этаж",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Здание над рисовыми полями; нужная дверь находится на третьем этаже.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/rice-lord-storeroom/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/rice-lord-storeroom/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "gomez-chambers-door",
    "name": "Дверь покоев Гомеза",
    "originalName": "Дверь покоев Гомеза",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Внутренний замок, вход в жилые комнаты Гомеза.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/gomez-chambers-door/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/gomez-chambers-door/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "gomez-wall-chest",
    "name": "Сундук у стены в покоях Гомеза",
    "originalName": "Сундук у стены в покоях Гомеза",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Покои Гомеза; стена со стороны комнаты Ворона.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/gomez-wall-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/gomez-wall-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Матрица связей и решение не перенесены. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "raven-tower-left-chest",
    "name": "Башня Ворона: левый сундук у входа",
    "originalName": "Башня Ворона: левый сундук у входа",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Первый этаж башни Ворона, слева от входа.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кубки",
      "Столовые приборы",
      "Руда",
      "Монеты"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/raven-tower-left-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/raven-tower-left-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "raven-tower-right-chest",
    "name": "Башня Ворона: правый сундук у входа",
    "originalName": "Башня Ворона: правый сундук у входа",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Первый этаж башни Ворона, справа от входа.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Иззубренные топоры",
      "Ржавые мечи"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/raven-tower-right-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/raven-tower-right-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "silas-tavern-basement-chest",
    "name": "Подводный сундук под таверной Силаса",
    "originalName": "Подводный сундук под таверной Силаса",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Затопленный подвал таверны. Вход через подводный проход со стороны озера либо через склад.",
    "type": "underwater",
    "floor": null,
    "contents": [
      "Топор Брана, задание «По шею»"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/silas-tavern-basement-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/silas-tavern-basement-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [
      "underwater"
    ]
  },
  {
    "id": "silas-storeroom-chest",
    "name": "Сундук в кладовой таверны",
    "originalName": "Сундук в кладовой таверны",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "За Силасом пройти дверь склада; сундук стоит справа.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "silas-storeroom-door",
    "name": "Дверь кладовой таверны",
    "originalName": "Дверь кладовой таверны",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Таверна Нового лагеря; дверь позади бармена Силаса.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "jan-opposite-hut-chest",
    "name": "Сундук напротив Джана",
    "originalName": "Сундук напротив Джана",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Переплыть водоём у Нового лагеря к домику напротив Джана.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Чертёж «Дробитель камней»"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "mercenary-near-grim-chest",
    "name": "Сундук наёмника возле Грима",
    "originalName": "Сундук наёмника возле Грима",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Слева от Грима, неподалёку от Диего и ворот замка.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "gomez-throne-hall-chest",
    "name": "Сундук возле трона Гомеза",
    "originalName": "Сундук возле трона Гомеза",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "В тронном зале справа от сидящего Гомеза.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Чертёж королевского оружия",
      "Руда",
      "Рубины",
      "Кубок"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 4,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/gomez-throne-hall-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/gomez-throne-hall-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "old-camp-dungeon-door",
    "name": "Входная дверь темницы Старого лагеря",
    "originalName": "Входная дверь темницы Старого лагеря",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "За воротами Торуса повернуть направо, дойти до конца коридора и спуститься; ориентир — призрак возле темницы.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/old-camp-dungeon-door/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/old-camp-dungeon-door/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "gomez-wine-cellar",
    "name": "Дверь винного погреба Гомеза",
    "originalName": "Дверь винного погреба Гомеза",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Под жилой частью Гомеза: вертикальная лестница вниз, затем дверь в конце прохода.",
    "type": "door",
    "floor": null,
    "contents": [
      "Вино и складские припасы"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/gomez-wine-cellar/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/gomez-wine-cellar/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "arto-room-door",
    "name": "Дверь комнаты Арто",
    "originalName": "Дверь комнаты Арто",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "В жилых покоях замка слева, напротив комнаты Ворона.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/arto-room-door/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/arto-room-door/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "arto-far-bed-chest",
    "name": "Сундук Арто у дальней кровати",
    "originalName": "Сундук Арто у дальней кровати",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Комната Арто слева от покоев Гомеза; дальняя от входа кровать.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кольцо защиты от оружия",
      "Экстракты жизни",
      "Столовые приборы"
    ],
    "valuable": true,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/arto-far-bed-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/arto-far-bed-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "gomez-bedrooms-door",
    "name": "Дверь общей спальни замка",
    "originalName": "Дверь общей спальни замка",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Первая дверь на жилом этаже, где расположены комнаты Гомеза, Ворона и Арто.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/gomez-bedrooms-door/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/gomez-bedrooms-door/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "gomez-bedrooms-far-chest",
    "name": "Дальний сундук в общей спальне замка",
    "originalName": "Дальний сундук в общей спальне замка",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Спальня за первой дверью жилого этажа; дальняя кровать.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кольцо рудной кожи",
      "Экстракты жизни",
      "Вино и пиво"
    ],
    "valuable": true,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/gomez-bedrooms-far-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/gomez-bedrooms-far-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "gomez-bedrooms-near-chest",
    "name": "Ближний сундук в общей спальне замка",
    "originalName": "Ближний сундук в общей спальне замка",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Спальня за первой дверью жилого этажа; кровать у входа.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кольцо великой жизненной силы",
      "Экстракт жизни",
      "Целебный экстракт",
      "Столовые приборы"
    ],
    "valuable": true,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/gomez-bedrooms-near-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/gomez-bedrooms-near-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "raven-tower-floor2-stairs-chest",
    "name": "Башня Ворона: сундук у лестницы, этаж 2",
    "originalName": "Башня Ворона: сундук у лестницы, этаж 2",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "На втором этаже возле проёма лестницы с первого этажа.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Вино",
      "Крепкое вино",
      "Пиво"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/raven-tower-floor2-stairs-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/raven-tower-floor2-stairs-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "raven-tower-floor2-chest-2",
    "name": "Башня Ворона: второй сундук, этаж 2",
    "originalName": "Башня Ворона: второй сундук, этаж 2",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Второй этаж; следующий сундук после расположенного у лестницы.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Столовые приборы",
      "Монеты"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/raven-tower-floor2-chest-2/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/raven-tower-floor2-chest-2/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "raven-tower-floor3-entrance-chest",
    "name": "Башня Ворона: сундук у входа, этаж 3",
    "originalName": "Башня Ворона: сундук у входа, этаж 3",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "У выхода с лестницы на третьем этаже.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Волчьи когти",
      "Зубы",
      "Столовые приборы"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/raven-tower-floor3-entrance-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/raven-tower-floor3-entrance-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "raven-tower-floor3-empty-chest",
    "name": "Башня Ворона: пустой сундук, этаж 3",
    "originalName": "Башня Ворона: пустой сундук, этаж 3",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Третий этаж, после сундука у входа.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Пусто по сообщению источника"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/raven-tower-floor3-empty-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/raven-tower-floor3-empty-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "raven-tower-floor4-elixirs-chest",
    "name": "Башня Ворона: сундук с эликсирами, этаж 4",
    "originalName": "Башня Ворона: сундук с эликсирами, этаж 4",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Четвёртый этаж; слева от него расположен сундук с едой.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Эликсиры магической энергии",
      "Целебные эликсиры",
      "Экстракты"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 7,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/raven-tower-floor4-elixirs-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/raven-tower-floor4-elixirs-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "raven-tower-floor4-food-chest",
    "name": "Башня Ворона: сундук с провизией, этаж 4",
    "originalName": "Башня Ворона: сундук с провизией, этаж 4",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Четвёртый этаж, левее сундука с эликсирами.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Вино",
      "Пиво",
      "Окорока",
      "Жареное мясо"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/raven-tower-floor4-food-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/raven-tower-floor4-food-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "raven-tower-top-chest",
    "name": "Сундук на верхушке башни Ворона",
    "originalName": "Сундук на верхушке башни Ворона",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Самая верхняя площадка башни Ворона.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кольцо ловкости",
      "Зов сна",
      "Велайис"
    ],
    "valuable": true,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/raven-tower-top-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/raven-tower-top-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": []
  },
  {
    "id": "alberto-mine-hut-chest",
    "name": "Шахта Альберто: сундук в хижине",
    "originalName": "Шахта Альберто: сундук в хижине",
    "camp": "other",
    "region": "alberto-mine",
    "sector": "Шахта Альберто",
    "route": "Нижний этаж хижины у шахты Альберто. Название шахты в источниках расходится; сверьте исходные позиции.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Название шахты сообщено источником; принадлежность к большой Старой или Свободной шахте не подтверждена.",
      "Источники расходятся в месте: шахта Альберто либо склад у Яна в Старой шахте. Применяйте подсказку только при совпадении исходных пластин."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/alberto-mine-hut-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/alberto-mine-hut-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [
      "mine"
    ]
  },
  {
    "id": "alberto-mine-upstairs-left-chest",
    "name": "Шахта Альберто: верхний левый сундук",
    "originalName": "Шахта Альберто: верхний левый сундук",
    "camp": "other",
    "region": "alberto-mine",
    "sector": "Шахта Альберто",
    "route": "Подняться по лестнице из хижины; левый из двух сундуков наверху. Название шахты в источниках расходится; сверьте исходные позиции.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Название шахты сообщено источником; принадлежность к большой Старой или Свободной шахте не подтверждена.",
      "Источники расходятся в месте: шахта Альберто либо склад у Яна в Старой шахте. Применяйте подсказку только при совпадении исходных пластин."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "uncertain",
    "plateCount": 4,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/alberto-mine-upstairs-left-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/alberto-mine-upstairs-left-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [
      "mine"
    ]
  },
  {
    "id": "alberto-mine-upstairs-right-chest",
    "name": "Шахта Альберто: верхний правый сундук",
    "originalName": "Шахта Альберто: верхний правый сундук",
    "camp": "other",
    "region": "alberto-mine",
    "sector": "Шахта Альберто",
    "route": "Наверху лестницы из хижины, справа от второго сундука. Название шахты в источниках расходится; сверьте исходные позиции.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Название шахты сообщено источником; принадлежность к большой Старой или Свободной шахте не подтверждена.",
      "Источники расходятся в месте: шахта Альберто либо склад у Яна в Старой шахте. Применяйте подсказку только при совпадении исходных пластин."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "uncertain",
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "unlockmyloot.com",
      "url": "https://unlockmyloot.com/locks/alberto-mine-upstairs-right-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/alberto-mine-upstairs-right-chest/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [
      "mine"
    ]
  },
  {
    "id": "cavalorn-storeroom-door",
    "name": "Дверь склада Кавалорна в пещере",
    "originalName": "Дверь склада Кавалорна",
    "camp": "other",
    "region": "cavalorn",
    "sector": "Окрестности Кавалорна",
    "route": "Пещера с кротокрысом рядом с хижиной Кавалорна. Дверь склада находится в глубине пещеры.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": {
      "positions": [
        2,
        4,
        5,
        7,
        5,
        5
      ],
      "links": [
        [
          0,
          -1,
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
          1,
          0,
          0,
          0,
          -1,
          0
        ],
        [
          0,
          -1,
          -1,
          0,
          0,
          1
        ],
        [
          0,
          0,
          0,
          -1,
          0,
          1
        ],
        [
          1,
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
    "chapter": null,
    "locationPrecision": "landmark",
    "identity": "known",
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "source": {
      "name": "Arminek / nameless-locksmith — наблюдения игрока",
      "url": "https://github.com/Arminek/nameless-locksmith/blob/98739a78084a1506530c4081a83e30bc0ca1c526/history-of-locks.md#L53",
      "license": "MIT declaration in README/Cargo.toml; no standalone LICENSE"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/cavalorn-storeroom-door/"
      },
      {
        "name": "Nanomaks — дверь склада Кавалорна",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839"
      }
    ],
    "verification": "source",
    "notes": "Ручная схема Arminek сопоставлена с отдельно названной дверью склада. Последовательности проверяются математически, без независимого прохождения на PS5.",
    "tags": [
      "cave"
    ]
  },
  {
    "id": "jacko-cave-chest",
    "name": "Сундук Джако в пещере",
    "originalName": "Jacko's Chest",
    "camp": "other",
    "region": "caves",
    "sector": "Пещера к западу от водоёма Нового лагеря",
    "route": "В пещере к западу от водоёма Нового лагеря; ориентир — Джако.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Опубликованная комбинация предназначена для навыка «Без навыка». Исходные позиции и связи в wiki не приведены; проверка каждого хода на игровой схеме пока не выполнена."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "The Games Wiki — Lockpicking; авторы frostbyte99, Novaterra и участники",
      "url": "https://thegameswiki.com/gothic-1-remake/wiki/lockpicking",
      "license": "CC-BY-NC-SA-4.0"
    },
    "locationSources": [
      {
        "name": "Gothic.tools — ориентир сундука Джако",
        "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions"
      }
    ],
    "verification": "source",
    "notes": "Встроенная пошаговая комбинация из отдельной строки The Games Wiki. The Games Wiki contributors; статью создал frostbyte99, последняя указанная правка — Novaterra. Снимок источника: 16.10.2026. Адаптация: название переведено; команды представлены отдельными нажатиями, индексы пластин преобразованы из 1…N в 0…N−1. Номера пластин считаются снизу вверх.",
    "locationPrecision": "landmark",
    "identity": "known",
    "tags": [
      "The Games Wiki",
      "готовая комбинация",
      "без навыка"
    ],
    "plateCount": null,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "monastery-underground-cave-chest",
    "name": "Монастырь — сундук в подземной пещере",
    "originalName": "Monastery Ruins Chest",
    "camp": "other",
    "region": "monastery",
    "sector": "Руины монастыря — подземная пещера",
    "route": "В подземной пещере поверните направо и поднимитесь по уступам; сундук находится возле тел.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Опубликованная комбинация предназначена для навыка «Без навыка». Исходные позиции и связи в wiki не приведены; проверка каждого хода на игровой схеме пока не выполнена."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "The Games Wiki — Lockpicking; авторы frostbyte99, Novaterra и участники",
      "url": "https://thegameswiki.com/gothic-1-remake/wiki/lockpicking",
      "license": "CC-BY-NC-SA-4.0"
    },
    "locationSources": [
      {
        "name": "Patch Crazy — ориентир сундука монастыря",
        "url": "https://patchcrazy.co.uk/how-to-open-the-monastery-ruins-chest-in-gothic-1-remake/"
      }
    ],
    "verification": "source",
    "notes": "Встроенная пошаговая комбинация из отдельной строки The Games Wiki. The Games Wiki contributors; статью создал frostbyte99, последняя указанная правка — Novaterra. Снимок источника: 16.10.2026. Адаптация: название переведено; команды представлены отдельными нажатиями, индексы пластин преобразованы из 1…N в 0…N−1. Номера пластин считаются снизу вверх.",
    "locationPrecision": "landmark",
    "identity": "known",
    "tags": [
      "The Games Wiki",
      "готовая комбинация",
      "без навыка"
    ],
    "plateCount": null,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "new-camp-peasant-housing-door",
    "name": "Новый лагерь — дверь в жилье крестьян",
    "originalName": "New Camp Locked Cell Door",
    "camp": "new",
    "region": "new-camp",
    "sector": "Жильё крестьян — первый ярус настилов",
    "route": "Первый ярус деревянных настилов в жилье крестьян; за дверью лестница к сундуку.",
    "type": "door",
    "floor": "Первый ярус",
    "contents": [],
    "valuable": false,
    "warnings": [
      "Опубликованная комбинация предназначена для навыка «Без навыка». Исходные позиции и связи в wiki не приведены; проверка каждого хода на игровой схеме пока не выполнена."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "The Games Wiki — Lockpicking; авторы frostbyte99, Novaterra и участники",
      "url": "https://thegameswiki.com/gothic-1-remake/wiki/lockpicking",
      "license": "CC-BY-NC-SA-4.0"
    },
    "locationSources": [
      {
        "name": "Gothic.tools — ориентир двери в жилье крестьян",
        "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions"
      }
    ],
    "verification": "source",
    "notes": "Встроенная пошаговая комбинация из отдельной строки The Games Wiki. The Games Wiki contributors; статью создал frostbyte99, последняя указанная правка — Novaterra. Снимок источника: 16.10.2026. Адаптация: название переведено; команды представлены отдельными нажатиями, индексы пластин преобразованы из 1…N в 0…N−1. Номера пластин считаются снизу вверх.",
    "locationPrecision": "landmark",
    "identity": "known",
    "tags": [
      "The Games Wiki",
      "готовая комбинация",
      "без навыка"
    ],
    "plateCount": null,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "mountain-fortress-forge-orc-hammer-chest",
    "name": "Сундук с Орочьим молотом у Горной крепости",
    "originalName": "Orc Hammer Chest",
    "camp": "other",
    "region": "mountain-fortress",
    "sector": "Заброшенная кузница у моста",
    "route": "Заброшенная кузница возле моста к Горной крепости.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Опубликованная комбинация предназначена для навыка «Без навыка». Исходные позиции и связи в wiki не приведены; проверка каждого хода на игровой схеме пока не выполнена."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "The Games Wiki — Lockpicking; авторы frostbyte99, Novaterra и участники",
      "url": "https://thegameswiki.com/gothic-1-remake/wiki/lockpicking",
      "license": "CC-BY-NC-SA-4.0"
    },
    "locationSources": [
      {
        "name": "Gothic.tools — ориентир сундука с Орочьим молотом",
        "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions"
      }
    ],
    "verification": "source",
    "notes": "Встроенная пошаговая комбинация из отдельной строки The Games Wiki. The Games Wiki contributors; статью создал frostbyte99, последняя указанная правка — Novaterra. Снимок источника: 16.10.2026. Адаптация: название переведено; команды представлены отдельными нажатиями, индексы пластин преобразованы из 1…N в 0…N−1. Номера пластин считаются снизу вверх.",
    "locationPrecision": "landmark",
    "identity": "known",
    "tags": [
      "The Games Wiki",
      "готовая комбинация",
      "без навыка"
    ],
    "plateCount": null,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "xardas-tower-third-floor-chest",
    "name": "Башня Ксардаса — сундук на третьем этаже",
    "originalName": "Xardas Tower Chest",
    "camp": "other",
    "region": "wilderness",
    "sector": "Жилая башня Ксардаса — третий этаж",
    "route": "Третий этаж жилой башни Ксардаса в южной части Долины рудников.",
    "type": "chest",
    "floor": "Третий этаж",
    "contents": [],
    "valuable": false,
    "warnings": [
      "Опубликованная комбинация предназначена для навыка «Без навыка». Исходные позиции и связи в wiki не приведены; проверка каждого хода на игровой схеме пока не выполнена."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "The Games Wiki — Lockpicking; авторы frostbyte99, Novaterra и участники",
      "url": "https://thegameswiki.com/gothic-1-remake/wiki/lockpicking",
      "license": "CC-BY-NC-SA-4.0"
    },
    "locationSources": [
      {
        "name": "Patch Crazy — третий этаж башни Ксардаса",
        "url": "https://patchcrazy.co.uk/how-to-open-the-xardas-tower-chest-in-gothic-1-remake/"
      }
    ],
    "verification": "source",
    "notes": "Встроенная пошаговая комбинация из отдельной строки The Games Wiki. The Games Wiki contributors; статью создал frostbyte99, последняя указанная правка — Novaterra. Снимок источника: 16.10.2026. Адаптация: название переведено; команды представлены отдельными нажатиями, индексы пластин преобразованы из 1…N в 0…N−1. Номера пластин считаются снизу вверх.",
    "locationPrecision": "landmark",
    "identity": "known",
    "tags": [
      "The Games Wiki",
      "готовая комбинация",
      "без навыка"
    ],
    "plateCount": null,
    "solutionStatus": "unconfirmed"
  }
];

export const CATALOG_ALIASES:Record<string,string>={"cavalorn-cave-unknown":"cavalorn-storeroom-door"};

export function completeness(entry:LockEntry):'confirmed'|'location'|'incomplete' {
 if(entry.solutionStatus==='confirmed' && entry.profiles && Object.values(entry.profiles).some(Boolean)) return 'confirmed';
 return !entry.config && entry.identity==='known' && entry.locationPrecision!=='unknown' ? 'location' : 'incomplete';
}
export const CATALOG_COUNTS={total:LOCK_CATALOG.length,confirmed:LOCK_CATALOG.filter(e=>completeness(e)==='confirmed').length,location:LOCK_CATALOG.filter(e=>completeness(e)==='location').length,incomplete:LOCK_CATALOG.filter(e=>completeness(e)==='incomplete').length,observations:LOCK_CATALOG.filter(e=>e.config).length};
export function filterCatalog(options:{query?:string;area?:string;camp?:string|null;region?:string;type?:string;status?:string;valuable?:boolean;opened?:string[];hideOpened?:boolean}):LockEntry[] {
 const normalize=(s:string)=>s.toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
 return LOCK_CATALOG.filter(e=>(!options.camp||e.camp===options.camp)&&(!options.region||e.region===options.region)&&(!options.type||e.type===options.type)&&(!options.area||e.tags?.includes(options.area))&&(!options.status||completeness(e)===options.status)&&(!options.valuable||e.valuable)&&(!options.hideOpened||!options.opened?.includes(e.id))&&normalize([e.name,e.originalName,e.sector,e.route||'',REGIONS.find(r=>r.id===e.region)?.name||'',...e.contents].join(' ')).includes(normalize(options.query||'')));
}
