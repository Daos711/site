/** Independently curated factual index. See docs/gothic-locks/FULL-AUDIT.md for provenance and exclusions. */
import type { LockConfig } from './types';
import type { Skill } from './skill';
export interface LootSource { name:string; url:string; author?:string; license?:string }
export interface LootEvidence { coverage:'listed'|'partial'|'empty'; sources:LootSource[]; reviewedAt:string; note?:string }
export interface LockEntry {
 id:string; name:string; originalName:string; camp:'old'|'new'|'swamp'|'other'; region:string; sector:string;
 route:string|null; type:'chest'|'door'|'underwater'|'other'|'unknown'; floor:string|null; contents:string[]; valuable:boolean;
 warnings:string[]; config:LockConfig|null; profiles?:Partial<Record<Skill,LockConfig>>; gameVersion:string|null; chapter:string|null;
 source:{name:string;url:string;license:string;revision?:string}; locationSources?:{name:string;url:string}[];
 verification:'source'|'unknown'; notes:string; locationPrecision:'landmark'|'area'|'unknown'; identity:'known'|'uncertain';
 loot?:LootEvidence; lootExternal?:LootSource[];
 searchAliases?:string[];mapUrl?:string;access?:'lockpick'|'unlocked'|'key'|'unknown';
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
    "id": "wilderness",
    "name": "Дороги и дикая Колония"
  },
  {
    "id": "unknown",
    "name": "Место не установлено"
  },
  {
    "id": "old-camp-outskirts",
    "name": "Окрестности Старого лагеря"
  },
  {
    "id": "old-citadel",
    "name": "Старая цитадель"
  },
  {
    "id": "orc-territory",
    "name": "Земли и город орков"
  },
  {
    "id": "xardas-tower",
    "name": "Башня Ксардаса"
  },
  {
    "id": "shipwreck-coast",
    "name": "Побережье и затонувший корабль"
  },
  {
    "id": "outlaws-camp",
    "name": "Лагерь разбойников Квентина"
  },
  {
    "id": "exchange-zone",
    "name": "Зона обмена"
  },
  {
    "id": "sleeper-temple",
    "name": "Храм Спящего"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/blackmailers-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L20"
      }
    ],
    "region": "cavalorn",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "relatedIds": [],
    "tags": [],
    "searchAliases": [
      "145214"
    ]
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9045276"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021381"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-door-destroyed-tower/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/broken-tower-entrance"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%94%D0%B2%D0%B5%D1%80%D1%8C%20%D0%B2%20%D0%A0%D0%B0%D0%B7%D1%80%D1%83%D1%88%D0%B5%D0%BD%D0%BD%D0%BE%D0%B9%20%D0%BA%D1%80%D0%B5%D0%BF%D0%BE%D1%81%D1%82%D0%B8"
      }
    ],
    "region": "ruined-tower",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "relatedIds": [],
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "562211",
      "Кавалорн"
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
    "contents": [
      "Примитивный меч × 1",
      "Свиток «Огненная стрела» × 1",
      "Отмычка × 1",
      "Иззубренный топор × 1",
      "Стрела × 7",
      "Кусок руды × 26"
    ],
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9045276"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-destroyed-tower/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/broken-tower-chest-1"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%9F%D0%B5%D1%80%D0%B2%D1%8B%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%80%D0%B0%D0%B7%D1%80%D1%83%D1%88%D0%B5%D0%BD%D0%BD%D0%BE%D0%B9%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B5"
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
    ],
    "searchAliases": [
      "317432",
      "Кавалорн"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-destroyed-tower/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Gothic.tools team — Lockpicking & Chest Solutions",
          "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions#:~:text=Broken%20Tower%20Chest%20%231"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
    "contents": [
      "Кольцо железной кожи × 1",
      "Эссенция силы × 1",
      "Железо × 4",
      "Лабораторный флакон × 2",
      "Соль × 2",
      "Монета × 9"
    ],
    "valuable": true,
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9045276"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-upper-destroyed-tower/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/broken-tower-chest-2"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%92%D1%82%D0%BE%D1%80%D0%BE%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%80%D0%B0%D0%B7%D1%80%D1%83%D1%88%D0%B5%D0%BD%D0%BD%D0%BE%D0%B9%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B5"
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
    ],
    "searchAliases": [
      "536727",
      "Кавалорн"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-upper-destroyed-tower/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Gothic.tools team — Lockpicking & Chest Solutions",
          "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions#:~:text=Broken%20Tower%20Chest%20%232"
        },
        {
          "name": "Guszaban — GameFAQs, Ultimate Act I Progression Guide, v2",
          "url": "https://gamefaqs.gamespot.com/ps5/288748-gothic-1-remake/faqs/82626/general-walkthrough"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Добыча относится к верхнему сундуку разрушенной башни. Меч из неоднозначного описания двух сундуков не включён."
    }
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9043963"
      }
    ],
    "region": "old-camp",
    "locationPrecision": "area",
    "identity": "uncertain",
    "chapter": null,
    "plateCount": 7,
    "solutionStatus": "unconfirmed",
    "relatedIds": [],
    "tags": [],
    "searchAliases": [
      "3342371"
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
    "contents": [
      "Сталь × 1",
      "Рубин × 1",
      "Золото",
      "Кусок руды × 21"
    ],
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/arena-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BD%D0%B0%20%D0%90%D1%80%D0%B5%D0%BD%D0%B5"
      }
    ],
    "region": "old-camp",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "tags": [],
    "searchAliases": [
      "561321"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Guszaban — GameFAQs, Ultimate Act I Progression Guide, v2",
          "url": "https://gamefaqs.gamespot.com/ps5/288748-gothic-1-remake/faqs/82626/general-walkthrough"
        },
        {
          "name": "Gothic.tools team — Lockpicking & Chest Solutions",
          "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions#:~:text=Arena%20Chest"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Названия самостоятельно переведены; официальная русская локализация не подтверждена. По одному рубину и стали независимо указаны в GameFAQs."
    }
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
      "Кольцо Скатти",
      "Сковорода",
      "Сыр",
      "Хлеб",
      "Бритва",
      "Кирка",
      "Кусок руды × 16"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9043963"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/scattys-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%A1%D0%BA%D0%B0%D1%82%D1%82%D0%B8"
      }
    ],
    "region": "old-camp",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "relatedIds": [],
    "tags": [],
    "searchAliases": [
      "63217"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/walkthroughs/29870-priglashenie-v-staryj-lager-v-gothic-1-remake-kak-popast-v-zamok-i-vstupit-v-lager.html",
          "author": "lyubov",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        },
        {
          "name": "The Game Slayer — Santosh Kumar",
          "url": "https://thegameslayer.com/guides/gothic-1-remake-easy-steps-to-open-scattys-chest/"
        },
        {
          "name": "Golden Lockpick — кольцо Скатти",
          "url": "https://www.gothic-golden-lockpick-tool.com/blog/scatty/"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Источник от 7 июня, обновление 16 июня 2026; кроме руды количество отдельных предметов не указано."
    }
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
    "contents": [
      "Золото × 1",
      "Окорок × 3",
      "Хлеб × 3",
      "Пиво × 4",
      "Яблоко × 7"
    ],
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9143853"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ulberts-storage-shed-provisions-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BF%D0%BE%D0%B7%D0%B0%D0%B4%D0%B8%20%D0%A3%D0%BB%D1%8C%D0%B1%D0%B5%D1%80%D1%82%D0%B0"
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
    ],
    "searchAliases": [
      "16233"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/walkthroughs/29922-kladovka-ulberta-v-gothic-1-remake-gde-nahoditsja-alef-i-kak-obchistit-sklad-s-pripasami.html",
          "author": "Droommar",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Задний сундук с продовольствием: пройти справа вокруг кладовки."
    }
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
    "contents": [
      "Факел × 5",
      "Железо × 2",
      "Свиток «Светоч» × 2"
    ],
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ulberts-chest"
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
    ],
    "searchAliases": [
      "762642"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/walkthroughs/29922-kladovka-ulberta-v-gothic-1-remake-gde-nahoditsja-alef-i-kak-obchistit-sklad-s-pripasami.html",
          "author": "Droommar",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Первый сундук склада. Второй контейнер источник отдельно описывает как спрятанный за кладовкой."
    }
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
    "contents": [
      "Отмычка × 7",
      "Свиток «Исцеление» × 1",
      "Пиво × 1",
      "Кусок руды × 9"
    ],
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
    ],
    "searchAliases": [
      "156665"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/walkthroughs/29921-sunduk-arona-v-gothic-1-remake-kak-otvlech-arona-i-zabrat-soderzhimoe-sunduka.html",
          "author": "Droommar",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Перечень из прохождения задания; руда за завершение задания в добычу сундука не включена."
    }
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
      "Рецепт Кор Галома для Декстера"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105242"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-kor-galom/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/cor-kaloms-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%9A%D0%BE%D1%80%20%D0%93%D0%B0%D0%BB%D0%BE%D0%BC%D0%B0"
      }
    ],
    "region": "swamp-camp",
    "locationPrecision": "landmark",
    "identity": "known",
    "chapter": null,
    "plateCount": 4,
    "solutionStatus": "unconfirmed",
    "relatedIds": [],
    "tags": [],
    "searchAliases": [
      "7761"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-kor-galom/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/cor-galom-chest/"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Источники называют квестовый рецепт; остальная добыча не установлена."
    }
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
      "Сера × 3",
      "Тёмный цветок × 3",
      "Флакон × 2",
      "Изваяние"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105242"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/cor-kaloms-upper-lab-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BD%D0%B0%20%D0%B2%D0%B5%D1%80%D1%85%D0%BD%D0%B5%D0%BC%20%D1%8D%D1%82%D0%B0%D0%B6%D0%B5%20%D0%B4%D0%BE%D0%BC%D0%B0%20%D0%9A%D0%BE%D1%80%20%D0%93%D0%B0%D0%BB%D0%BE%D0%BC%D0%B0"
      }
    ],
    "relatedIds": [],
    "tags": [],
    "searchAliases": [
      "655714"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/cor-galom-bedroom-chest/"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
    "contents": [
      "Сталь × 1",
      "Посох Правосудия × 1",
      "Золото (слиток) × 1",
      "Монета × 13"
    ],
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
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-sunken-cove/"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BE%D1%80%D0%BA%D0%B0-%D0%BD%D0%B5%D0%B6%D0%B8%D1%82%D0%B8%20%D0%B2%20%D0%97%D0%B0%D0%B1%D1%80%D0%BE%D1%88%D0%B5%D0%BD%D0%BD%D0%BE%D0%B9%20%D1%88%D0%B0%D1%85%D1%82%D0%B5"
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
    ],
    "searchAliases": [
      "45651"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-sunken-cove/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
    "contents": [
      "Эссенция жизни × 1",
      "Экстракт магической энергии × 1",
      "Золото (слиток) × 1",
      "Отмычка × 3",
      "Древесина ивы × 2",
      "Перо × 1"
    ],
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#comment_572668602725070042"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-eastern-cave/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/shrine-of-innos-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L17"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%A1%D0%B2%D1%8F%D1%82%D0%B8%D0%BB%D0%B8%D1%89%D0%B5%20%D0%98%D0%BD%D0%BD%D0%BE%D1%81%D0%B0"
      }
    ],
    "relatedIds": [],
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "517764"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-eastern-cave/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
    "contents": [
      "Целебный эликсир × 1",
      "Целебный экстракт × 2",
      "Целебная эссенция × 4"
    ],
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105528"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-fort-summit-near-skeleton/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/mountain-fortress-hidden-laboratory-chest-1"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%9F%D0%B5%D1%80%D0%B2%D1%8B%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%81%D0%BA%D1%80%D1%8B%D1%82%D0%BE%D0%B9%20%D0%BB%D0%B0%D0%B1%D0%BE%D1%80%D0%B0%D1%82%D0%BE%D1%80%D0%B8%D0%B8%20%D0%93%D0%BE%D1%80%D0%BD%D0%BE%D0%B3%D0%BE%20%D1%84%D0%BE%D1%80%D1%82%D0%B0"
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
    ],
    "searchAliases": [
      "577631"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-fort-summit-near-skeleton/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/guides/30066-vse-sunduki-v-gornom-forte-v-gothic-1-remake-gde-najti-kak-otkryt-i-chto-lezhit-vnutri.html",
          "author": "Droommar",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Land of Games независимо перечисляет те же 4 целебные эссенции, 2 экстракта и 1 эликсир."
    }
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
    "contents": [
      "Эликсир магической энергии × 1",
      "Экстракт магической энергии × 2",
      "Эссенция магической энергии × 3"
    ],
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105528"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-fort-summit-near-table/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/mountain-fortress-hidden-laboratory-chest-2"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%92%D1%82%D0%BE%D1%80%D0%BE%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%81%D0%BA%D1%80%D1%8B%D1%82%D0%BE%D0%B9%20%D0%BB%D0%B0%D0%B1%D0%BE%D1%80%D0%B0%D1%82%D0%BE%D1%80%D0%B8%D0%B8%20%D0%93%D0%BE%D1%80%D0%BD%D0%BE%D0%B3%D0%BE%20%D1%84%D0%BE%D1%80%D1%82%D0%B0"
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
    ],
    "searchAliases": [
      "226647"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-fort-summit-near-table/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/guides/30066-vse-sunduki-v-gornom-forte-v-gothic-1-remake-gde-najti-kak-otkryt-i-chto-lezhit-vnutri.html",
          "author": "Droommar",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Land of Games независимо перечисляет те же 3 эссенции, 2 экстракта и 1 эликсир магической энергии."
    }
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
    "contents": [
      "Руна «Кулак шторма» × 1",
      "Ключ от сундука × 1",
      "Кольцо озарения × 1",
      "Меч «Приносящий победу» × 1",
      "Экстракт ловкости × 1",
      "Целебный экстракт × 3",
      "Монета × 25"
    ],
    "valuable": true,
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105528"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-the-fort-summit/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/mountain-fortress-top-tower-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BD%D0%B0%20%D0%B2%D0%B5%D1%80%D1%88%D0%B8%D0%BD%D0%B5%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B8%20%D0%B2%20%D0%93%D0%BE%D1%80%D0%BD%D0%BE%D0%BC%20%D1%84%D0%BE%D1%80%D1%82%D0%B5"
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
    ],
    "searchAliases": [
      "274716"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-the-fort-summit/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/guides/30066-vse-sunduki-v-gornom-forte-v-gothic-1-remake-gde-najti-kak-otkryt-i-chto-lezhit-vnutri.html",
          "author": "Droommar",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        },
        {
          "name": "Nanomaks — Steam",
          "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105528"
        },
        {
          "name": "Gothic Lock Picking",
          "url": "https://gothic-lock-picking.com/en/locks/mountain-fortress-top-tower-chest"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Второй источник подтверждает ключ, кольцо, руну, меч и 3 целебных экстракта; прочие предметы в этом источнике не перечислены."
    }
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
    ],
    "locationSources": [
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#comment_581680955258908417"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#comment_570415324159092598"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/underwater-wreck-chest-for-myxir-quest"
      }
    ],
    "searchAliases": [
      "2577"
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
    "tags": [],
    "searchAliases": [
      "543122"
    ]
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/bandits-cell"
      }
    ],
    "relatedIds": [],
    "tags": [
      "dungeon"
    ],
    "searchAliases": [
      "1131767"
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
    "solutionStatus": "unconfirmed",
    "locationSources": [
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D1%88%D0%B0%D0%BD%D1%82%D0%B0%D0%B6%D0%B8%D1%81%D1%82%D0%BE%D0%B2"
      }
    ],
    "searchAliases": [
      "652574"
    ]
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
    "solutionStatus": "unconfirmed",
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-orcs-cemetary/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/orc-cemetery-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L29"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BD%D0%B0%20%D0%9A%D0%BB%D0%B0%D0%B4%D0%B1%D0%B8%D1%89%D0%B5%20%D0%BE%D1%80%D0%BA%D0%BE%D0%B2"
      }
    ],
    "searchAliases": [
      "456151"
    ]
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
    "solutionStatus": "unconfirmed",
    "locationSources": [
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9045276"
      }
    ],
    "searchAliases": [
      "7517656"
    ]
  },
  {
    "id": "guide-alberto",
    "name": "Сундук у Яна и Альберто",
    "originalName": "Alberto's chest",
    "camp": "other",
    "region": "old-mine",
    "sector": "Старая шахта — склад у Яна и Альберто",
    "route": "Старая шахта, основной склад у Яна и Альберто; сундук справа от Яна.",
    "type": "chest",
    "floor": "Нижний этаж склада",
    "contents": [
      "Целебная эссенция × 2",
      "Кирка × 3",
      "Факел × 4"
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
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/alberto/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/alberto/"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-jan-old-mine-on-right/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/albertos-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=721147"
      },
      {
        "name": "GameFAQs — General Walkthrough",
        "url": "https://gamefaqs.gamespot.com/ps5/288748-gothic-1-remake/faqs/82626/general-walkthrough"
      },
      {
        "name": "Land of Games — Кладовка Ульберта",
        "url": "https://landofgames.ru/articles/walkthroughs/29922-kladovka-ulberta-v-gothic-1-remake-gde-nahoditsja-alef-i-kak-obchistit-sklad-s-pripasami.html"
      }
    ],
    "verification": "unknown",
    "notes": "Место уточнено: склад Яна и Альберто в Старой шахте. Название источника «шахта Альберто» описывало место рядом с персонажем, а не отдельный подтверждённый район. Этаж, сторона и число пластин совпадают в независимых описаниях. Версия игры не установлена; собственной проверки в игре не было.",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "Сундук Альберто",
      "склад Яна",
      "721147"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-jan-old-mine-on-right/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      "Столовые приборы",
      "Кусок руды × 22"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-gomez-castle-second-floor-far-room-on-right/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/artos-chest"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ore-baron-manor-upper-floor-near-bed-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L31"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%9F%D0%B5%D1%80%D0%B2%D1%8B%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%BA%D0%BE%D0%BC%D0%BD%D0%B0%D1%82%D0%B5%20%D0%90%D1%80%D1%82%D0%BE%20%D0%B8%20%D0%A2%D0%BE%D1%80%D1%80%D0%B5%D0%B7%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "265657"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/arto-near-bed-chest/"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105242"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/baal-cadars-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B4%D0%BE%D0%BC%D0%B5%20%D0%98%D0%B4%D0%BE%D0%BB%D0%B0%20%D0%9A%D0%B0%D0%B4%D0%B0%D1%80%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105242"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/baal-namibs-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
    "contents": [
      "Свиток «Сон»"
    ],
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105242"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/baal-oruns-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": [],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Guszaban — GameFAQs",
          "url": "https://gamefaqs.gamespot.com/ps5/288748-gothic-1-remake/faqs/82626/general-walkthrough"
        },
        {
          "name": "Gothic Lock Picking",
          "url": "https://gothic-lock-picking.com/en/locks/baal-oruns-chest"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Количество свитков не указано. Точное местоположение сундука и соответствие механизма требуют сверки."
    }
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/baal-parvezs-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/baal-tondrals-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/balams-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/bartholos-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/bookmakers-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/blades-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-right-near-stairs-sleeping-room/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/bloodwyns-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/bruces-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/bullits-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/busters-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Существующая запись «у Бастера, 2-й уровень» имеет другой начальный вектор. Совпадение владельца и объекта не установлено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/butchs-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
  },
  {
    "id": "guide-chani",
    "name": "Сундук Чани",
    "originalName": "Chani's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Храм Ю’Бериона · правая комната",
    "route": "Храм Ю’Бериона, сундук в правой боковой комнате по описанию источников.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Экстракт магической энергии × 2",
      "Зов сна",
      "Велайис (Velayis) × 3",
      "Жареное мясо × 4",
      "Кусок руды × 10"
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
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/chani/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/chani/"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105242"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/chanis-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L27"
      },
      {
        "name": "MIT-наблюдение Vladislav Durnev",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L26"
      },
      {
        "name": "Lorthiz — описание конкретного объекта",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=63167"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение идентичности: Физический объект сопоставлен по подписи места в MIT-наблюдении, совпадению исходных позиций и полному воспроизведению механизма; именная карточка Golden независимо связывает тот же отпечаток с названием. Это установление объекта по источникам, не проверка в игре. Имя владелицы приведено по Golden; MIT и Lorthiz независимо подтверждают расположение комнаты, но не имя владелицы.",
    "tags": [],
    "searchAliases": [
      "63167"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Planet of Gothic — Chanis Truhe",
          "url": "https://www.planetofgothic.de/tools/atlas/truhen/sumpflager#truhe-1949"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Названия самостоятельно переведены; официальная русская локализация не подтверждена. Атлас помечает карточки сообщества как непроверенные."
    },
    "lootExternal": [
      {
        "name": "Planet of Gothic — выбранный сундук на карте",
        "url": "https://www.planetofgothic.de/tools/atlas?poi=1949"
      }
    ]
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026811"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ciphers-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9064903"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#comment_581680955258896479"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/cor-angars-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/cords-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/corristos-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
  },
  {
    "id": "guide-cronos",
    "name": "Сундук Кроноса",
    "originalName": "Cronos's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Квартал магов Воды · дом Кроноса",
    "route": "Квартал магов Воды в Новом лагере, дом Кроноса; в схеме Lorthiz — второе строение слева.",
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
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/cronos/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/cronos/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/cronoss-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L53"
      },
      {
        "name": "MIT-наблюдение Vladislav Durnev",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L52"
      },
      {
        "name": "Lorthiz — описание конкретного объекта",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=635126"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение идентичности: Физический объект сопоставлен по подписи места в MIT-наблюдении, совпадению исходных позиций и полному воспроизведению механизма; именная карточка Golden независимо связывает тот же отпечаток с названием. Это установление объекта по источникам, не проверка в игре.",
    "tags": [],
    "searchAliases": [
      "635126"
    ]
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/cutters-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/damaroks-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
  },
  {
    "id": "guide-dexter",
    "name": "Сундук Декстера",
    "originalName": "Dexter's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Маленькая хижина напротив Фиска на рынке, со стороны Мордрага.",
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
      },
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/dexters-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%BC%D0%B0%D0%BB%D0%B5%D0%BD%D1%8C%D0%BA%D0%BE%D0%B9%20%D0%BB%D0%B0%D1%87%D1%83%D0%B3%D0%B5%20%D0%BD%D0%B0%D0%BF%D1%80%D0%BE%D1%82%D0%B8%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D1%8B%20%D0%A4%D0%B8%D1%81%D0%BA%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      "Эссенция исцеления × 5",
      "Отмычка × 3",
      "Кусок руды × 22"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026797"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/diegos-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%94%D0%B8%D0%B5%D0%B3%D0%BE"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "216547"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/diego-chest/"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "UnlockMyLoot приводит эти три количества со ссылкой на Game8. Прямую страницу Game8 независимо найти не удалось; это вторичное сообщение, а не отдельная игровая проверка. Припасы без названий не добавлены."
    }
  },
  {
    "id": "guide-drago",
    "name": "Сундук Драго",
    "originalName": "Drago's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Внутренний замок · покои магов Огня",
    "route": "Покои магов Огня во внутреннем замке Старого лагеря: сундук в левой комнате.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кусок руды × 22",
      "Вино × 4",
      "Экстракт магической энергии × 2",
      "Могущественное искусство × 1",
      "Основы магии × 1"
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
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/drago/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/drago/"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-firemages-rooms/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/dragos-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L59"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%94%D1%80%D0%B0%D0%B3%D0%BE%20%D0%BD%D0%B0%20%D0%BD%D0%B8%D0%B6%D0%BD%D0%B5%D0%BC%20%D1%8D%D1%82%D0%B0%D0%B6%D0%B5%20%D0%BF%D0%BE%D0%BA%D0%BE%D0%B5%D0%B2%20%D0%9C%D0%B0%D0%B3%D0%BE%D0%B2%20%D0%BE%D0%B3%D0%BD%D1%8F"
      },
      {
        "name": "MIT-наблюдение Vladislav Durnev",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L58"
      },
      {
        "name": "Lorthiz — описание конкретного объекта",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=73737"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение идентичности: Физический объект сопоставлен по подписи места в MIT-наблюдении, совпадению исходных позиций и полному воспроизведению механизма; именная карточка Golden независимо связывает тот же отпечаток с названием. Это установление объекта по источникам, не проверка в игре. Имя мага приведено по Golden; MIT отдельно задаёт комнату и положение сундука, Lorthiz подтверждает номер сундука в соответствующей комнате.",
    "tags": [],
    "searchAliases": [
      "73737"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-firemages-rooms/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/dustys-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9043963"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/fingerss-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%A4%D0%B8%D0%BD%D0%B3%D0%B5%D1%80%D1%81%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/fletchers-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105242"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/fortunos-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      "Амулет защиты от пламени × 1",
      "Экстракт силы × 1",
      "Целебный эликсир × 1",
      "Северный тёмный × 2"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-gomez-room/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/gomezs-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L45"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "61217"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-gomez-room/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/gomez-bedside-chest/"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9043963"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/gor-haniss-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%93%D0%BE%D1%80%20%D0%A5%D0%B0%D0%BD%D0%B8%D1%81%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/gorns-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
    "contents": [
      "Пустой свиток × 5",
      "Полоски кожи × 2",
      "Жареное мясо × 2",
      "Миска (Schüssel)",
      "Кусок руды × 12"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9103187"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/grahams-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BA%D0%B0%D1%80%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B0%20%D0%93%D1%80%D1%8D%D1%85%D0%B5%D0%BC%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "722613"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/graham-chest/"
        },
        {
          "name": "Planet of Gothic — Grahams Truhe",
          "url": "https://www.planetofgothic.de/tools/atlas/truhen/altes-lager#truhe-1802"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Названия самостоятельно переведены; официальная русская локализация не подтверждена. Атлас помечает карточки сообщества как непроверенные."
    },
    "lootExternal": [
      {
        "name": "Planet of Gothic — выбранный сундук на карте",
        "url": "https://www.planetofgothic.de/tools/atlas?poi=1802"
      }
    ]
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
    "contents": [
      "Сыр",
      "Жареное мясо",
      "Миска (Schüssel)",
      "Кусок руды × 19"
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/gravos-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%93%D1%80%D0%B0%D0%B2%D0%BE"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "62115"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Planet of Gothic — Gravos Truhe",
          "url": "https://www.planetofgothic.de/tools/atlas/truhen/altes-lager#truhe-1803"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Названия самостоятельно переведены; официальная русская локализация не подтверждена. Атлас помечает карточки сообщества как непроверенные. Название зелья исключено: другие руководства называют иной лечебный предмет."
    },
    "lootExternal": [
      {
        "name": "Planet of Gothic — выбранный сундук на карте",
        "url": "https://www.planetofgothic.de/tools/atlas?poi=1803"
      }
    ]
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
    "contents": [
      "Полоски кожи",
      "Сковорода",
      "Сыр × 3",
      "Хлеб × 2",
      "Бритва",
      "Миска (Schüssel)",
      "Кусок руды × 5"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026797"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/grims-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%93%D1%80%D0%B8%D0%BC%D0%B0%20%D0%BD%D0%B5%D0%BF%D0%BE%D0%B4%D0%B0%D0%BB%D0%B5%D0%BA%D1%83%20%D0%BE%D1%82%20%D0%BB%D0%B0%D1%87%D1%83%D0%B3%D0%B8%20%D0%94%D0%B8%D0%B5%D0%B3%D0%BE"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "524145"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Planet of Gothic — Grims Truhe",
          "url": "https://www.planetofgothic.de/tools/atlas/truhen/altes-lager#truhe-1804"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Названия самостоятельно переведены; официальная русская локализация не подтверждена. Атлас помечает карточки сообщества как непроверенные."
    },
    "lootExternal": [
      {
        "name": "Planet of Gothic — выбранный сундук на карте",
        "url": "https://www.planetofgothic.de/tools/atlas?poi=1804"
      }
    ]
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/guys-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/hereks-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/homers-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/hunos-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BA%D1%83%D0%B7%D0%BD%D0%B5%D1%86%D0%B0%20%D0%A5%D1%83%D0%BD%D0%BE"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/jackals-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/jeremiahs-chest"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-tavern-second-floor-chest-1"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%9F%D0%B5%D1%80%D0%B2%D1%8B%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BD%D0%B0%20%D0%B2%D1%82%D0%BE%D1%80%D0%BE%D0%BC%20%D1%8D%D1%82%D0%B0%D0%B6%D0%B5%20%D1%82%D0%B0%D0%B2%D0%B5%D1%80%D0%BD%D1%8B"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/jesses-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
    "tags": [],
    "searchAliases": []
  },
  {
    "id": "guide-kyle",
    "name": "Сундук Кайла",
    "originalName": "Kyle's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Жилые хижины за рынком · хижина Кайла",
    "route": "Старый лагерь, хижина Кайла в жилой части за рынком. В описании Lorthiz отмечен проход через две двери.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Сыр × 3",
      "Вода",
      "Кувшин",
      "Кусок руды × 16"
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
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/kyle/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/kyle/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/kyles-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L73"
      },
      {
        "name": "MIT-наблюдение Vladislav Durnev",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L72"
      },
      {
        "name": "Lorthiz — описание конкретного объекта",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=717317"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение идентичности: Физический объект сопоставлен по подписи места в MIT-наблюдении, совпадению исходных позиций и полному воспроизведению механизма; именная карточка Golden независимо связывает тот же отпечаток с названием. Это установление объекта по источникам, не проверка в игре.",
    "tags": [],
    "searchAliases": [
      "717317"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Planet of Gothic — Kyles Truhe",
          "url": "https://www.planetofgothic.de/tools/atlas/truhen/altes-lager#truhe-1828"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Названия самостоятельно переведены; официальная русская локализация не подтверждена. Атлас помечает карточки сообщества как непроверенные."
    },
    "lootExternal": [
      {
        "name": "Planet of Gothic — выбранный сундук на карте",
        "url": "https://www.planetofgothic.de/tools/atlas?poi=1828"
      }
    ]
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026811"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/laress-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
  },
  {
    "id": "guide-lee",
    "name": "Сундук Ли",
    "originalName": "Lee's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь · помещение Ли",
    "route": "Сундук в помещении Ли в Новом лагере.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кольцо силы (Ring der Kraft)",
      "Рисовый шнапс × 3",
      "Сковорода",
      "Амфора × 2",
      "Рис × 4",
      "Кувшин",
      "Стрелы × 27",
      "Кусок руды × 26"
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
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/lee/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/lee/"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026811"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/lees-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L25"
      },
      {
        "name": "MIT-наблюдение Vladislav Durnev",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L24"
      },
      {
        "name": "Lorthiz — описание конкретного объекта",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=622457"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение идентичности: Физический объект сопоставлен по подписи места в MIT-наблюдении, совпадению исходных позиций и полному воспроизведению механизма; именная карточка Golden независимо связывает тот же отпечаток с названием. Это установление объекта по источникам, не проверка в игре.",
    "tags": [],
    "searchAliases": [
      "622457"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Planet of Gothic — Lees Truhe",
          "url": "https://www.planetofgothic.de/tools/atlas/truhen/neues-lager#truhe-1651"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Названия самостоятельно переведены; официальная русская локализация не подтверждена. Атлас помечает карточки сообщества как непроверенные."
    },
    "lootExternal": [
      {
        "name": "Planet of Gothic — выбранный сундук на карте",
        "url": "https://www.planetofgothic.de/tools/atlas?poi=1651"
      }
    ]
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/leftys-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
  },
  {
    "id": "guide-merdarion",
    "name": "Сундук Мердариона",
    "originalName": "Merdarion's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Квартал магов Воды · дом Мердариона",
    "route": "Квартал магов Воды в Новом лагере, дом Мердариона; в схеме Lorthiz — четвёртое строение справа.",
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
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/merdarion/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/merdarion/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/merdarions-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L52"
      },
      {
        "name": "MIT-наблюдение Vladislav Durnev",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L51"
      },
      {
        "name": "Lorthiz — описание конкретного объекта",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=65147"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение идентичности: Физический объект сопоставлен по подписи места в MIT-наблюдении, совпадению исходных позиций и полному воспроизведению механизма; именная карточка Golden независимо связывает тот же отпечаток с названием. Это установление объекта по источникам, не проверка в игре.",
    "tags": [],
    "searchAliases": [
      "65147"
    ]
  },
  {
    "id": "guide-milten",
    "name": "Сундук Мильтена",
    "originalName": "Milten's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Внутренний замок · покои магов Огня",
    "route": "Покои магов Огня во внутреннем замке Старого лагеря: правая комната, левый из трёх сундуков.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Целебный экстракт × 1",
      "Эссенция магической энергии × 2",
      "Свиток «Огненный шар» × 2",
      "Свиток «Огненная стрела» × 3",
      "Свиток «Превращение в мясного жука» × 1"
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
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/milten/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/milten/"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-firemages-in-front-of-sleeping-room/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/miltens-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L58"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%92%D1%82%D0%BE%D1%80%D0%BE%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BD%D0%B0%20%D0%BD%D0%B8%D0%B6%D0%BD%D0%B5%D0%BC%20%D1%8D%D1%82%D0%B0%D0%B6%D0%B5%20%D0%BF%D0%BE%D0%BA%D0%BE%D0%B5%D0%B2%20%D0%9C%D0%B0%D0%B3%D0%BE%D0%B2%20%D0%BE%D0%B3%D0%BD%D1%8F"
      },
      {
        "name": "MIT-наблюдение Vladislav Durnev",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L57"
      },
      {
        "name": "Lorthiz — описание конкретного объекта",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=1411"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение идентичности: Физический объект сопоставлен по подписи места в MIT-наблюдении, совпадению исходных позиций и полному воспроизведению механизма; именная карточка Golden независимо связывает тот же отпечаток с названием. Это установление объекта по источникам, не проверка в игре. Имя мага приведено по Golden; MIT отдельно задаёт комнату и положение сундука, Lorthiz подтверждает номер сундука в соответствующей комнате.",
    "tags": [],
    "searchAliases": [
      "1411"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-firemages-in-front-of-sleeping-room/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Planet of Gothic — Miltens Truhe",
          "url": "https://www.planetofgothic.de/tools/atlas/truhen/altes-lager#truhe-1829"
        }
      ],
      "reviewedAt": "2026-10-16"
    },
    "lootExternal": [
      {
        "name": "Planet of Gothic — выбранный сундук на карте",
        "url": "https://www.planetofgothic.de/tools/atlas?poi=1829"
      }
    ]
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/mordrags-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
    "contents": [
      "Кусок руды × 3",
      "Хлеб",
      "Кувшин",
      "Тарелка"
    ],
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/muds-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%9C%D0%B0%D0%B4%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": [],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Gothic.tools team — Lockpicking & Chest Solutions",
          "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions#:~:text=Mud's%20Chest"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Названия самостоятельно переведены; официальная русская локализация не подтверждена. Соответствие сундука требует сверки по месту и исходным пластинам."
    }
  },
  {
    "id": "guide-myxir",
    "name": "Сундук Миксира",
    "originalName": "Myxir's chest",
    "camp": "new",
    "region": "new-camp",
    "sector": "Квартал магов Воды · дом Миксира",
    "route": "Квартал магов Воды в Новом лагере, дом Миксира; в схеме Lorthiz — первое строение слева.",
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
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/myxir/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/myxir/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/myxirs-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L54"
      },
      {
        "name": "MIT-наблюдение Vladislav Durnev",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L53"
      },
      {
        "name": "Lorthiz — описание конкретного объекта",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=357521"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение идентичности: Физический объект сопоставлен по подписи места в MIT-наблюдении, совпадению исходных позиций и полному воспроизведению механизма; именная карточка Golden независимо связывает тот же отпечаток с названием. Это установление объекта по источникам, не проверка в игре.",
    "tags": [],
    "searchAliases": [
      "357521"
    ]
  },
  {
    "id": "guide-natalia",
    "name": "Сундук Наталии",
    "originalName": "Natalia's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Храм Ю’Бериона · левая комната",
    "route": "Храм Ю’Бериона, сундук в левой боковой комнате по описанию источников.",
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
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/natalia/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/natalia/"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105242"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/natalias-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L26"
      },
      {
        "name": "MIT-наблюдение Vladislav Durnev",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L25"
      },
      {
        "name": "Lorthiz — описание конкретного объекта",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=576251"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение идентичности: Физический объект сопоставлен по подписи места в MIT-наблюдении, совпадению исходных позиций и полному воспроизведению механизма; именная карточка Golden независимо связывает тот же отпечаток с названием. Это установление объекта по источникам, не проверка в игре. Имя владелицы приведено по Golden; MIT и Lorthiz независимо подтверждают расположение комнаты, но не имя владелицы.",
    "tags": [],
    "searchAliases": [
      "576251"
    ]
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/nefariuss-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L50"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": [
      "65726"
    ]
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105242"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/nyrass-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B4%D0%BE%D0%BC%D0%B5%20%D0%9D%D0%B8%D1%80%D0%B0%D1%81%D0%B0%20%D0%B8%20%D0%BF%D0%BE%D1%81%D0%BB%D1%83%D1%88%D0%BD%D0%B8%D0%BA%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-jain-near-entrance-dining-room/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/omids-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/oriks-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      "Кольцо защиты от огня × 1",
      "Целебный экстракт × 2",
      "Зов сна × 1",
      "Подсвечник × 1",
      "Столовые приборы × 2",
      "Ключ от башни Ворона × 1",
      "Монета × 40"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-2nd-floor-raven/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ravens-chest"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/vorans-bedside-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L34"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%BA%D0%BE%D0%BC%D0%BD%D0%B0%D1%82%D0%B5%20%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "7647275"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-2nd-floor-raven/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/voran-bedside-chest/"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/rice-lords-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/riordians-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L51"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": [
      "233176"
    ]
  },
  {
    "id": "guide-rodriguez",
    "name": "Сундук Родригеса",
    "originalName": "Rodriguez's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Внутренний замок · покои магов Огня",
    "route": "Покои магов Огня во внутреннем замке Старого лагеря: правая комната, средний из трёх сундуков.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Вино × 2",
      "Экстракт магической энергии × 1",
      "Свиток «Светоч» × 2",
      "Свиток «Телекинез» × 1"
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
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/rodriguez/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/rodriguez/"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-firemages-in-far-corner-sleeping-room/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/rodriguezs-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L57"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%A0%D0%BE%D0%B4%D1%80%D0%B8%D0%B3%D0%B5%D0%B7%D0%B0%20%D0%B2%20%D0%BF%D0%BE%D0%BA%D0%BE%D1%8F%D1%85%20%D0%9C%D0%B0%D0%B3%D0%BE%D0%B2%20%D0%BE%D0%B3%D0%BD%D1%8F"
      },
      {
        "name": "MIT-наблюдение Vladislav Durnev",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L56"
      },
      {
        "name": "Lorthiz — описание конкретного объекта",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=4761"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение идентичности: Физический объект сопоставлен по подписи места в MIT-наблюдении, совпадению исходных позиций и полному воспроизведению механизма; именная карточка Golden независимо связывает тот же отпечаток с названием. Это установление объекта по источникам, не проверка в игре. Имя мага приведено по Golden; MIT отдельно задаёт комнату и положение сундука, Lorthiz подтверждает номер сундука в соответствующей комнате.",
    "tags": [],
    "searchAliases": [
      "4761"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-firemages-in-far-corner-sleeping-room/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Gothic Lock Picking",
          "url": "https://gothic-lock-picking.com/en/locks/rodriguezs-chest"
        },
        {
          "name": "Planet of Gothic — Rodriguez’ Truhe",
          "url": "https://www.planetofgothic.de/tools/atlas/truhen/altes-lager#truhe-1838"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Источники расходятся в типе зелья жизни. Спорное зелье исключено до уточнения."
    },
    "lootExternal": [
      {
        "name": "Planet of Gothic — выбранный сундук на карте",
        "url": "https://www.planetofgothic.de/tools/atlas?poi=1838"
      }
    ]
  },
  {
    "id": "guide-santino",
    "name": "Сантино: сундук у лестницы склада",
    "originalName": "Santino's chest",
    "camp": "other",
    "region": "old-mine",
    "sector": "Старый лагерь",
    "route": "Склад Сантино в Старой шахте; сундук в средней комнате у лестницы.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Куски руды"
    ],
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
      "name": "The Games Wiki — Lockpicking; авторы frostbyte99, Novaterra и участники",
      "url": "https://thegameswiki.com/gothic-1-remake/wiki/lockpicking",
      "license": "CC-BY-NC-SA-4.0"
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-left-from-trader-old-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/santinos-old-mine-east-shack-chest"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9143853"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%A1%D0%B0%D0%BD%D1%82%D0%B8%D0%BD%D0%BE"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение 16.10.2026: Golden называет Старый лагерь и другой исходный механизм; Wiki/SGC/Steam описывают сундук Старой шахты. Ссылку Golden нельзя считать доказательством идентичности.",
    "tags": [],
    "searchAliases": [],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-left-from-trader-old-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Gothic.tools team — Lockpicking & Chest Solutions",
          "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions#:~:text=Santino's%20Chest"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Источники называют 23 или 33 куска руды. Количество и точное соответствие сундука требуют проверки; число не указано."
    }
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/saturass-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L49"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": [
      "224431"
    ]
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/scars-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-near-window-on-right-guards-room/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/scorpios-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026811"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/sharkys-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-tavern-second-floor-chest-2"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/silass-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%92%D1%82%D0%BE%D1%80%D0%BE%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BD%D0%B0%20%D0%B2%D1%82%D0%BE%D1%80%D0%BE%D0%BC%20%D1%8D%D1%82%D0%B0%D0%B6%D0%B5%20%D1%82%D0%B0%D0%B2%D0%B5%D1%80%D0%BD%D1%8B"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
  },
  {
    "id": "guide-skip",
    "name": "Сундук Скипа",
    "originalName": "Skip's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Спальня над кузницей Стоуна: №3 в Steam, №4 в Lorthiz.",
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
      },
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/inner-castle-blacksmith-upstairs-chest-4"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9103187"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/slys-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%A1%D0%BB%D0%B0%D1%8F"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
  },
  {
    "id": "guide-snaf",
    "name": "Снаф: сундук возле кровати",
    "originalName": "Snaf's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Дальний сундук дома Снафа, рядом с кроватью.",
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
      },
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065294"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/snafs-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение 16.10.2026: Снаф имеет два отдельных сундука; Golden и независимое описание соответствуют дальнему.",
    "tags": [],
    "searchAliases": []
  },
  {
    "id": "guide-stone",
    "name": "Сундук Стоуна",
    "originalName": "Stone's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Спальня стражи внутри замка; сундук у прохода в правой комнате.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Жареное мясо × 4",
      "Кружка × 1",
      "Кусок руды × 16"
    ],
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
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-passage-on-right-in-guards-bedroom/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/stones-guard-barracks-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение 16.10.2026: Именной сундук Стоуна не совпадает с двумя сундуками непосредственно в кузнице.",
    "tags": [],
    "searchAliases": [],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-passage-on-right-in-guards-bedroom/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Физическое место — сундук у прохода правой спальни стражи. Имя владельца Стоун остаётся по Golden и не подтверждается SGC."
    }
  },
  {
    "id": "guide-swiney",
    "name": "Сундук Суини, бригадира рудокопов",
    "originalName": "Swiney's chest",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта — хижина Суини",
    "route": "Свободная шахта, внутри хижины Суини — бригадира рудокопов.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Зелёный новичок × 4",
      "Виноград × 1",
      "Рис × 3",
      "Полоски кожи × 2",
      "Кусок руды × 15"
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
      "name": "www.gothic-golden-lockpick-tool.com",
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/swiney/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/swiney/"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9143913"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-brigade-master-free-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/swineys-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=67563"
      },
      {
        "name": "Colony Guide — Swiney",
        "url": "https://colony-guide.com/gothic-1-remake/npcs/swiney/"
      },
      {
        "name": "NerdsChalk — Free Mine",
        "url": "https://nerdschalk.com/gothic-1-remake-how-to-reach-the-free-mine-exact-location-route-and-step-by-step-guide/"
      }
    ],
    "verification": "unknown",
    "notes": "Место уточнено: хижина Суини, бригадира рудокопов Свободной шахты. Имя, район и механизм согласуются в независимых описаниях. Версия игры не установлена; собственной проверки в игре не было.",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "Сундук Суини",
      "сундук бригадира рудокопов",
      "67563"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-brigade-master-free-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/thoruss-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/torlofs-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
  },
  {
    "id": "guide-torrez",
    "name": "Сундук Торреза",
    "originalName": "Torrez's chest",
    "camp": "old",
    "region": "old-camp",
    "sector": "Внутренний замок · покои магов Огня",
    "route": "Покои магов Огня во внутреннем замке Старого лагеря: правая комната, правый из трёх сундуков.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Пергамент × 2",
      "Вино × 1",
      "Экстракт магической энергии × 1",
      "Свиток «Огненная стрела» × 2",
      "Свиток «Огненный дождь» × 1"
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
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/torrez/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/torrez/"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-firemages-sleeping-room/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/torrezs-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L56"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%A2%D0%BE%D1%80%D1%80%D0%B5%D0%B7%D0%B0%20%D0%B2%20%D0%BF%D0%BE%D0%BA%D0%BE%D1%8F%D1%85%20%D0%9C%D0%B0%D0%B3%D0%BE%D0%B2%20%D0%BE%D0%B3%D0%BD%D1%8F"
      },
      {
        "name": "MIT-наблюдение Vladislav Durnev",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L55"
      },
      {
        "name": "Lorthiz — описание конкретного объекта",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=732617"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение идентичности: Физический объект сопоставлен по подписи места в MIT-наблюдении, совпадению исходных позиций и полному воспроизведению механизма; именная карточка Golden независимо связывает тот же отпечаток с названием. Это установление объекта по источникам, не проверка в игре. Имя мага приведено по Golden; MIT отдельно задаёт комнату и положение сундука, Lorthiz подтверждает номер сундука в соответствующей комнате.",
    "tags": [],
    "searchAliases": [
      "732617"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-firemages-sleeping-room/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Planet of Gothic — Torrez’ Truhe",
          "url": "https://www.planetofgothic.de/tools/atlas/truhen/altes-lager#truhe-1862"
        }
      ],
      "reviewedAt": "2026-10-16"
    },
    "lootExternal": [
      {
        "name": "Planet of Gothic — выбранный сундук на карте",
        "url": "https://www.planetofgothic.de/tools/atlas?poi=1862"
      }
    ]
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/virans-templar-canopy-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/wedges-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/whistlers-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%A3%D0%B8%D1%81%D1%82%D0%BB%D0%B5%D1%80%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": []
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
    "contents": [
      "Ивовая древесина × 2",
      "Рис",
      "Перья × 3",
      "Виноград × 3",
      "Факел",
      "Кусок руды × 6"
    ],
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026811"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/wolfs-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%92%D0%BE%D0%BB%D0%BA%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено.",
    "tags": [],
    "searchAliases": [],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Gothic.tools team — Lockpicking & Chest Solutions",
          "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions#:~:text=Wolf's%20Chest"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Названия самостоятельно переведены; официальная русская локализация не подтверждена. Соответствие сундука требует сверки по месту и исходным пластинам."
    }
  },
  {
    "id": "guide-yberion",
    "name": "Сундук Ю’Бериона",
    "originalName": "Yberion's chest",
    "camp": "swamp",
    "region": "swamp-camp",
    "sector": "Храм Ю’Бериона · главная комната",
    "route": "Храм Ю’Бериона, сундук в главном помещении.",
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
      "url": "https://www.gothic-golden-lockpick-tool.com/blog/yberion/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "www.gothic-golden-lockpick-tool.com",
        "url": "https://www.gothic-golden-lockpick-tool.com/blog/yberion/"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105242"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/yberions-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L28"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%AE%E2%80%99%D0%91%D0%B5%D1%80%D0%B8%D0%BE%D0%BD%D0%B0"
      },
      {
        "name": "MIT-наблюдение Vladislav Durnev",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L27"
      },
      {
        "name": "Lorthiz — описание конкретного объекта",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=41263"
      }
    ],
    "verification": "unknown",
    "notes": "Объект назван в публичном руководстве; точный ориентир, версия игры и матрица связей в реестр не перенесены. Решение не подтверждено. Уточнение идентичности: Физический объект сопоставлен по подписи места в MIT-наблюдении, совпадению исходных позиций и полному воспроизведению механизма; именная карточка Golden независимо связывает тот же отпечаток с названием. Это установление объекта по источникам, не проверка в игре.",
    "tags": [],
    "searchAliases": [
      "41263"
    ]
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/fisks-hut-door-1"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L63"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%94%D0%B2%D0%B5%D1%80%D1%8C%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D1%83%20%D0%A4%D0%B8%D1%81%D0%BA%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено.",
    "tags": [],
    "searchAliases": [
      "712717"
    ]
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/fisks-hut-door-2"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено.",
    "tags": [],
    "searchAliases": [
      "727117"
    ]
  },
  {
    "id": "fisk-chest-1",
    "name": "Сундук Фиска №1",
    "originalName": "Fisk chest-1",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Дом Фиска, четвёртый сундук слева направо в основной комнате.",
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
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=673326"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L67"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено. Уточнение 16.10.2026: Прежний маршрут всех восьми сундуков указывал кладовую, хотя четыре стоят в основной комнате. Сопоставлено с уже проверенным механизмом этой карточки и описанием источника.",
    "tags": [],
    "searchAliases": [
      "673326"
    ]
  },
  {
    "id": "fisk-chest-2",
    "name": "Сундук Фиска №2",
    "originalName": "Fisk chest-2",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Дом Фиска, третий сундук слева направо в основной комнате.",
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
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=23261"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L66"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено. Уточнение 16.10.2026: Прежний маршрут всех восьми сундуков указывал кладовую, хотя четыре стоят в основной комнате. Сопоставлено с уже проверенным механизмом этой карточки и описанием источника.",
    "tags": [],
    "searchAliases": [
      "23261"
    ]
  },
  {
    "id": "fisk-chest-3",
    "name": "Сундук Фиска №3",
    "originalName": "Fisk chest-3",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Дом Фиска, второй сундук слева направо в основной комнате.",
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
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=12167"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L65"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%D0%BE%D0%B7%D0%BB%D0%B5%20%D0%BA%D1%80%D0%BE%D0%B2%D0%B0%D1%82%D0%B8%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%A4%D0%B8%D1%81%D0%BA%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено. Уточнение 16.10.2026: Прежний маршрут всех восьми сундуков указывал кладовую, хотя четыре стоят в основной комнате. Сопоставлено с уже проверенным механизмом этой карточки и описанием источника.",
    "tags": [],
    "searchAliases": [
      "12167"
    ]
  },
  {
    "id": "fisk-chest-4",
    "name": "Сундук Фиска №4",
    "originalName": "Fisk chest-4",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Дом Фиска, первый сундук слева направо в основной комнате.",
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
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=17132"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L64"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D1%81%20%D0%BB%D0%B5%D0%B2%D0%BE%D0%B9%20%D1%81%D1%82%D0%BE%D1%80%D0%BE%D0%BD%D1%8B%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%A4%D0%B8%D1%81%D0%BA%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено. Уточнение 16.10.2026: Прежний маршрут всех восьми сундуков указывал кладовую, хотя четыре стоят в основной комнате. Сопоставлено с уже проверенным механизмом этой карточки и описанием источника.",
    "tags": [],
    "searchAliases": [
      "17132"
    ]
  },
  {
    "id": "fisk-chest-5",
    "name": "Сундук Фиска №5",
    "originalName": "Fisk chest-5",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кладовая Фиска за внутренней дверью; сундук напротив двери.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Ртуть",
      "Лечебное зелье",
      "Зелье магической энергии"
    ],
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
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=343217"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314192"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L70"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено. Уточнение 16.10.2026: Прежний маршрут всех восьми сундуков указывал кладовую, хотя четыре стоят в основной комнате. Сопоставлено с уже проверенным механизмом этой карточки и описанием источника.",
    "tags": [],
    "searchAliases": [
      "343217"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Nanomaks — Steam",
          "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314192"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Количество и разновидности зелий не названы; неопределённые растения не перенесены."
    }
  },
  {
    "id": "fisk-chest-6",
    "name": "Сундук Фиска №6",
    "originalName": "Fisk chest-6",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кладовая Фиска за внутренней дверью; сундук у входа.",
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
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=212516"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314192"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L71"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено. Уточнение 16.10.2026: Прежний маршрут всех восьми сундуков указывал кладовую, хотя четыре стоят в основной комнате. Сопоставлено с уже проверенным механизмом этой карточки и описанием источника.",
    "tags": [],
    "searchAliases": [
      "212516"
    ]
  },
  {
    "id": "fisk-chest-7",
    "name": "Сундук Фиска №7",
    "originalName": "Fisk chest-7",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кладовая Фиска; четвёртый сундук по схеме Lorthiz, за стеллажом.",
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
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=766121"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314192"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L68"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено. Уточнение 16.10.2026: Прежний маршрут всех восьми сундуков указывал кладовую, хотя четыре стоят в основной комнате. Сопоставлено с уже проверенным механизмом этой карточки и описанием источника.",
    "tags": [],
    "searchAliases": [
      "766121"
    ]
  },
  {
    "id": "fisk-chest-8",
    "name": "Сундук Фиска №8",
    "originalName": "Fisk chest-8",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кладовая Фиска; третий сундук по схеме Lorthiz, за стеллажом.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Зелье магической энергии × 2",
      "Лечебное зелье × 3"
    ],
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
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=2111"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314192"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L69"
      }
    ],
    "verification": "unknown",
    "notes": "Два входа и восемь сундуков различаются по месту и исходным позициям. Связи реконструированы независимым полным перебором, последовательности рассчитаны собственным BFS и проверены на каждой совместимой модели. В игре на PS5 не проверено. Уточнение 16.10.2026: Прежний маршрут всех восьми сундуков указывал кладовую, хотя четыре стоят в основной комнате. Сопоставлено с уже проверенным механизмом этой карточки и описанием источника.",
    "tags": [],
    "searchAliases": [
      "2111"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Nanomaks — Steam",
          "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314192"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Разновидности зелий и остальная добыча в источнике не уточнены."
    }
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
      "Топор × 1",
      "Сталь × 2",
      "Древесина дуба × 3",
      "Полоски кожи × 3",
      "Железо × 3",
      "Древесина ивы × 4",
      "Жвалы ползуна × 3"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105242"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-swamp-camp-blacksmith/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/swamp-camp-forge-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%BA%D1%83%D0%B7%D0%BD%D0%B8%D1%86%D0%B5%20%D0%91%D0%BE%D0%BB%D0%BE%D1%82%D0%BD%D0%BE%D0%B3%D0%BE%20%D0%BB%D0%B0%D0%B3%D0%B5%D1%80%D1%8F"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "151726"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-swamp-camp-blacksmith/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/swamp-camp-forge-chest/"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/rice-lord-third-floor-storeroom-door"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "37265"
    ]
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-gomez-room/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/gomezs-room-door"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L44"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%94%D0%B2%D0%B5%D1%80%D1%8C%20%D0%B2%20%D0%BA%D0%BE%D0%BC%D0%BD%D0%B0%D1%82%D1%83%20%D0%93%D0%BE%D0%BC%D0%B5%D0%B7%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "215431"
    ]
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/gomezs-chambers-wall-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Матрица связей и решение не перенесены. Версия игры не указана.",
    "tags": [],
    "searchAliases": []
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
      "Кубок × 6",
      "Столовые приборы × 10",
      "Кусок руды × 29",
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9357319"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-1st-floor-raven-tower/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ravens-tower-chest-1"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L36"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%9F%D0%B5%D1%80%D0%B2%D1%8B%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B5%20%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "764554"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-1st-floor-raven-tower/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/raven-tower-left-chest/"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Количество монет противоречиво: SGC указывает 2521, UnlockMyLoot 2500. Количество не публикуется."
    }
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
      "Иззубренный топор × 3",
      "Ржавый меч × 2"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9357319"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-1st-floor-on-right-raven-tower/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ravens-tower-chest-2"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L37"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%92%D1%82%D0%BE%D1%80%D0%BE%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B5%20%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "722137"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-1st-floor-on-right-raven-tower/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/raven-tower-right-chest/"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      "Короткий меч",
      "Железо",
      "Рисовый шнапс × 3",
      "Монета × 25",
      "Сера"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021380"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-tavern-underwater-chest-1"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BF%D0%BE%D0%B4%20%D0%B2%D0%BE%D0%B4%D0%BE%D0%B9%20%D0%B2%20%D1%82%D0%B0%D0%B2%D0%B5%D1%80%D0%BD%D0%B5"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [
      "underwater"
    ],
    "searchAliases": [
      "43725"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "Neoseeker — Up To His Neck",
          "url": "https://www.neoseeker.com/gothic-1-remake/guides/Up_To_His_Neck"
        },
        {
          "name": "Nanomaks — Steam",
          "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Добыча относится к подводному сундуку. Топор Брана находится в другом сундуке выше лестницы. Количество железа и серы не указано."
    }
  },
  {
    "id": "silas-storeroom-chest",
    "name": "Сундук в кладовой таверны",
    "originalName": "Сундук в кладовой таверны",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "За дверью позади Силаса, сундук справа от тела Брана. Подводным путём сначала подняться из затопленного прохода по каменной лестнице.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Топор Брана",
      "Рис × 3",
      "Чистый спирт × 2",
      "Рисовый шнапс × 4"
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
      "url": "https://unlockmyloot.com/locks/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-tavern-locked-room-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "244627"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/walkthroughs/29883-po-samuju-sheju-v-gothic-1-remake-gde-najti-brana-i-kak-popast-v-podval-taverny.html",
          "author": "Droommar",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        },
        {
          "name": "Neoseeker — Up To His Neck",
          "url": "https://www.neoseeker.com/gothic-1-remake/guides/Up_To_His_Neck"
        },
        {
          "name": "Nanomaks — Steam",
          "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
        },
        {
          "name": "GamesFuze — Where to Find Bran",
          "url": "https://gamesfuze.com/guides/where-to-find-bran-in-gothic-1-remake/"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Топор Брана находится в этом сундуке возле тела Брана. Подводный сундук под таверной — отдельный объект."
    }
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-tavern-ground-floor-locked-door"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%97%D0%B0%D0%BA%D1%80%D1%8B%D1%82%D0%B0%D1%8F%20%D0%B4%D0%B2%D0%B5%D1%80%D1%8C%20%D0%B2%20%D0%BF%D0%BE%D0%B4%D0%B2%D0%B0%D0%BB%D0%B5%20%D1%82%D0%B0%D0%B2%D0%B5%D1%80%D0%BD%D1%8B"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "556277"
    ]
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
      "Чертёж дробителя камней × 1",
      "Вино × 1",
      "Столовые приборы × 2",
      "Молот × 1",
      "Кусок руды × 16"
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
      "url": "https://unlockmyloot.com/locks/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-hut-near-new-camp/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-hut-opposite-jan-chest"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "517113"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-hut-near-new-camp/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Gothic Lock Picking",
          "url": "https://gothic-lock-picking.com/en/locks/new-camp-hut-opposite-jan-chest"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026797"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-camp-mercenary-chest-by-grim"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B4%D0%B0%D0%BB%D1%8C%D0%BD%D0%B5%D0%B9%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BD%D0%B0%D0%BF%D1%80%D0%BE%D1%82%D0%B8%D0%B2%20%D0%A2%D0%BE%D1%80%D1%83%D1%81%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "312721"
    ]
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
      "Чертёж королевского оружия × 1",
      "Кусок руды × 42",
      "Волчья шкура × 1",
      "Рубин × 2",
      "Кубок × 1"
    ],
    "valuable": true,
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-throne-room-gomez-castle/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/gomezs-throne-room-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%82%D1%80%D0%BE%D0%BD%D0%BD%D0%BE%D0%BC%20%D0%B7%D0%B0%D0%BB%D0%B5%20%D0%93%D0%BE%D0%BC%D0%B5%D0%B7%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "1311"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-throne-room-gomez-castle/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/gomez-throne-hall-chest/"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L11"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-camp-dungeon-executed-ghost-door"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана. Уточнение 16.10.2026: Камера с погибшим узником не является новым объектом: совпадает с уже существующим входом темницы и его механизмом.",
    "tags": [],
    "searchAliases": [
      "141571"
    ]
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ore-baron-manor-wine-cellar-door"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L9"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%94%D0%B2%D0%B5%D1%80%D1%8C%20%D0%B2%20%D0%B2%D0%B8%D0%BD%D0%BD%D0%BE%D0%BC%20%D0%BF%D0%BE%D0%B3%D1%80%D0%B5%D0%B1%D0%B5%20%D0%A0%D1%83%D0%B4%D0%BD%D0%BE%D0%B3%D0%BE%20%D0%B1%D0%B0%D1%80%D0%BE%D0%BD%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "732626"
    ]
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-gomez-second-flloor-door-to-right/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/arto-and-thorus-room-door"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L30"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%94%D0%B2%D0%B5%D1%80%D1%8C%20%D0%B2%20%D0%BA%D0%BE%D0%BC%D0%BD%D0%B0%D1%82%D1%83%20%D0%90%D1%80%D1%82%D0%BE%20%D0%B8%20%D0%A2%D0%BE%D1%80%D1%80%D0%B5%D0%B7%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "77772"
    ]
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
      "Кольцо защиты от оружия × 1",
      "Столовые приборы × 1"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-second-floor-near-window-on-right/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/artos-far-bed-chest"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ore-baron-manor-upper-floor-far-bed-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L32"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%92%D1%82%D0%BE%D1%80%D0%BE%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%BA%D0%BE%D0%BC%D0%BD%D0%B0%D1%82%D0%B5%20%D0%90%D1%80%D1%82%D0%BE%20%D0%B8%20%D0%A2%D0%BE%D1%80%D1%80%D0%B5%D0%B7%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "433216"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-second-floor-near-window-on-right/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/arto-far-bed-chest/"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Тип зелья спорен: SpecialGamesClub называет 2 целебных экстракта, UnlockMyLoot — 2 экстракта жизни. Спорный предмет исключён из перечня до уточнения."
    }
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9064903"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-door-2nd-floor-gomez-castle-on-left/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/bartholo-and-scars-room-door"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L46"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%94%D0%B2%D0%B5%D1%80%D1%8C%20%D0%B2%20%D0%BA%D0%BE%D0%BC%D0%BD%D0%B0%D1%82%D1%83%20%D0%91%D0%B0%D1%80%D1%82%D0%BE%D0%BB%D0%BE%20%D0%B8%20%D0%A8%D1%80%D0%B0%D0%BC%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "127765"
    ]
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
      "Кольцо рудной кожи × 1",
      "Вино",
      "Пиво"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9064903"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-near-window-2nd-floor-gomer-castle-on-left/"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L48"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%92%D1%82%D0%BE%D1%80%D0%BE%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%BA%D0%BE%D0%BC%D0%BD%D0%B0%D1%82%D0%B5%20%D0%91%D0%B0%D1%80%D1%82%D0%BE%D0%BB%D0%BE%20%D0%B8%20%D0%A8%D1%80%D0%B0%D0%BC%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "45777"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-near-window-2nd-floor-gomer-castle-on-left/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/gomez-bedrooms-far-chest/"
        },
        {
          "name": "Steam — Nanomaks",
          "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "SGC и UnlockMyLoot дают 5 вина/7 пива; Steam даёт 3/5. Для напитков число не публикуется. Тип зелья спорен: SGC и Steam называют целебный экстракт, UnlockMyLoot — экстракт жизни. Предмет исключён до уточнения; количество напитков тоже расходится."
    }
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
      "Кольцо великой жизненной силы × 1",
      "Столовые приборы × 1"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9064903"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-2nd-floor-near-stairs-on-left/"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L47"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%9F%D0%B5%D1%80%D0%B2%D1%8B%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%BA%D0%BE%D0%BC%D0%BD%D0%B0%D1%82%D0%B5%20%D0%91%D0%B0%D1%80%D1%82%D0%BE%D0%BB%D0%BE%20%D0%B8%20%D0%A8%D1%80%D0%B0%D0%BC%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "363777"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-2nd-floor-near-stairs-on-left/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/gomez-bedrooms-near-chest/"
        },
        {
          "name": "Steam — Nanomaks",
          "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Источники расходятся в типах лечебных предметов. Сохранены кольцо и столовые приборы; зелья исключены из точного перечня до уточнения."
    }
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
      "Вино × 12",
      "Пиво × 26"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9357319"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-2nd-floor-raven-tower-on-right/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ravens-tower-chest-3"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L38"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A2%D1%80%D0%B5%D1%82%D0%B8%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B5%20%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "235761"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-2nd-floor-raven-tower-on-right/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/raven-tower-floor2-stairs-chest/"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Тип крепкого напитка спорен: SpecialGamesClub называет крепкое пиво, UnlockMyLoot — крепкое вино; оба источника дают 8. Спорный предмет исключён до уточнения."
    }
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
      "Столовый прибор × 12",
      "Монета × 8897"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9357319"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ravens-tower-chest-4"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L39"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A7%D0%B5%D1%82%D0%B2%D0%B5%D1%80%D1%82%D1%8B%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B5%20%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "27567"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/raven-tower-floor2-chest-2/"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      "Волчий коготь × 11",
      "Зуб × 8",
      "Столовый прибор × 13"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9357319"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ravens-tower-chest-5"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%9F%D1%8F%D1%82%D1%8B%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B5%20%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "22657"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/raven-tower-floor3-entrance-chest/"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      "url": "https://unlockmyloot.com/locks/raven-tower-floor3-empty-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/raven-tower-floor3-empty-chest/"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9357319"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ravens-tower-chest-6"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L40"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A8%D0%B5%D1%81%D1%82%D0%BE%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B5%20%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "37131"
    ],
    "loot": {
      "coverage": "empty",
      "sources": [
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/raven-tower-floor3-empty-chest/"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      "Эликсир магической энергии × 3",
      "Целебный эликсир × 2",
      "Экстракт магической энергии × 2",
      "Целебный экстракт"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9357319"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ravens-tower-chest-8"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L41"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%92%D0%BE%D1%81%D1%8C%D0%BC%D0%BE%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B5%20%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "4667174"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/raven-tower-floor4-elixirs-chest/"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      "Вино × 6",
      "Пиво × 11",
      "Окорок × 6",
      "Жареное мясо × 9"
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9357319"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-4th-floor-raven-tower/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ravens-tower-chest-7"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L42"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D0%B5%D0%B4%D1%8C%D0%BC%D0%BE%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B5%20%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "572357"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-4th-floor-raven-tower/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/raven-tower-floor4-food-chest/"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      "Кольцо ловкости × 1",
      "Зов сна × 4",
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9357319"
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-raven-chest-gomez-castle/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ravens-tower-top-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L43"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BD%D0%B0%D0%B2%D0%B5%D1%80%D1%85%D1%83%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B8%20%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение и перечисленная добыча сообщены публичным руководством; в игре независимо не проверены. Схемы, готовые шаги и их проверка приведены отдельно в блоке комбинации. Версия игры не указана.",
    "tags": [],
    "searchAliases": [
      "541162"
    ],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-raven-chest-gomez-castle/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "UnlockMyLoot",
          "url": "https://unlockmyloot.com/locks/raven-tower-top-chest/"
        },
        {
          "name": "Steam — Nanomaks",
          "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9357319"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "SGC и UnlockMyLoot дают 8 Велайис, Steam 9; количество не публикуется."
    }
  },
  {
    "id": "alberto-mine-hut-chest",
    "name": "Склад Яна и Альберто: нижний сундук",
    "originalName": "Шахта Альберто: сундук в хижине",
    "camp": "other",
    "region": "old-mine",
    "sector": "Старая шахта — склад у Яна и Альберто",
    "route": "Старая шахта, склад рядом с Яном и Альберто; нижний этаж, возле лестницы слева от Яна, напротив входа.",
    "type": "chest",
    "floor": "Нижний этаж склада",
    "contents": [
      "Хлеб × 6",
      "Яблоко × 3",
      "Суп из ползуна × 2",
      "Пиво × 4"
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
      "url": "https://unlockmyloot.com/locks/alberto-mine-hut-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/alberto-mine-hut-chest/"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-near-stairs-near-jan-old-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/alberto-mine-hut-chest"
      },
      {
        "name": "UnlockMyLoot",
        "url": "https://unlockmyloot.com/en/locks/alberto-mine-hut-chest/"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=13765"
      },
      {
        "name": "GameFAQs — General Walkthrough",
        "url": "https://gamefaqs.gamespot.com/ps5/288748-gothic-1-remake/faqs/82626/general-walkthrough"
      },
      {
        "name": "Land of Games — Кладовка Ульберта",
        "url": "https://landofgames.ru/articles/walkthroughs/29922-kladovka-ulberta-v-gothic-1-remake-gde-nahoditsja-alef-i-kak-obchistit-sklad-s-pripasami.html"
      }
    ],
    "verification": "unknown",
    "notes": "Место уточнено: склад Яна и Альберто в Старой шахте. Название источника «шахта Альберто» описывало место рядом с персонажем, а не отдельный подтверждённый район. Этаж, сторона и число пластин совпадают в независимых описаниях. Версия игры не установлена; собственной проверки в игре не было.",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "13765",
      "Шахта Альберто: сундук в хижине",
      "склад Яна",
      "сундук слева от Яна"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-near-stairs-near-jan-old-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "alberto-mine-upstairs-left-chest",
    "name": "Склад Яна и Альберто: верхний левый сундук",
    "originalName": "Шахта Альберто: верхний левый сундук",
    "camp": "other",
    "region": "old-mine",
    "sector": "Старая шахта — склад у Яна и Альберто",
    "route": "Старая шахта, склад рядом с Яном и Альберто; подняться по внутренней лестнице и выбрать левый из двух сундуков.",
    "type": "chest",
    "floor": "Верхний этаж склада, слева",
    "contents": [
      "Кусок руды × 23"
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
      "url": "https://unlockmyloot.com/locks/alberto-mine-upstairs-left-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/alberto-mine-upstairs-left-chest/"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-left-on-2nd-floor-jan-old-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/alberto-mine-upstairs-left-chest"
      },
      {
        "name": "UnlockMyLoot",
        "url": "https://unlockmyloot.com/en/locks/alberto-mine-upstairs-left-chest/"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=1211"
      },
      {
        "name": "GameFAQs — General Walkthrough",
        "url": "https://gamefaqs.gamespot.com/ps5/288748-gothic-1-remake/faqs/82626/general-walkthrough"
      },
      {
        "name": "Land of Games — Кладовка Ульберта",
        "url": "https://landofgames.ru/articles/walkthroughs/29922-kladovka-ulberta-v-gothic-1-remake-gde-nahoditsja-alef-i-kak-obchistit-sklad-s-pripasami.html"
      }
    ],
    "verification": "unknown",
    "notes": "Место уточнено: склад Яна и Альберто в Старой шахте. Название источника «шахта Альберто» описывало место рядом с персонажем, а не отдельный подтверждённый район. Этаж, сторона и число пластин совпадают в независимых описаниях. Версия игры не установлена; собственной проверки в игре не было.",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "1211",
      "Шахта Альберто: верхний левый сундук",
      "склад Яна"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-left-on-2nd-floor-jan-old-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "alberto-mine-upstairs-right-chest",
    "name": "Склад Яна и Альберто: верхний правый сундук",
    "originalName": "Шахта Альберто: верхний правый сундук",
    "camp": "other",
    "region": "old-mine",
    "sector": "Старая шахта — склад у Яна и Альберто",
    "route": "Старая шахта, склад рядом с Яном и Альберто; подняться по внутренней лестнице и выбрать правый из двух сундуков.",
    "type": "chest",
    "floor": "Верхний этаж склада, справа",
    "contents": [
      "Кусок руды × 32"
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
      "url": "https://unlockmyloot.com/locks/alberto-mine-upstairs-right-chest/",
      "license": "Справочная ссылка; текст и числовая база не копируются"
    },
    "locationSources": [
      {
        "name": "unlockmyloot.com",
        "url": "https://unlockmyloot.com/locks/alberto-mine-upstairs-right-chest/"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-right-2nd-floor-jan-old-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/alberto-mine-upstairs-right-chest"
      },
      {
        "name": "UnlockMyLoot",
        "url": "https://unlockmyloot.com/en/locks/alberto-mine-upstairs-right-chest/"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=17464"
      },
      {
        "name": "GameFAQs — General Walkthrough",
        "url": "https://gamefaqs.gamespot.com/ps5/288748-gothic-1-remake/faqs/82626/general-walkthrough"
      },
      {
        "name": "Land of Games — Кладовка Ульберта",
        "url": "https://landofgames.ru/articles/walkthroughs/29922-kladovka-ulberta-v-gothic-1-remake-gde-nahoditsja-alef-i-kak-obchistit-sklad-s-pripasami.html"
      }
    ],
    "verification": "unknown",
    "notes": "Место уточнено: склад Яна и Альберто в Старой шахте. Название источника «шахта Альберто» описывало место рядом с персонажем, а не отдельный подтверждённый район. Этаж, сторона и число пластин совпадают в независимых описаниях. Версия игры не установлена; собственной проверки в игре не было.",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "17464",
      "Шахта Альберто: верхний правый сундук",
      "склад Яна"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-right-2nd-floor-jan-old-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
      },
      {
        "name": "Steam",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9045276"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-behind-cavalorn-hut/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/cavalorns-cave-door"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%94%D0%B2%D0%B5%D1%80%D1%8C%20%D0%B2%20%D0%BF%D0%B5%D1%89%D0%B5%D1%80%D0%B5%20%D0%9A%D0%B0%D0%B2%D0%B0%D0%BB%D0%BE%D1%80%D0%BD%D0%B0"
      }
    ],
    "verification": "source",
    "notes": "Ручная схема Arminek сопоставлена с отдельно названной дверью склада. Последовательности проверяются математически, без независимого прохождения на PS5.",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "245755"
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
    "contents": [
      "Зов сна × 1",
      "Северный тёмный × 4",
      "Болотник × 8",
      "Кусок руды × 28"
    ],
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/jackos-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L23"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-cave-of-marsh/"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%94%D0%B6%D0%B0%D0%BA%D0%BE"
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
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "searchAliases": [
      "723713"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-cave-of-marsh/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Gothic.tools team — Lockpicking & Chest Solutions",
          "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions#:~:text=Jacko's%20Chest"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
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
    "contents": [
      "Чертёж кровопийцы × 1",
      "Целебная эссенция × 2",
      "Отмычка × 1",
      "Стрела × 9",
      "Кусок руды × 16"
    ],
    "valuable": true,
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/monastery-ruins-chest"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-destroyed-monastery-cave/"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%A0%D0%B0%D0%B7%D1%80%D1%83%D1%88%D0%B5%D0%BD%D0%BD%D0%BE%D0%BC%20%D0%BC%D0%BE%D0%BD%D0%B0%D1%81%D1%82%D1%8B%D1%80%D0%B5"
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
    "solutionStatus": "unconfirmed",
    "searchAliases": [],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-destroyed-monastery-cave/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%A0%D0%B0%D0%B7%D1%80%D1%83%D1%88%D0%B5%D0%BD%D0%BD%D0%BE%D0%BC%20%D0%BC%D0%BE%D0%BD%D0%B0%D1%81%D1%82%D1%8B%D1%80%D0%B5",
          "author": "Zorthrus",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Land of Games подтверждает чертёж, 2 лечебных зелья,отмычку, 9 стрел и 16 руды; точная разновидность зелий взята из SGC."
    }
  },
  {
    "id": "new-camp-peasant-housing-door",
    "name": "Новый лагерь — дверь в жилье крестьян",
    "originalName": "New Camp Locked Cell Door",
    "camp": "new",
    "region": "new-camp",
    "sector": "Жильё крестьян — первый ярус настилов",
    "route": "Жильё крестьян у рисовых полей: подняться по настилам и лестнице возле Руфуса; решётка на втором ярусе.",
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-locked-cell-door"
      },
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=717432"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%97%D0%B0%D0%BF%D0%B5%D1%80%D1%82%D0%B0%D1%8F%20%D1%80%D0%B5%D1%88%D0%B5%D1%82%D0%BA%D0%B0%20%D0%BD%D0%B0%20%D0%B2%D0%B5%D1%80%D1%85%D0%BD%D0%B5%D0%BC%20%D1%83%D1%80%D0%BE%D0%B2%D0%BD%D0%B5%20%D0%BB%D0%B0%D0%B3%D0%B5%D1%80%D1%8F"
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
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "searchAliases": []
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
    "contents": [
      "Орочий молот",
      "Эликсир магической энергии",
      "Свиток «Огненный шар»"
    ],
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/orc-hammer-chest"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D1%81%20%D0%9E%D1%80%D0%BE%D1%87%D1%8C%D0%B8%D0%BC%20%D0%BC%D0%BE%D0%BB%D0%BE%D1%82%D0%BE%D0%BC"
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
    "solutionStatus": "unconfirmed",
    "searchAliases": [],
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/guides/29953-oruzhie-v-gothic-1-remake-gde-najti-luchshee.html",
          "author": "Droommar",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        },
        {
          "name": "Gothic.tools team — Lockpicking & Chest Solutions",
          "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions#:~:text=Orc%20Hammer%20Chest"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Названия самостоятельно переведены; официальная русская локализация не подтверждена."
    }
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
    "contents": [
      "Пергамент × 4",
      "Экстракт магической энергии × 2",
      "Формула эликсира духа × 1",
      "Формула эликсира жизни × 1",
      "Кольцо непобедимости × 1",
      "Свиток «Призыв голема» × 1"
    ],
    "valuable": true,
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
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/xardas-tower-third-floor-chest"
      },
      {
        "name": "drvladis / MIT",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L77"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-xardas-tower-3rd-floor/"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BD%D0%B0%203-%D0%BC%20%D1%8D%D1%82%D0%B0%D0%B6%D0%B5%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B8%20%D0%9A%D1%81%D0%B0%D1%80%D0%B4%D0%B0%D1%81%D0%B0"
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
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "searchAliases": [
      "136312"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-xardas-tower-3rd-floor/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "old-camp-abandoned-shack-chest",
    "name": "Сундук в подвале заброшенной хижины",
    "originalName": "Сундук в подвале заброшенной хижины",
    "camp": "old",
    "region": "old-camp-outskirts",
    "sector": "Окрестности Старого лагеря",
    "route": "Юго-восточнее Старого лагеря, под разрушенной хижиной; помещение связано с подземным ходом замка.",
    "type": "chest",
    "floor": "Подвал",
    "contents": [
      "Кольцо очищения × 1",
      "Эссенция духа × 1",
      "Пергамент × 2",
      "Жир кротокрыса × 3",
      "Монета × 15"
    ],
    "valuable": true,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст.",
      "Содержимое опубликовано 13.06.2026; в более поздней сборке игры отдельно не проверено."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-lock-abandoned-shack/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-lock-abandoned-shack/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-camp-ruined-hut-cellar-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L15"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=725516"
      },
      {
        "name": "Planet of Gothic — сундук №33, вклад сообщества не проверен в игре",
        "url": "https://www.planetofgothic.de/tools/atlas?poi=1890"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle",
      "dungeon"
    ],
    "searchAliases": [
      "725516",
      "заброшенная хижина",
      "разрушенная хижина",
      "тайный ход",
      "Старый лагерь"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "mapUrl": "https://www.planetofgothic.de/tools/atlas?poi=1890",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-lock-abandoned-shack/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "old-camp-market-upper-storehouse-door",
    "name": "Дверь склада над рынком",
    "originalName": "Дверь склада над рынком",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Над рыночной площадью и домом Фиска; подъём со стороны Уистлера, дверь в конце склада.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "GLP использует адрес santinos-chest, но текст страницы описывает дверь склада над рынком. Имя Сантино не подтверждает владельца двери."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/santinos-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=16116"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%94%D0%B2%D0%B5%D1%80%D1%8C%20%D0%B2%20%D0%BA%D0%BE%D0%BD%D1%86%D0%B5%20%D1%81%D0%BA%D0%BB%D0%B0%D0%B4%D0%B0%20%D0%BD%D0%B0%D0%B4%20%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%BE%D0%B9%20%D0%BF%D0%BB%D0%BE%D1%89%D0%B0%D0%B4%D1%8C%D1%8E"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "16116"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-north-gate-lock",
    "name": "Замок справа от северных ворот",
    "originalName": "Замок справа от северных ворот",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Сразу справа после входа через северные ворота Старого лагеря. Steam называет объект дверью, Lorthiz — сундуком.",
    "type": "unknown",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Источники расходятся: Steam/LoG называют дверью, Lorthiz — сундуком. Тип требует сверки на месте."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026797",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026797"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=234667"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%94%D0%B2%D0%B5%D1%80%D1%8C%20%D1%81%D0%BF%D1%80%D0%B0%D0%B2%D0%B0%20%D0%BE%D1%82%20%D0%A1%D0%B5%D0%B2%D0%B5%D1%80%D0%BD%D1%8B%D1%85%20%D0%B2%D0%BE%D1%80%D0%BE%D1%82"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "uncertain",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "234667"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-scavenger-spit-right-hut-chest",
    "name": "Сундук в правой хижине у вертела",
    "originalName": "Сундук в правой хижине у вертела",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Пара хижин напротив Мада, рядом с падальщиком на вертеле; правая по схеме Steam.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026797",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026797"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=74133"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%BF%D1%80%D0%B0%D0%B2%D0%BE%D0%B9%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D1%80%D1%83%D0%B4%D0%BE%D0%BA%D0%BE%D0%BF%D0%B0%20%D0%B2%D0%BE%D0%B7%D0%BB%D0%B5%20%D0%BF%D0%B0%D0%B4%D0%B0%D0%BB%D1%8C%D1%89%D0%B8%D0%BA%D0%B0%20%D0%BD%D0%B0%20%D0%B2%D0%B5%D1%80%D1%82%D0%B5%D0%BB%D0%B5"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "74133"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-scavenger-spit-left-hut-chest",
    "name": "Сундук в левой хижине у вертела",
    "originalName": "Сундук в левой хижине у вертела",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Пара хижин напротив Мада, рядом с падальщиком на вертеле; левая по схеме Steam.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026797",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026797"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=25621"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%BB%D0%B5%D0%B2%D0%BE%D0%B9%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D1%80%D1%83%D0%B4%D0%BE%D0%BA%D0%BE%D0%BF%D0%B0%20%D0%B2%D0%BE%D0%B7%D0%BB%D0%B5%20%D0%BF%D0%B0%D0%B4%D0%B0%D0%BB%D1%8C%D1%89%D0%B8%D0%BA%D0%B0%20%D0%BD%D0%B0%20%D0%B2%D0%B5%D1%80%D1%82%D0%B5%D0%BB%D0%B5"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "25621"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-north-wall-hut-1-chest",
    "name": "Северная стена: первая хижина",
    "originalName": "Северная стена: первая хижина",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Первая хижина вдоль стены к востоку от северных ворот.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065294",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065294"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=44777"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%BF%D0%B5%D1%80%D0%B2%D0%BE%D0%B9%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D1%83%20%D0%A1%D0%B5%D0%B2%D0%B5%D1%80%D0%BD%D1%8B%D1%85%20%D0%B2%D0%BE%D1%80%D0%BE%D1%82"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "44777"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-north-wall-hut-2-chest",
    "name": "Северная стена: вторая хижина",
    "originalName": "Северная стена: вторая хижина",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Вторая хижина вдоль стены к востоку от северных ворот.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065294",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065294"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=114351"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%D0%BE%20%D0%B2%D1%82%D0%BE%D1%80%D0%BE%D0%B9%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%B2%D0%BE%D0%B7%D0%BB%D0%B5%20%D0%A1%D0%B5%D0%B2%D0%B5%D1%80%D0%BD%D1%8B%D1%85%20%D0%B2%D0%BE%D1%80%D0%BE%D1%82"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "114351"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-north-wall-hut-3-chest",
    "name": "Северная стена: третья хижина",
    "originalName": "Северная стена: третья хижина",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Третья хижина вдоль стены к востоку от северных ворот.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065294",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065294"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=7711"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%82%D1%80%D0%B5%D1%82%D1%8C%D0%B5%D0%B9%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D1%83%20%D0%A1%D0%B5%D0%B2%D0%B5%D1%80%D0%BD%D1%8B%D1%85%20%D0%B2%D0%BE%D1%80%D0%BE%D1%82"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "7711"
    ],
    "plateCount": 4,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-snaf-entrance-chest",
    "name": "Ближний сундук в доме Снафа",
    "originalName": "Ближний сундук в доме Снафа",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "В доме Снафа, рядом с входной дверью; отдельный от сундука возле кровати.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065294",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065294"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=157733"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "157733"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-snaf-slope-left-hut-chest",
    "name": "Хижина напротив Снафа: левая",
    "originalName": "Хижина напротив Снафа: левая",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "На спуске напротив дома Снафа; левая из двух хижин под стеной.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065294",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065294"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=716157"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B0%20%D0%BD%D0%B0%20%D1%81%D0%BF%D1%83%D1%81%D0%BA%D0%B5%20%D0%BD%D0%B0%D0%BF%D1%80%D0%BE%D1%82%D0%B8%D0%B2%20%D0%BB%D0%B0%D1%87%D1%83%D0%B3%D0%B8%20%D0%A1%D0%BD%D0%B0%D1%84%D0%B0%20(%D1%81%D0%BB%D0%B5%D0%B2%D0%B0)"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "716157"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-snaf-slope-right-hut-chest",
    "name": "Хижина напротив Снафа: правая",
    "originalName": "Хижина напротив Снафа: правая",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "На спуске напротив дома Снафа; правая из двух хижин под стеной.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065294",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065294"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=71524"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B0%20%D0%BD%D0%B0%20%D1%81%D0%BF%D1%83%D1%81%D0%BA%D0%B5%20%D0%BD%D0%B0%D0%BF%D1%80%D0%BE%D1%82%D0%B8%D0%B2%20%D0%BB%D0%B0%D1%87%D1%83%D0%B3%D0%B8%20%D0%A1%D0%BD%D0%B0%D1%84%D0%B0%20(%D1%81%D0%BF%D1%80%D0%B0%D0%B2%D0%B0)"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "71524"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-graham-right-hut-chest",
    "name": "Хижина справа от Грэхэма",
    "originalName": "Хижина справа от Грэхэма",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Соседняя хижина справа от жилища картографа Грэхэма.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9103187",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9103187"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=14753"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D1%81%D0%BF%D1%80%D0%B0%D0%B2%D0%B0%20%D0%BE%D1%82%20%D0%93%D1%80%D1%8D%D1%85%D0%B5%D0%BC%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "14753"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-graham-left-hut-chest",
    "name": "Хижина слева от Грэхэма",
    "originalName": "Хижина слева от Грэхэма",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Соседняя хижина слева от жилища картографа Грэхэма.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9103187",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9103187"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=44637"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D1%81%D0%BB%D0%B5%D0%B2%D0%B0%20%D0%BE%D1%82%20%D0%93%D1%80%D1%8D%D1%85%D0%B5%D0%BC%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "44637"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-sly-right-hut-chest",
    "name": "Хижина справа от Слая",
    "originalName": "Хижина справа от Слая",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Соседняя хижина справа от дома Слая, у внешней стены.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9103187",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9103187"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=667541"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D1%81%D0%BF%D1%80%D0%B0%D0%B2%D0%B0%20%D0%BE%D1%82%20%D0%BB%D0%B0%D1%87%D1%83%D0%B3%D0%B8%20%D0%A1%D0%BB%D0%B0%D1%8F"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "667541"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-market-far-hut-chest",
    "name": "Дальняя хижина у рынка",
    "originalName": "Дальняя хижина у рынка",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Первая хижина рынка со стороны Мордрага; в Steam — дальняя от Фиска.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=13577"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B4%D0%B0%D0%BB%D1%8C%D0%BD%D0%B5%D0%B9%20%D0%BB%D0%B0%D1%87%D1%83%D0%B3%D0%B5%20%D0%BE%D1%82%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D1%8B%20%D0%A4%D0%B8%D1%81%D0%BA%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "13577"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-fisk-behind-hut-chest",
    "name": "Хижина позади Фиска",
    "originalName": "Хижина позади Фиска",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Хижина за домом Фиска, с разложенными снаружи шкурами.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9039898"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=62211"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BF%D0%BE%D0%B7%D0%B0%D0%B4%D0%B8%20%D0%B4%D0%BE%D0%BC%D0%B0%20%D0%A4%D0%B8%D1%81%D0%BA%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "62211"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-south-road-first-hut-chest",
    "name": "Первая хижина на пути к южным воротам",
    "originalName": "Первая хижина на пути к южным воротам",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "За рыночной площадью по пути к южным воротам; следующая хижина после дома Мордрага.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9043940",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9043940"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=251275"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%BF%D0%B5%D1%80%D0%B2%D0%BE%D0%B9%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BF%D0%BE%D1%81%D0%BB%D0%B5%20%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%BE%D0%B9%20%D0%BF%D0%BB%D0%BE%D1%89%D0%B0%D0%B4%D0%B8%20%D0%BF%D0%BE%20%D0%B4%D0%BE%D1%80%D0%BE%D0%B3%D0%B5%20%D0%BA%20%D0%AE%D0%B6%D0%BD%D1%8B%D0%BC%20%D0%B2%D0%BE%D1%80%D0%BE%D1%82%D0%B0%D0%BC"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "251275"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-shadow-hut-after-arena-chest",
    "name": "Хижина призрака за ареной",
    "originalName": "Хижина призрака за ареной",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Между ареной и обрушенной башней, после жилища бойца арены.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9043963",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9043963"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=37111"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BF%D1%80%D0%B8%D0%B7%D1%80%D0%B0%D0%BA%D0%B0%20%D0%BF%D0%BE%D1%81%D0%BB%D0%B5%20%D0%BB%D0%B0%D1%87%D1%83%D0%B3%D0%B8%20%D0%A5%D0%B0%D1%80%D0%B8%D0%BC%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "37111"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-collapsed-wall-chest",
    "name": "Сундук в углублении у призраков",
    "originalName": "Сундук в углублении у призраков",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "У призраков в углублении обрушенной башни внутри Старого лагеря.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9043963",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9043963"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=17124"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%81%D1%82%D0%BE%D1%80%D0%BE%D0%B6%D0%BA%D0%B5%20%D0%BF%D1%80%D0%B8%D0%B7%D1%80%D0%B0%D0%BA%D0%BE%D0%B2%20%D0%B2%20%D1%83%D0%B3%D0%BB%D1%83%D0%B1%D0%BB%D0%B5%D0%BD%D0%B8%D0%B8"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "17124"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-through-hut-plate-chest",
    "name": "Сундук с тарелкой в сквозной хижине",
    "originalName": "Сундук с тарелкой в сквозной хижине",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Длинная хижина с двумя открытыми проходами рядом со Снафом.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Тарелка × 1"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9043963",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9043963"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=1153"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%81%D0%BA%D0%B2%D0%BE%D0%B7%D0%BD%D0%BE%D0%B9%20%D0%BB%D0%B0%D1%87%D1%83%D0%B3%D0%B5"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "1153"
    ],
    "plateCount": 4,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%81%D0%BA%D0%B2%D0%BE%D0%B7%D0%BD%D0%BE%D0%B9%20%D0%BB%D0%B0%D1%87%D1%83%D0%B3%D0%B5",
          "author": "Zorthrus",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Источник указывает единственный предмет."
    }
  },
  {
    "id": "old-camp-huno-opposite-left-chest",
    "name": "Напротив Хуно: левая хижина",
    "originalName": "Напротив Хуно: левая хижина",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Левая из трёх хижин напротив кузницы Хуно.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=754324"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BD%D0%B0%D0%BF%D1%80%D0%BE%D1%82%D0%B8%D0%B2%20%D0%BA%D1%83%D0%B7%D0%BD%D0%B5%D1%86%D0%B0%20%D0%A5%D1%83%D0%BD%D0%BE%20(%D1%81%D0%BB%D0%B5%D0%B2%D0%B0)"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "754324"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-huno-opposite-middle-chest",
    "name": "Напротив Хуно: средняя хижина",
    "originalName": "Напротив Хуно: средняя хижина",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Средняя хижина напротив кузницы Хуно.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=1314"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BD%D0%B0%D0%BF%D1%80%D0%BE%D1%82%D0%B8%D0%B2%20%D0%BA%D1%83%D0%B7%D0%BD%D0%B5%D1%86%D0%B0%20%D0%A5%D1%83%D0%BD%D0%BE%20(%D1%86%D0%B5%D0%BD%D1%82%D1%80)"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "1314"
    ],
    "plateCount": 4,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-huno-opposite-right-chest",
    "name": "Напротив Хуно: правая хижина",
    "originalName": "Напротив Хуно: правая хижина",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Правая из трёх хижин напротив кузницы Хуно.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=117731"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BD%D0%B0%D0%BF%D1%80%D0%BE%D1%82%D0%B8%D0%B2%20%D0%BA%D1%83%D0%B7%D0%BD%D0%B5%D1%86%D0%B0%20%D0%A5%D1%83%D0%BD%D0%BE%20(%D1%81%D0%BF%D1%80%D0%B0%D0%B2%D0%B0)"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "117731"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-huno-before-hut-chest",
    "name": "Хижина перед кузницей Хуно",
    "originalName": "Хижина перед кузницей Хуно",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Соседняя с кузницей хижина справа; в Steam отмечена перед Хуно.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=74144"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BF%D1%80%D1%8F%D0%BC%D0%BE%20%D0%BF%D0%B5%D1%80%D0%B5%D0%B4%20%D0%BA%D1%83%D0%B7%D0%BD%D0%B5%D1%86%D0%BE%D0%BC%20%D0%A5%D1%83%D0%BD%D0%BE"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "74144"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-huno-after-hut-chest",
    "name": "Хижина за кузницей Хуно",
    "originalName": "Хижина за кузницей Хуно",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Между кузницей Хуно и обрушенной башней, справа.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=23615"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BF%D1%80%D1%8F%D0%BC%D0%BE%20%D0%BF%D0%BE%D1%81%D0%BB%D0%B5%20%D0%BA%D1%83%D0%B7%D0%BD%D0%B5%D1%86%D0%B0%20%D0%A5%D1%83%D0%BD%D0%BE"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "23615"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-huno-far-left-hut-chest",
    "name": "Дальняя хижина между Хуно и башней",
    "originalName": "Дальняя хижина между Хуно и башней",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Из двух хижин слева между кузницей и обрушенной башней — дальняя.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=1675"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B4%D0%B0%D0%BB%D1%8C%D0%BD%D0%B5%D0%B9%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BE%D1%82%20%D0%BA%D1%83%D0%B7%D0%BD%D0%B5%D1%86%D0%B0%20%D0%A5%D1%83%D0%BD%D0%BE"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "1675"
    ],
    "plateCount": 4,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-huno-near-left-hut-chest",
    "name": "Ближняя хижина между Хуно и башней",
    "originalName": "Ближняя хижина между Хуно и башней",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Из двух хижин слева между кузницей и обрушенной башней — ближняя.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9044050"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=25771"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%B1%D0%BB%D0%B8%D0%B6%D0%BD%D0%B5%D0%B9%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BE%D1%82%20%D0%BA%D1%83%D0%B7%D0%BD%D0%B5%D1%86%D0%B0%20%D0%A5%D1%83%D0%BD%D0%BE"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "25771"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-above-arena-first-hut-chest",
    "name": "Первая хижина над ареной",
    "originalName": "Первая хижина над ареной",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Верхние настилы за ареной; первая хижина по порядку Steam.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065594",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065594"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=66667"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%BF%D0%B5%D1%80%D0%B2%D0%BE%D0%B9%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BD%D0%B0%D0%B4%20%D0%90%D1%80%D0%B5%D0%BD%D0%BE%D0%B9"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "66667"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-above-arena-second-hut-chest",
    "name": "Вторая хижина над ареной",
    "originalName": "Вторая хижина над ареной",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Верхние настилы за ареной; вторая хижина по порядку Steam.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065594",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065594"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=51751"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%D0%BE%20%D0%B2%D1%82%D0%BE%D1%80%D0%BE%D0%B9%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D0%BD%D0%B0%D0%B4%20%D0%90%D1%80%D0%B5%D0%BD%D0%BE%D0%B9"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "51751"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-red-tent-right-hut-chest",
    "name": "Хижина справа от красного шатра",
    "originalName": "Хижина справа от красного шатра",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Над ареной, справа от красного шатра.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065594",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065594"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=4166776"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%85%D0%B8%D0%B6%D0%B8%D0%BD%D0%B5%20%D1%81%D0%BF%D1%80%D0%B0%D0%B2%D0%B0%20%D0%BE%D1%82%20%D0%BA%D1%80%D0%B0%D1%81%D0%BD%D0%BE%D0%B3%D0%BE%20%D1%88%D0%B0%D1%82%D1%80%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "4166776"
    ],
    "plateCount": 7,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "inner-castle-blacksmith-backwall-chest",
    "name": "Сундук у дальней стены кузницы Стоуна",
    "originalName": "Сундук у дальней стены кузницы Стоуна",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кузница внутри замка; сундук у дальней стены за Стоуном.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9327177",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9327177"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/inner-castle-blacksmith-backwall-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L60"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=137147"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "137147"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "inner-castle-blacksmith-center-chest",
    "name": "Сундук перед Стоуном в кузнице",
    "originalName": "Сундук перед Стоуном в кузнице",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Кузница внутри замка; сундук в центральной части мастерской.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9327177",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9327177"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/inner-castle-blacksmith-center-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L61"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=54766"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "54766"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "inner-castle-blacksmith-back-right-door",
    "name": "Дверь склада кузницы Стоуна",
    "originalName": "Дверь склада кузницы Стоуна",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "В глубине кузницы внутреннего замка, справа.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9327177",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9327177"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/inner-castle-blacksmith-back-right-door"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L7"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=767365"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "767365"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "inner-castle-blacksmith-storage-right-chest",
    "name": "Правый сундук склада кузницы",
    "originalName": "Правый сундук склада кузницы",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "За дверью склада кузницы Стоуна, справа.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9327177",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9327177"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/inner-castle-blacksmith-storage-right-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L8"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=631212"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "631212"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "inner-castle-blacksmith-upstairs-chest-1",
    "name": "Спальня над кузницей: сундук №1",
    "originalName": "Спальня над кузницей: сундук №1",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Комната над кузницей Стоуна; №1 на изображении Steam, №2 в Lorthiz.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/inner-castle-blacksmith-upstairs-chest-2"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=66347"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "66347"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "inner-castle-blacksmith-upstairs-chest-2",
    "name": "Спальня над кузницей: сундук №2",
    "originalName": "Спальня над кузницей: сундук №2",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Комната над кузницей Стоуна; №2 на изображении Steam, №3 в Lorthiz.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/inner-castle-blacksmith-upstairs-chest-3"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=161477"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "161477"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "inner-castle-blacksmith-upstairs-chest-4",
    "name": "Спальня над кузницей: сундук №4",
    "originalName": "Спальня над кузницей: сундук №4",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Комната над кузницей Стоуна; №4 на изображении Steam, №5 в Lorthiz.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/inner-castle-blacksmith-upstairs-chest-5"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=73775"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "73775"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "inner-castle-blacksmith-upstairs-chest-5",
    "name": "Спальня над кузницей: сундук №5",
    "originalName": "Спальня над кузницей: сундук №5",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Комната над кузницей Стоуна; №5 на изображении Steam, №6 в Lorthiz.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/inner-castle-blacksmith-upstairs-chest-7"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=71417"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "71417"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "inner-castle-blacksmith-upstairs-chest-6",
    "name": "Спальня над кузницей: сундук №6",
    "originalName": "Спальня над кузницей: сундук №6",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Комната над кузницей Стоуна; №6 на изображении Steam, №7 в Lorthiz.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/inner-castle-blacksmith-upstairs-chest-6"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=762652"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "762652"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "inner-castle-blacksmith-upstairs-chest-7",
    "name": "Спальня над кузницей: сундук №7",
    "originalName": "Спальня над кузницей: сундук №7",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Комната над кузницей Стоуна; №7 на изображении Steam, №8 в Lorthiz.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/inner-castle-blacksmith-upstairs-chest-9"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=477676"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "477676"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "inner-castle-blacksmith-upstairs-chest-8",
    "name": "Спальня над кузницей: сундук №8",
    "originalName": "Спальня над кузницей: сундук №8",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Комната над кузницей Стоуна; №8 на изображении Steam, №9 в Lorthiz.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/inner-castle-blacksmith-upstairs-chest-8"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=21776"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "21776"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "inner-castle-blacksmith-upstairs-chest-9",
    "name": "Спальня над кузницей: сундук №9",
    "originalName": "Спальня над кузницей: сундук №9",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Комната над кузницей Стоуна; №9 на изображении Steam, №1 в Lorthiz.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356534"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/inner-castle-blacksmith-upstairs-chest-1"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=1775"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "1775"
    ],
    "plateCount": 4,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "ore-baron-manor-kitchen-chest",
    "name": "Сундук кухни Гомеза",
    "originalName": "Сундук кухни Гомеза",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Первый этаж замка, кухня рядом с тронным залом.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ore-baron-manor-kitchen-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L72"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=176172"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "176172"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "ravens-room-locked-door",
    "name": "Дверь комнаты Ворона",
    "originalName": "Дверь комнаты Ворона",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Жилой этаж замка; вторая дверь слева в коридоре.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356592"
      },
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021379"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-gomez-castle-floor-two-left/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ravens-room-locked-door"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L33"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=317122"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%94%D0%B2%D0%B5%D1%80%D1%8C%20%D0%B2%20%D0%BA%D0%BE%D0%BC%D0%BD%D0%B0%D1%82%D1%83%20%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B0"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "317122"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "ravens-tower-locked-door",
    "name": "Дверь из комнаты Ворона в башню",
    "originalName": "Дверь из комнаты Ворона в башню",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "В комнате Ворона; проход в его башню.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9357319",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9357319"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/ravens-tower-locked-door"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=127427"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "127427"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "santino-storehouse-entrance-chest",
    "name": "Сантино: сундук у входа склада",
    "originalName": "Сантино: сундук у входа склада",
    "camp": "other",
    "region": "old-mine",
    "sector": "Старая шахта",
    "route": "Первый сундук после входа на склад Сантино в Старой шахте.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Хлеб × 6",
      "Яблоко × 8",
      "Суп из ползуна × 2",
      "Пиво × 5"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9143853",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9143853"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-right-from-trader-old-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/santinos-old-mine-storehouse-entrance-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=12741"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "12741"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-right-from-trader-old-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "santino-storehouse-upstairs-chest",
    "name": "Сантино: сундук на верхнем этаже",
    "originalName": "Сантино: сундук на верхнем этаже",
    "camp": "other",
    "region": "old-mine",
    "sector": "Старая шахта",
    "route": "Верхний этаж склада Сантино, над торговцем.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кусок руды × 19",
      "Факел × 2"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-over-trader-old-mine/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-over-trader-old-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/santinos-old-mine-storehouse-upstairs-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=11443"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "11443"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-over-trader-old-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "free-mine-above-entrance-chest",
    "name": "Сундук над входом Свободной шахты",
    "originalName": "Сундук над входом Свободной шахты",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": "Жилище над главным входом; подняться по лестнице.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Вино × 1",
      "Кузнечный молот × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9143913",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9143913"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-before-entering-free-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/free-mine-above-entrance-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=717651"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "717651"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-before-entering-free-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "free-mine-outer-cave-chest",
    "name": "Сундук в верхнем тоннеле у Окила",
    "originalName": "Сундук в верхнем тоннеле у Окила",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": "Верхний тоннель возле Окила; источники называют также пещерой снаружи шахты.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9143913",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9143913"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-outside-of-cave-free-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/free-mine-outer-cave-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=45651"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine",
      "cave"
    ],
    "searchAliases": [
      "45651"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "empty",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-outside-of-cave-free-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Источник сообщает, что сундук пуст; версия игры не указана."
    }
  },
  {
    "id": "free-mine-highest-hut-chest",
    "name": "Сундук в самом верхнем жилище шахты",
    "originalName": "Сундук в самом верхнем жилище шахты",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": "Небольшое строение почти на вершине поселения Свободной шахты.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Жареное мясо × 1",
      "Железо × 2",
      "Вода × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9143913",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9143913"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-highest-in-free-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/free-mine-highest-hut-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=741417"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "741417"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-highest-in-free-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "bandits-cave-chest-near-cavalorn",
    "name": "Второй сундук у разбойников: пещера",
    "originalName": "Второй сундук у разбойников: пещера",
    "camp": "other",
    "region": "cavalorn",
    "sector": "Окрестности Кавалорна",
    "route": "Рядом с двумя разбойниками, требующими руду, но в пещере за ними; отдельно от сундука на поляне.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L21"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=521112"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "521112"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "black-goblin-cave-below-river-bridge-chest",
    "name": "Сундук гоблинской пещеры под мостом",
    "originalName": "Сундук гоблинской пещеры под мостом",
    "camp": "other",
    "region": "caves",
    "sector": "Пещеры",
    "route": "Пещера под мостом возле двух разбойников, у реки и водопада на пути к Новому лагерю.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кольцо магии × 1",
      "Экстракт магической энергии × 1",
      "Золото × 1",
      "Целебный экстракт × 1",
      "Лабораторный флакон × 2",
      "Кусок руды × 8"
    ],
    "valuable": true,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-waterfall-new-camp/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/black-goblin-cave-below-river-bridge-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=37775"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "37775"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-waterfall-new-camp/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "new-camp-jan-near-lake-ruined-hut-chest",
    "name": "Сундук в руинах хижины рядом с Джаном",
    "originalName": "Сундук в руинах хижины рядом с Джаном",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "У озера со стороны Нового лагеря, между Джаном и соседним зданием.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=23115"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "23115"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "new-camp-entrance-lake-chest",
    "name": "Подводный сундук у входа Нового лагеря",
    "originalName": "Подводный сундук у входа Нового лагеря",
    "camp": "other",
    "region": "underwater",
    "sector": "Подводные области",
    "route": "На дне озера рядом с Джаном и входом в Новый лагерь.",
    "type": "underwater",
    "floor": null,
    "contents": [
      "Укус шныга × 1",
      "Целебная эссенция × 1",
      "Пиво × 2",
      "Кусок руды × 28"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021380"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-underwater-near-new-camp/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-entrance-lake-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=67672"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "underwater"
    ],
    "searchAliases": [
      "67672"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-underwater-near-new-camp/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "new-camp-under-opposite-hut-chest",
    "name": "Сундук под хижиной на противоположном берегу",
    "originalName": "Сундук под хижиной на противоположном берегу",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Под разрушенной хижиной возле воды и причала, на противоположном от Джана берегу.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=17137"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "17137"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "mercenary-watchtower-chest-1",
    "name": "Застава Джарвиса: сундук у механизма ворот",
    "originalName": "Застава Джарвиса: сундук у механизма ворот",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Ярус над воротами Нового лагеря, комната с воротным колесом.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Слабые лечебные травы × 2",
      "Рисовый шнапс × 4",
      "Хлеб × 3",
      "Рис × 8"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/mercenary-watchtower-chest-1"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=726775"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%9F%D0%B5%D1%80%D0%B2%D1%8B%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BD%D0%B0%20%D1%81%D1%82%D0%BE%D1%80%D0%BE%D0%B6%D0%B5%D0%B2%D0%BE%D0%B9%20%D0%B2%D1%8B%D1%88%D0%BA%D0%B5%20%D0%BD%D0%B0%D0%B5%D0%BC%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "726775"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Gothic.tools team — Lockpicking & Chest Solutions",
          "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions#:~:text=Mercenary%20Watchtower%20Chest%20%231"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Названия самостоятельно переведены; официальная русская локализация не подтверждена."
    }
  },
  {
    "id": "mercenary-watchtower-chest-2",
    "name": "Застава Джарвиса: сундук наверху",
    "originalName": "Застава Джарвиса: сундук наверху",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Верхняя площадка башни над воротами, где стоит Джарвис.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Короткий лук",
      "Стрелы × 7"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9065810"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/mercenary-watchtower-chest-2"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=441345"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%92%D1%82%D0%BE%D1%80%D0%BE%D0%B9%20%D1%81%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BD%D0%B0%20%D1%81%D1%82%D0%BE%D1%80%D0%BE%D0%B6%D0%B5%D0%B2%D0%BE%D0%B9%20%D0%B2%D1%8B%D1%88%D0%BA%D0%B5%20%D0%BD%D0%B0%D0%B5%D0%BC%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "441345"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Gothic.tools team — Lockpicking & Chest Solutions",
          "url": "https://www.gothic.tools/guides/lockpicking-and-chest-solutions#:~:text=Mercenary%20Watchtower%20Chest%20%232"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Названия самостоятельно переведены; официальная русская локализация не подтверждена."
    }
  },
  {
    "id": "new-camp-upper-first-hut-chest",
    "name": "Верхняя первая хижина Нового лагеря",
    "originalName": "Верхняя первая хижина Нового лагеря",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Верхняя хижина, первой показанная в разделе Steam «Новый лагерь»; сверяйте изображение источника.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026811",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026811"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=44576"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "44576"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "new-camp-above-kagan-hut-2-chest",
    "name": "Хижина над костром Баала Кагана: средняя",
    "originalName": "Хижина над костром Баала Кагана: средняя",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "На деревянных настилах над костром Баала Кагана, вторая из трёх хижин.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026811",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026811"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=73175"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "73175"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "new-camp-above-kagan-hut-1-chest",
    "name": "Хижина над костром Баала Кагана: нижняя",
    "originalName": "Хижина над костром Баала Кагана: нижняя",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "На деревянных настилах над костром Баала Кагана, первая из трёх хижин.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026811",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026811"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=74715"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "74715"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "lees-cave-entrance",
    "name": "Решётка пещеры Ли",
    "originalName": "Решётка пещеры Ли",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Вход в пещеру Ли на верхнем уровне Нового лагеря.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026811",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9026811"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/lees-cave-entrance"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L24"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=153151"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "153151"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "captains-shipwreck-cabin",
    "name": "Дверь капитанской каюты",
    "originalName": "Дверь капитанской каюты",
    "camp": "other",
    "region": "shipwreck-coast",
    "sector": "Побережье и затонувший корабль",
    "route": "Обломки корабля на берегу огненных ящеров; дверь каюты под штурвалом.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/captains-shipwreck-cabin"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L18"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=63512"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "63512"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "fire-lizard-beach-shipwreck-chest",
    "name": "Сундук в капитанской каюте",
    "originalName": "Сундук в капитанской каюте",
    "camp": "other",
    "region": "shipwreck-coast",
    "sector": "Побережье и затонувший корабль",
    "route": "Внутри каюты разбитого корабля на берегу огненных ящеров.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Амулет брони",
      "Рубин",
      "Стрелы",
      "Болты",
      "Монеты",
      "Железная древесина"
    ],
    "valuable": true,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/fire-lizard-beach-shipwreck-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L19"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=716521"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "716521"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/guides/29946-kapitanskij-kljuch-v-gothic-1-remake-kak-otkryt-dver-na-korable.html",
          "author": "Zorthrus",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        },
        {
          "name": "Nanomaks — Steam",
          "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576"
        },
        {
          "name": "Guszaban — GameFAQs, General Walkthrough",
          "url": "https://gamefaqs.gamespot.com/ps5/288748-gothic-1-remake/faqs/82626/general-walkthrough"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Количество предметов в текстовом перечне не уточнено. Экстракт силы и монеты на полке каюты не добавлены в сундук."
    }
  },
  {
    "id": "swamp-focus-zombie-cave-chest",
    "name": "Сундук пещеры под юнитором",
    "originalName": "Сундук пещеры под юнитором",
    "camp": "other",
    "region": "caves",
    "sector": "Пещеры",
    "route": "Под каменным кругом возле Болотного лагеря; небольшая пещера с зомби.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Руна «Шаровая молния» × 1",
      "Зелье могущества × 1",
      "Кольцо защиты от огня × 1",
      "Рубин × 1",
      "Железо × 1",
      "Кусок руды × 14"
    ],
    "valuable": true,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-under-altar/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/swamp-camp-zombie-cliff-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L16"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=521711"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BD%D0%B0%20%D0%A3%D1%82%D0%B5%D1%81%D0%B5%20%D1%81%20%D0%B7%D0%BE%D0%BC%D0%B1%D0%B8"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "521711"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-under-altar/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Nanomaks — Steam",
          "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "shipwreck-coast-secret-troll-cave-chest",
    "name": "Сундук с ключом капитана",
    "originalName": "Сундук с ключом капитана",
    "camp": "other",
    "region": "shipwreck-coast",
    "sector": "Побережье и затонувший корабль",
    "route": "Тайная пещера в скалах над кораблём, с гоблинами и троллем; правый сундук.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Капитанский ключ",
      "Эликсиры магической энергии",
      "Целебный экстракт",
      "Кусок руды × 15"
    ],
    "valuable": true,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/shipwreck-coast-secret-troll-cave-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=25161"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "25161"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/guides/29946-kapitanskij-kljuch-v-gothic-1-remake-kak-otkryt-dver-na-korable.html",
          "author": "Zorthrus",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        },
        {
          "name": "Nanomaks — Steam",
          "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Ключ и зелья перечислены в Land of Games; 15 кусков руды — в руководстве Steam. Полный состав и количества зелий не установлены."
    }
  },
  {
    "id": "shipwreck-troll-cave-chest-2",
    "name": "Левый сундук пещеры тролля у корабля",
    "originalName": "Левый сундук пещеры тролля у корабля",
    "camp": "other",
    "region": "shipwreck-coast",
    "sector": "Побережье и затонувший корабль",
    "route": "Второй сундук в пещере гоблинов и тролля над разбитым кораблём; слева.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9356576"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/shipwreck-troll-cave-chest-2"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=13667"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "13667"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-citadel-golem-workshop-chest",
    "name": "Сундук мастерской недостроенного голема",
    "originalName": "Сундук мастерской недостроенного голема",
    "camp": "other",
    "region": "old-citadel",
    "sector": "Старая цитадель",
    "route": "Мастерская под Старой цитаделью, напротив недостроенного голема.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Эликсир магической энергии × 1",
      "Орочий молот × 1",
      "Свиток «Огненный шар» × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст.",
      "Возможно совпадение с сундуком Орочьего молота у Горной крепости: одинаковый механизм, но описание помещения требует сверки.",
      "Возможно совпадение с сундуком Орочьего молота у Горной крепости: механизм совпадает, но описания кузницы и мастерской голема требуют сверки по карте."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105528",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105528"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-cave-with-not-finished-golem/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-citadel-golem-workshop-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=43124"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "uncertain",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "43124"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "relatedIds": [
      "mountain-fortress-forge-orc-hammer-chest"
    ],
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-cave-with-not-finished-golem/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Перечень относится к сундуку напротив недостроенного голема. Его соответствие отдельной карточке кузницы Горной крепости пока не установлено."
    }
  },
  {
    "id": "mountain-fortress-cellar-right-grate",
    "name": "Правая решётка подвала Горного форта",
    "originalName": "Правая решётка подвала Горного форта",
    "camp": "other",
    "region": "mountain-fortress",
    "sector": "Горная крепость",
    "route": "Подвал Горного форта; правая из двух решёток.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105528",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105528"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/cellar-cages-right-grate"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=731576"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle",
      "dungeon"
    ],
    "searchAliases": [
      "731576"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "mountain-fortress-cellar-left-grate",
    "name": "Левая решётка подвала Горного форта",
    "originalName": "Левая решётка подвала Горного форта",
    "camp": "other",
    "region": "mountain-fortress",
    "sector": "Горная крепость",
    "route": "Подвал Горного форта; левая из двух решёток.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105528",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105528"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/cellar-cages"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=411522"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle",
      "dungeon"
    ],
    "searchAliases": [
      "411522"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "mountain-fortress-broken-bridge-chest",
    "name": "Сундук за разрушенным мостом Горного форта",
    "originalName": "Сундук за разрушенным мостом Горного форта",
    "camp": "other",
    "region": "mountain-fortress",
    "sector": "Горная крепость",
    "route": "Отдельная площадка за разрушенным мостом; ориентир — статуи.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Зелье превосходства × 1",
      "Боевой арбалет × 1",
      "Железная древесина × 1",
      "Болт × 10"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105528",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9105528"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-fort-summit-near-statues/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/mountain-fortress-broken-bridge-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=432217"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "432217"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-fort-summit-near-statues/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        },
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/guides/30066-vse-sunduki-v-gornom-forte-v-gothic-1-remake-gde-najti-kak-otkryt-i-chto-lezhit-vnutri.html",
          "author": "Droommar",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Land of Games подтверждает тот же набор из 4 видов предметов."
    }
  },
  {
    "id": "old-citadel-ruined-tower-chest",
    "name": "Сундук на вершине Старой цитадели",
    "originalName": "Сундук на вершине Старой цитадели",
    "camp": "other",
    "region": "old-citadel",
    "sector": "Старая цитадель",
    "route": "Разрушенная башня Старой цитадели к югу от Старого лагеря; верхняя площадка с колоколом.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314254",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314254"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-citadel-ruined-tower-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L13"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=756627"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D1%80%D0%B0%D0%B7%D1%80%D1%83%D1%88%D0%B5%D0%BD%D0%BD%D0%BE%D0%B9%20%D0%B1%D0%B0%D1%88%D0%BD%D0%B5%20%D0%A1%D1%82%D0%B0%D1%80%D0%BE%D0%B9%20%D0%BA%D1%80%D0%B5%D0%BF%D0%BE%D1%81%D1%82%D0%B8"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle",
      "tower"
    ],
    "searchAliases": [
      "756627"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-citadel-underground-chest",
    "name": "Сундук у каменного голема Старой цитадели",
    "originalName": "Сундук у каменного голема Старой цитадели",
    "camp": "other",
    "region": "old-citadel",
    "sector": "Старая цитадель",
    "route": "Нижняя часть Старой цитадели, возле каменного голема.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Амулет проворства × 1",
      "Кусок руды × 8",
      "Болт × 7",
      "Перо × 5",
      "Арбалет × 1"
    ],
    "valuable": true,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314254",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314254"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-destroyed-fortress/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-citadel-underground-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L55"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=276732"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%B2%20%D0%BF%D0%BE%D0%B4%D0%B7%D0%B5%D0%BC%D0%B5%D0%BB%D1%8C%D0%B5%20%D0%A1%D1%82%D0%B0%D1%80%D0%BE%D0%B9%20%D0%BA%D1%80%D0%B5%D0%BF%D0%BE%D1%81%D1%82%D0%B8"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "276732"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-destroyed-fortress/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "orc-town-approach-tower-chest",
    "name": "Сундук башни перед городом орков",
    "originalName": "Сундук башни перед городом орков",
    "camp": "other",
    "region": "orc-territory",
    "sector": "Земли и город орков",
    "route": "Верх башни на подходе к городу орков.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Рог × 1",
      "Целебный экстракт × 2",
      "Экстракт магической энергии × 1",
      "Круш Агаш × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314230",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314230"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-tower-before-orcs-town/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/orc-town-approach-tower-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=13643"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "13643"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-tower-before-orcs-town/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "orc-territory-razor-cave-chest",
    "name": "Сундук пещеры бритвозубов",
    "originalName": "Сундук пещеры бритвозубов",
    "camp": "other",
    "region": "orc-territory",
    "sector": "Земли и город орков",
    "route": "Пещера возле озера в землях орков, неподалёку от башни Ксардаса.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Железо × 5",
      "Полоски кожи × 7",
      "Эссенция магической энергии × 1",
      "Свиток «Превращение в кусача» × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314230",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314230"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-cave-razorteeth-orcs-land/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/orc-territory-razor-cave-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=716463"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower",
      "cave"
    ],
    "searchAliases": [
      "716463"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-cave-razorteeth-orcs-land/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "xardas-tower-demon-chest",
    "name": "Сундук за демоном Ксардаса",
    "originalName": "Сундук за демоном Ксардаса",
    "camp": "other",
    "region": "xardas-tower",
    "sector": "Башня Ксардаса",
    "route": "Жилая башня Ксардаса; сундук рядом с демоном.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Золото × 1",
      "Рубин × 2",
      "Сталь × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314274",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#9314274"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-behind-demon-xardas-tower/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/xardas-tower-chest-02"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L14"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=251261"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "251261"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-behind-demon-xardas-tower/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "free-mine-left-storehouse-chest-1",
    "name": "Свободная шахта: левый склад, сундук №1",
    "originalName": "Свободная шахта: левый склад, сундук №1",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": "Левое строение за Окилом; первый из двух сундуков.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Окорок × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021380",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021380"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-free-mine-on-left-2nd-floor/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/free-mine-left-storehouse-chest-1"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=77355"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "77355"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-free-mine-on-left-2nd-floor/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "orc-shaman-cave-chest-1",
    "name": "Пещера шаманов: сундук №1",
    "originalName": "Пещера шаманов: сундук №1",
    "camp": "other",
    "region": "orc-territory",
    "sector": "Земли и город орков",
    "route": "Тоннели справа от молящихся шаманов в орочьем поселении; первый из трёх по Lorthiz.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9032315",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9032315"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/shamans-living-quarters-cave-herb-storage-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=353143"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "353143"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "orc-shaman-cave-chest-2",
    "name": "Пещера шаманов: сундук №2",
    "originalName": "Пещера шаманов: сундук №2",
    "camp": "other",
    "region": "orc-territory",
    "sector": "Земли и город орков",
    "route": "Пещеры возле орочьих шаманов; второй из трёх по Lorthiz.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9032315",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9032315"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/shamans-living-quarters-cave-tent-camp-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L87"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=167315"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "167315"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "orc-shaman-cave-chest-3",
    "name": "Пещера шаманов: сундук №3",
    "originalName": "Пещера шаманов: сундук №3",
    "camp": "other",
    "region": "orc-territory",
    "sector": "Земли и город орков",
    "route": "Пещеры возле орочьих шаманов; третий из трёх по Lorthiz.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "github.com",
      "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L86",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L86"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=635277"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "635277"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "outlaws-loot-cave-left-cage-chest-3",
    "name": "Квентин: левый тайник, третий сундук",
    "originalName": "Квентин: левый тайник, третий сундук",
    "camp": "other",
    "region": "outlaws-camp",
    "sector": "Лагерь разбойников Квентина",
    "route": "Пещера лагеря разбойников; третья слева позиция в левой клетке.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021381",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021381"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave-left-cage-chest-3"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L4"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=443176"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "443176"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "xardas-tower-stair-alcove-chest",
    "name": "Сундук у нижней лестницы Ксардаса",
    "originalName": "Сундук у нижней лестницы Ксардаса",
    "camp": "other",
    "region": "xardas-tower",
    "sector": "Башня Ксардаса",
    "route": "Жилая башня Ксардаса, ниша у основания внутренней лестницы.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Целебный экстракт × 3",
      "Целебный эликсир × 2",
      "Экстракт магической энергии × 3",
      "Эликсир магической энергии × 2"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021381",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3742646934#9021381"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-under-stairs-xardas-tower/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/xardas-tower-stair-alcove-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L74"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=132316"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "132316"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-under-stairs-xardas-tower/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "abandoned-mine-underwater-chest",
    "name": "Подводный сундук Заброшенной шахты",
    "originalName": "Подводный сундук Заброшенной шахты",
    "camp": "other",
    "region": "underwater",
    "sector": "Подводные области",
    "route": "После матки кротокрысов, при следующем погружении свернуть в левый тоннель.",
    "type": "underwater",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "Дополнительная ссылка — комментарий пользователя; её навык не установлен."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Steam — руководство сообщества",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#comment_572667758937104201",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Steam — руководство сообщества",
        "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3744092839#comment_572667758937104201"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/abandoned-mine-underwater-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L22"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=547355"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%A1%D1%83%D0%BD%D0%B4%D1%83%D0%BA%20%D0%BF%D0%BE%D0%B4%20%D0%B2%D0%BE%D0%B4%D0%BE%D0%B9%20%D0%B2%20%D0%97%D0%B0%D0%B1%D1%80%D0%BE%D1%88%D0%B5%D0%BD%D0%BD%D0%BE%D0%B9%20%D1%88%D0%B0%D1%85%D1%82%D0%B5"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine",
      "underwater"
    ],
    "searchAliases": [
      "547355"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-guard-dining-room-far-cell-left-chest",
    "name": "Казармы: левый сундук дальней клетки",
    "originalName": "Казармы: левый сундук дальней клетки",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Столовая стражи внутреннего замка; дальняя клетка, левый сундук.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Бритва × 1",
      "Кружка × 1",
      "Кусок руды × 11",
      "Пиво × 3"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-left-far-cage-dining-old-camp/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-left-far-cage-dining-old-camp/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-camp-guard-dining-room-far-cell-left-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=717146"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "717146"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-left-far-cage-dining-old-camp/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "old-camp-guard-dining-room-entrance-door",
    "name": "Казармы: решётка у входа в столовую",
    "originalName": "Казармы: решётка у входа в столовую",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Первая решётка в столовой стражников внутреннего замка.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-door-entrance-dining-guard-room/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-door-entrance-dining-guard-room/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-camp-guard-dining-room-entrance-door"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=121177"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "121177"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-guard-barracks-stairs-left-chest",
    "name": "Казармы: сундук слева от лестницы",
    "originalName": "Казармы: сундук слева от лестницы",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Спальня стражников внутри замка; слева от лестницы.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Жареное мясо × 5",
      "Кружка × 1",
      "Кусок руды × 20",
      "Пиво × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-left-from-stairs-guards-sleeping-room/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-left-from-stairs-guards-sleeping-room/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-camp-guard-barracks-stairs-left-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=75276"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "75276"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-left-from-stairs-guards-sleeping-room/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "old-camp-guard-dining-room-far-cell-right-chest",
    "name": "Казармы: правый сундук дальней клетки",
    "originalName": "Казармы: правый сундук дальней клетки",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Столовая стражи внутреннего замка; дальняя клетка, правый сундук.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Жареное мясо × 3",
      "Кружка × 1",
      "Кусок руды × 16",
      "Пиво × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-right-far-cage-dining-room/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-right-far-cage-dining-room/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-camp-guard-dining-room-far-cell-right-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=77543"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "77543"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-right-far-cage-dining-room/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "old-camp-guard-dining-room-far-cell-door",
    "name": "Казармы: решётка дальней клетки",
    "originalName": "Казармы: решётка дальней клетки",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Вторая, дальняя клетка столовой стражников.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-far-door-diner-room/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-far-door-diner-room/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-camp-guard-dining-room-far-cell-door"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=616237"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "616237"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "free-mine-second-tier-right-room-chest",
    "name": "Свободная шахта: правое жилище второго яруса",
    "originalName": "Свободная шахта: правое жилище второго яруса",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": "Второй ярус поселения; сундук в комнате справа.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Сыр × 1",
      "Яблоко × 3"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-free-mine-outside-on-2nd-floor/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-free-mine-outside-on-2nd-floor/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/free-mine-second-settlement-center-hut-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=37741"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "37741"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-free-mine-outside-on-2nd-floor/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "free-mine-crawler-cave-approach-chest",
    "name": "Свободная шахта: настил над печью",
    "originalName": "Свободная шахта: настил над печью",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": "Высокие настилы над печью перед пещерой ползунов.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Целительные травы 1 × 2",
      "Отмычка × 5",
      "Кирка × 1",
      "Заклинание «Светоч» × 2"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-before-crawler-cave-free-mine/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-before-crawler-cave-free-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/free-mine-crawler-cave-approach-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L81"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=551111"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine",
      "cave"
    ],
    "searchAliases": [
      "551111"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-before-crawler-cave-free-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Наименование «Целительные травы 1» оставлено как в источнике; разновидность требует проверки в игре."
    }
  },
  {
    "id": "free-mine-entrance-bridge-chest",
    "name": "Свободная шахта: сундук за выступом у входа",
    "originalName": "Свободная шахта: сундук за выступом у входа",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": "От входа в шахту налево и вниз, затем мимо трёх ползунов подняться по стене.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Отмычка × 4",
      "Зелье быстрого исцеления × 1",
      "Чертёж Мясника × 1"
    ],
    "valuable": true,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-under-bridge-near-free-mine/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-under-bridge-near-free-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/free-mine-entrance-bridge-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L79"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=547211"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "547211"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-under-bridge-near-free-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "free-mine-main-hall-approach-chest",
    "name": "Свободная шахта: сундук под настилом",
    "originalName": "Свободная шахта: сундук под настилом",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": "Нижний уровень под переходом, перед главным залом.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Целебный экстракт × 1",
      "Эликсир магической энергии × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-before-main-hall-free-mine/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-before-main-hall-free-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/free-mine-main-hall-approach-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L80"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=272746"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "272746"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-before-main-hall-free-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "okyls-free-mine-chest",
    "name": "Сундук в жилище Окила",
    "originalName": "Сундук в жилище Окила",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": "Жилище Окила в Свободной шахте, за его спиной.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Окорок × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-behind-okil-free-mine/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-behind-okil-free-mine/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/okyls-free-mine-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=71766"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "71766"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-behind-okil-free-mine/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "xardas-tower-experimental-chamber-chest",
    "name": "Сундук за решёткой в башне Ксардаса",
    "originalName": "Сундук за решёткой в башне Ксардаса",
    "camp": "other",
    "region": "xardas-tower",
    "sector": "Башня Ксардаса",
    "route": "Второй этаж жилой башни Ксардаса, за запертой решёткой.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Масло × 1",
      "Лабораторный флакон × 4",
      "Ртуть × 2",
      "Кусок руды × 23",
      "Целебный эликсир × 2",
      "Эликсир магической энергии × 2"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-cage-2nd-floor-xardas-tower/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-cage-2nd-floor-xardas-tower/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/xardas-tower-experimental-chamber-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L75"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=156473"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "156473"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-cage-2nd-floor-xardas-tower/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "xardas-tower-upper-room-chest",
    "name": "Сундук у стола на втором этаже Ксардаса",
    "originalName": "Сундук у стола на втором этаже Ксардаса",
    "camp": "other",
    "region": "xardas-tower",
    "sector": "Башня Ксардаса",
    "route": "Второй этаж башни Ксардаса, в общей комнате рядом с решёткой.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Золото × 1",
      "Обсидиан × 1",
      "Окаменелая древесина × 1",
      "Пергамент × 4",
      "Рубин × 1",
      "Сера × 2",
      "Перо × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-2nd-floor-xardas-tower-right-from-table/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-2nd-floor-xardas-tower-right-from-table/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/xardas-tower-upper-room-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L76"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=175647"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "175647"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-2nd-floor-xardas-tower-right-from-table/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "xardas-tower-private-room-chest",
    "name": "Сундук спальни Ксардаса",
    "originalName": "Сундук спальни Ксардаса",
    "camp": "other",
    "region": "xardas-tower",
    "sector": "Башня Ксардаса",
    "route": "Личные покои Ксардаса в верхней части жилой башни.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кусок руды × 38",
      "Зелье превосходства × 1",
      "Свиток «Армия тьмы» × 1",
      "Свиток «Призыв демона» × 1",
      "Свиток «Призыв голема» × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-left-in-xardas-bedroom/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-left-in-xardas-bedroom/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/xardas-tower-chest-06"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L88"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=767351"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "767351"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-left-in-xardas-bedroom/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "orc-territory-border-cave-chest",
    "name": "Сундук пещеры у границы земель орков",
    "originalName": "Сундук пещеры у границы земель орков",
    "camp": "other",
    "region": "orc-territory",
    "sector": "Земли и город орков",
    "route": "Пещера рядом с озером, между Кавалорном, разрушенной башней и орочьим храмом.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Рубин × 1",
      "Древесина ивы × 3",
      "Факел × 2",
      "Стрела × 7",
      "Кусок руды × 9"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-before-orcs-lands/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-before-orcs-lands/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/orc-territory-border-cave-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=215512"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower",
      "cave"
    ],
    "searchAliases": [
      "215512"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-before-orcs-lands/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "orc-temple-lower-rotunda-left-chest",
    "name": "Орочий храм: левое помещение",
    "originalName": "Орочий храм: левое помещение",
    "camp": "other",
    "region": "orc-territory",
    "sector": "Земли и город орков",
    "route": "Гробница орочьего храма; комната слева от нижней ротонды и Чокча.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Железная древесина × 1",
      "Стрела × 20",
      "Коготь кусача × 1",
      "Круш Уррок × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-left-chokcha-orc/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-left-chokcha-orc/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/orc-temple-lower-rotunda-left-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L83"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=247755"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "247755"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-left-chokcha-orc/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "orc-temple-lower-rotunda-right-chest",
    "name": "Орочий храм: правое помещение",
    "originalName": "Орочий храм: правое помещение",
    "camp": "other",
    "region": "orc-territory",
    "sector": "Земли и город орков",
    "route": "Гробница орочьего храма; комната справа от нижней ротонды и Чокча.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Сталь × 1",
      "Болт × 14",
      "Железа огненного яда × 1",
      "Круш Агаш × 1"
    ],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-right-chockcha-orcs/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-right-chockcha-orcs/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/orc-temple-lower-rotunda-right-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L82"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=45577"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "45577"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-right-chockcha-orcs/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "orc-temple-upper-rotunda-chest",
    "name": "Орочий храм: сундук перед святилищем",
    "originalName": "Орочий храм: сундук перед святилищем",
    "camp": "other",
    "region": "orc-territory",
    "sector": "Земли и город орков",
    "route": "Верхняя ротонда орочьего храма, перед святилищем.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Амулет мощи × 1",
      "Кусок руды × 13",
      "Экстракт магической энергии × 2",
      "Стрела × 5",
      "Болт × 7"
    ],
    "valuable": true,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-front-of-sanctuary-orcs/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-front-of-sanctuary-orcs/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/orc-temple-upper-rotunda-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L84"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=474717"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "474717"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-front-of-sanctuary-orcs/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "xardas-sunken-tower-library-gate",
    "name": "Решётка библиотеки затопленной башни",
    "originalName": "Решётка библиотеки затопленной башни",
    "camp": "other",
    "region": "underwater",
    "sector": "Подводные области",
    "route": "Старая затопленная башня Ксардаса; решётка в библиотеке.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-door-xardas-basement/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-door-xardas-basement/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/xardas-tower-underground-library-gate"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L62"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=11772"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower",
      "underwater"
    ],
    "searchAliases": [
      "11772"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "outlaws-loot-cave-right-cage-chest-2",
    "name": "Квентин: правый тайник, сундук №2",
    "originalName": "Квентин: правый тайник, сундук №2",
    "camp": "other",
    "region": "outlaws-camp",
    "sector": "Лагерь разбойников Квентина",
    "route": "Пещера лагеря разбойников; второй сундук в правой клетке.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave-right-cage-chest-2",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave-right-cage-chest-2"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L2"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=6131112"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "6131112"
    ],
    "plateCount": 7,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "outlaws-loot-cave-left-cage-chest-4",
    "name": "Квентин: левый тайник, крайний правый сундук",
    "originalName": "Квентин: левый тайник, крайний правый сундук",
    "camp": "other",
    "region": "outlaws-camp",
    "sector": "Лагерь разбойников Квентина",
    "route": "Пещера лагеря разбойников; крайний правый из четырёх в левой клетке.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave-left-cage-chest-4",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave-left-cage-chest-4"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L3"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=476141"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "476141"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "outlaws-loot-cave-left-cage-chest-2",
    "name": "Квентин: левый тайник, второй сундук",
    "originalName": "Квентин: левый тайник, второй сундук",
    "camp": "other",
    "region": "outlaws-camp",
    "sector": "Лагерь разбойников Квентина",
    "route": "Пещера лагеря разбойников; второй слева в левой клетке.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave-left-cage-chest-2",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave-left-cage-chest-2"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L5"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=335712"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "335712"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "outlaws-loot-cave-left-cage-chest-1",
    "name": "Квентин: левый тайник, крайний левый сундук",
    "originalName": "Квентин: левый тайник, крайний левый сундук",
    "camp": "other",
    "region": "outlaws-camp",
    "sector": "Лагерь разбойников Квентина",
    "route": "Пещера лагеря разбойников; крайний левый в левой клетке.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave-left-cage-chest-1",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave-left-cage-chest-1"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L6"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=54255"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "54255"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-cellar-prison-grate",
    "name": "Решётка погреба под покоями Гомеза",
    "originalName": "Решётка погреба под покоями Гомеза",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Внутренняя решётка после винного погреба, на пути в темницу.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "github.com",
      "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L10",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L10"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=71225"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "dungeon"
    ],
    "searchAliases": [
      "71225"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "free-mine-gatehouse-chest",
    "name": "Сундук сторожки Свободной шахты",
    "originalName": "Сундук сторожки Свободной шахты",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": "Сторожка возле ворот шахты, у колеса подъёмного механизма.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/free-mine-gatehouse-chest",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/free-mine-gatehouse-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L78"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=17471"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "17471"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "to-churnaggs-throne-room-chest",
    "name": "Сундук То-Чурнагга",
    "originalName": "Сундук То-Чурнагга",
    "camp": "other",
    "region": "orc-territory",
    "sector": "Земли и город орков",
    "route": "Справа от вождя То-Чурнагга в тронном помещении орочьего поселения.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/to-churnaggs-throne-room-chest",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/to-churnaggs-throne-room-chest"
      },
      {
        "name": "github.com",
        "url": "https://github.com/drvladis/GothicRemakeLockOpener/blob/d086b57e7b2a024f3f7344c6dad28248194360fa/LocksCombinationsGothic1Remake.txt#L85"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=147675"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "147675"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "xardas-tower-experimental-chamber-door",
    "name": "Решётка второго этажа башни Ксардаса",
    "originalName": "Решётка второго этажа башни Ксардаса",
    "camp": "other",
    "region": "xardas-tower",
    "sector": "Башня Ксардаса",
    "route": "Вход за решётку экспериментального помещения на втором этаже жилой башни Ксардаса.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [
      "SpecialGamesClub публикует только уровень «Без навыка»; раздел «Обученный» пока пуст.",
      "В руководстве двери повторена последовательность соседнего сундука; опубликованное решение требует проверки.",
      "SGC повторяет для двери команды соседнего сундука; эта ссылка сохранена только для местоположения."
    ],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-door-of-cage-xardas-tower-2nd-floor/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-door-of-cage-xardas-tower-2nd-floor/"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/xardas-tower-experimental-chamber-door"
      }
    ],
    "verification": "unknown",
    "notes": "Сведения о месте опубликованы в руководстве; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [],
    "plateCount": null,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "abandoned-gallery-entrance",
    "name": "Дверь Заброшенной штольни",
    "originalName": "Дверь Заброшенной штольни",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": "Переход из Свободной шахты в Заброшенную штольню.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/abandoned-gallery-entrance",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/abandoned-gallery-entrance"
      }
    ],
    "verification": "unknown",
    "notes": "Источник указывает открытие ключом. Возможность взлома не подтверждена.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "key",
    "tags": [
      "mine"
    ],
    "searchAliases": [],
    "plateCount": null,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "abandoned-mine-fence",
    "name": "Ограда у Заброшенной шахты",
    "originalName": "Ограда у Заброшенной шахты",
    "camp": "other",
    "region": "abandoned-mine",
    "sector": "Заброшенная шахта",
    "route": "Закрытые ворота на подходе к Заброшенной шахте.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/abandoned-mine-fence",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/abandoned-mine-fence"
      }
    ],
    "verification": "unknown",
    "notes": "Источник указывает открытие ключом. Возможность взлома не подтверждена.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "key",
    "tags": [
      "mine"
    ],
    "searchAliases": [],
    "plateCount": null,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "abandoned-mine-storage",
    "name": "Дверь склада Заброшенной шахты",
    "originalName": "Дверь склада Заброшенной шахты",
    "camp": "other",
    "region": "abandoned-mine",
    "sector": "Заброшенная шахта",
    "route": "Склад среди строений Заброшенной шахты.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/abandoned-mine-storage",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/abandoned-mine-storage"
      }
    ],
    "verification": "unknown",
    "notes": "Источник указывает открытие ключом. Возможность взлома не подтверждена.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "key",
    "tags": [
      "mine"
    ],
    "searchAliases": [],
    "plateCount": null,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "castle-armory-door",
    "name": "Дверь арсенала замка",
    "originalName": "Дверь арсенала замка",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Арсенал в замке Старого лагеря.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/castle-armory",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/castle-armory"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=17737"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "17737"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "castle-armory-chest-1",
    "name": "Арсенал замка: сундук №1",
    "originalName": "Арсенал замка: сундук №1",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Первый из четырёх сундуков арсенала по нумерации руководства.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/castle-armory-chest",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/castle-armory-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=77274"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "77274"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "castle-armory-chest-2",
    "name": "Арсенал замка: сундук №2",
    "originalName": "Арсенал замка: сундук №2",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Второй из четырёх сундуков арсенала по нумерации руководства.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/castle-armory-chest-2",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/castle-armory-chest-2"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=13713"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "13713"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "castle-armory-chest-3",
    "name": "Арсенал замка: сундук №3",
    "originalName": "Арсенал замка: сундук №3",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Третий из четырёх сундуков арсенала по нумерации руководства.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/castle-armory-chest-3",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/castle-armory-chest-3"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=762277"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "762277"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "castle-armory-chest-4",
    "name": "Арсенал замка: сундук №4",
    "originalName": "Арсенал замка: сундук №4",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Четвёртый из четырёх сундуков арсенала по нумерации руководства.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/castle-armory-chest-4",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/castle-armory-chest-4"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=57511"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "57511"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "exchange-zone-loot-cage",
    "name": "Клетка с припасами в зоне обмена",
    "originalName": "Клетка с припасами в зоне обмена",
    "camp": "other",
    "region": "exchange-zone",
    "sector": "Зона обмена",
    "route": "Зона обмена у места высадки под Барьером; закрытая клетка или сарай.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/exchange-zone-loot-cage",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/exchange-zone-loot-cage"
      }
    ],
    "verification": "unknown",
    "notes": "Источник указывает открытие ключом. Возможность взлома не подтверждена.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "key",
    "tags": [],
    "searchAliases": [],
    "plateCount": null,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "fire-mages-chambers-door-1",
    "name": "Покои магов Огня: первая дверь",
    "originalName": "Покои магов Огня: первая дверь",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Первая закрытая дверь часовни и жилых покоев магов Огня.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/fire-mages-chambers",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/fire-mages-chambers"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=233261"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "233261"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "fire-mages-chambers-door-2",
    "name": "Покои магов Огня: вторая дверь",
    "originalName": "Покои магов Огня: вторая дверь",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Вторая закрытая дверь часовни и жилых покоев магов Огня.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/fire-mages-chambers-door-2",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/fire-mages-chambers-door-2"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=257726"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "257726"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "free-mine-left-storehouse-chest-2",
    "name": "Свободная шахта: левый склад, сундук №2",
    "originalName": "Свободная шахта: левый склад, сундук №2",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": "Левое строение за Окилом; второй из двух сундуков.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/free-mine-left-storehouse-chest-2",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/free-mine-left-storehouse-chest-2"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=2177"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "mine"
    ],
    "searchAliases": [
      "2177"
    ],
    "plateCount": 4,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "free-mine-winch-gate",
    "name": "Ворота подъёмника Свободной шахты",
    "originalName": "Ворота подъёмника Свободной шахты",
    "camp": "other",
    "region": "free-mine",
    "sector": "Свободная шахта",
    "route": "Ворота у лебёдки внутри Свободной шахты.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/free-mine-winch-gate",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/free-mine-winch-gate"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "unknown",
    "tags": [
      "mine"
    ],
    "searchAliases": [],
    "plateCount": null,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "gomez-ancient-ore-armor-chest",
    "name": "Сундук с древней рудной бронёй",
    "originalName": "Сундук с древней рудной бронёй",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Спальня Гомеза; отдельный сундук справа от кровати.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Древние рудные доспехи"
    ],
    "valuable": true,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/gomezs-ancient-ore-armor-chest",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/gomezs-ancient-ore-armor-chest"
      },
      {
        "name": "landofgames.ru",
        "url": "https://landofgames.ru/articles/guides/30057-drevnjaja-rudnaja-bronja-gomeza-v-gothic-1-remake-kak-poluchit-i-uluchshit-dospeh.html"
      }
    ],
    "verification": "unknown",
    "notes": "Источник указывает открытие ключом. Возможность взлома не подтверждена.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "key",
    "tags": [],
    "searchAliases": [],
    "plateCount": null,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Gothic Lock Picking",
          "url": "https://gothic-lock-picking.com/en/locks/gomezs-ancient-ore-armor-chest"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Источник указывает доспехи; полный состав сундука не установлен. Нужен ключ Гомеза."
    }
  },
  {
    "id": "new-camp-baal-kagan-fireplace-hut-chest",
    "name": "Хижина у костра Баала Кагана",
    "originalName": "Хижина у костра Баала Кагана",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Хижина непосредственно возле костра Баала Кагана, ниже настилов.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/new-camp-baal-kagan-fireplace-hut-chest",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-baal-kagan-fireplace-hut-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=674637"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "674637"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "new-camp-buster-fireplace-hut-chest",
    "name": "Хижина у костра Бастера",
    "originalName": "Хижина у костра Бастера",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Соседняя хижина возле костра Бастера.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/new-camp-buster-fireplace-hut-chest",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-buster-fireplace-hut-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=713456"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "713456"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "lefty-right-rice-field-chest",
    "name": "Лефти: правый сундук спальни",
    "originalName": "Лефти: правый сундук спальни",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Спальни у рисовых полей; правый сундук комнаты Лефти.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/leftys-rice-field-room-chest-2",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/leftys-rice-field-room-chest-2"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=27571"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "27571"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "new-camp-mercenary-hut-below-cord-chest",
    "name": "Хижина наёмника под жилищем Корда",
    "originalName": "Хижина наёмника под жилищем Корда",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Хижина ярусом ниже жилища Корда.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/new-camp-mercenary-hut-below-cord-chest",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-mercenary-hut-below-cord-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=72125"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "72125"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "mountain-fortress-royal-guard-armor-chest",
    "name": "Сундук с доспехами королевского стражника",
    "originalName": "Сундук с доспехами королевского стражника",
    "camp": "other",
    "region": "mountain-fortress",
    "sector": "Горная крепость",
    "route": "Третий этаж башни Горного форта; открывается ключом.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Доспехи королевского стражника × 1",
      "Пергамент × 3",
      "Кусок руды × 12"
    ],
    "valuable": true,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/mountain-fortress-tower-third-floor-chest",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/mountain-fortress-tower-third-floor-chest"
      },
      {
        "name": "landofgames.ru",
        "url": "https://landofgames.ru/articles/guides/30050-dospehi-korolevskogo-strazhnika-v-gothic-1-remake-gde-najti-bronju-i-kak-vzlomat-zamok.html"
      }
    ],
    "verification": "unknown",
    "notes": "Источник указывает открытие ключом. Возможность взлома не подтверждена.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "key",
    "tags": [
      "castle",
      "tower"
    ],
    "searchAliases": [],
    "plateCount": null,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "Land of Games",
          "url": "https://landofgames.ru/articles/guides/30066-vse-sunduki-v-gornom-forte-v-gothic-1-remake-gde-najti-kak-otkryt-i-chto-lezhit-vnutri.html",
          "author": "Droommar",
          "license": "Пользовательское соглашение §7.7–7.8: личное некоммерческое использование с прямой индексируемой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Ключевой сундук спальни барона. Ключ лежит в другом сундуке на вершине башни."
    }
  },
  {
    "id": "new-camp-gorns-hut-chest",
    "name": "Сундук в хижине рядом с Горном",
    "originalName": "Сундук в хижине рядом с Горном",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Хижина, возле которой стоит Горн; источник различает её и личный сундук Горна.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/new-camp-gorns-hut-chest",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-gorns-hut-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=76575"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "76575"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "new-camp-lake-sunken-chest-1",
    "name": "Озеро у таверны: подводный сундук №1",
    "originalName": "Озеро у таверны: подводный сундук №1",
    "camp": "other",
    "region": "underwater",
    "sector": "Подводные области",
    "route": "На дне озера возле таверны, снаружи её затопленного подвала; первый по источнику.",
    "type": "underwater",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/new-camp-lake-sunken-chest-1",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-lake-sunken-chest-1"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=53273"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "dungeon",
      "underwater"
    ],
    "searchAliases": [
      "53273"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "new-camp-lake-sunken-chest-2",
    "name": "Озеро у таверны: подводный сундук №2",
    "originalName": "Озеро у таверны: подводный сундук №2",
    "camp": "other",
    "region": "underwater",
    "sector": "Подводные области",
    "route": "На дне озера возле таверны, снаружи её затопленного подвала; второй по источнику.",
    "type": "underwater",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/new-camp-lake-sunken-chest-2",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-lake-sunken-chest-2"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=64372"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "dungeon",
      "underwater"
    ],
    "searchAliases": [
      "64372"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "new-camp-tavern-upstairs-door",
    "name": "Дверь верхней спальни таверны",
    "originalName": "Дверь верхней спальни таверны",
    "camp": "new",
    "region": "new-camp",
    "sector": "Новый лагерь",
    "route": "Второй этаж таверны Силаса; дверь в комнату с двумя сундуками.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/new-camp-tavern-second-floor-locked-door",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/new-camp-tavern-second-floor-locked-door"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=73111"
      },
      {
        "name": "Land of Games",
        "url": "https://landofgames.ru/articles/guides/29940-vse-sunduki-i-dveri-v-gothic-1-remake-kak-otkryt-kombinacii.html#:~:text=%D0%97%D0%B0%D0%BA%D1%80%D1%8B%D1%82%D0%B0%D1%8F%20%D0%B4%D0%B2%D0%B5%D1%80%D1%8C%20%D0%BD%D0%B0%20%D0%B2%D1%82%D0%BE%D1%80%D0%BE%D0%BC%20%D1%8D%D1%82%D0%B0%D0%B6%D0%B5%20%D1%82%D0%B0%D0%B2%D0%B5%D1%80%D0%BD%D1%8B"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "73111"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-dungeon-inner-cell-door-1",
    "name": "Темница: первая внутренняя камера",
    "originalName": "Темница: первая внутренняя камера",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Первая маленькая камера с сундуком после входа в темницу Старого лагеря.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/old-camp-dungeon-inner-barred-door-1",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-camp-dungeon-inner-barred-door-1"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "dungeon"
    ],
    "searchAliases": [
      "1312"
    ],
    "plateCount": 4,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-dungeon-inner-cell-door-2",
    "name": "Темница: вторая внутренняя камера",
    "originalName": "Темница: вторая внутренняя камера",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Вторая камера с сундуком, дальше по коридору темницы.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/old-camp-dungeon-inner-barred-door-2",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-camp-dungeon-inner-barred-door-2"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=45377"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "dungeon"
    ],
    "searchAliases": [
      "45377"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-ruined-tower-underground-door",
    "name": "Подземная дверь разрушенной башни замка",
    "originalName": "Подземная дверь разрушенной башни замка",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Разрушенная башня внутри замка; подземный ход к подвалу хижины за стенами.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/old-camp-ruined-tower-underground-door",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-camp-ruined-tower-underground-door"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "unknown",
    "tags": [
      "castle",
      "tower",
      "dungeon"
    ],
    "searchAliases": [],
    "plateCount": null,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "orc-graveyard-gate",
    "name": "Ворота Кладбища орков",
    "originalName": "Ворота Кладбища орков",
    "camp": "other",
    "region": "orc-cemetery",
    "sector": "Кладбище орков",
    "route": "Закрытый проход внутри Кладбища орков.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/orc-graveyard-gate",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/orc-graveyard-gate"
      }
    ],
    "verification": "unknown",
    "notes": "Источник указывает открытие ключом. Возможность взлома не подтверждена.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "key",
    "tags": [],
    "searchAliases": [],
    "plateCount": null,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "orc-town-parkour-tower-chest",
    "name": "Сундук башни с подъёмом по уступам",
    "originalName": "Сундук башни с подъёмом по уступам",
    "camp": "other",
    "region": "orc-territory",
    "sector": "Земли и город орков",
    "route": "Вершина разрушенной башни южнее входа в город орков; требуется подъём по уступам.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Рог × 1",
      "Экстракт ловкости × 1",
      "Рецепт заклинания «Превращение в кусача» × 1"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/orc-town-parkour-tower-chest",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/orc-town-parkour-tower-chest"
      },
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-orc-tower-near-xardas/"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=13642"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "tower"
    ],
    "searchAliases": [
      "13642"
    ],
    "plateCount": 5,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-on-orc-tower-near-xardas/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  },
  {
    "id": "outlaws-loot-cave-left-grate",
    "name": "Квентин: левая решётка сокровищницы",
    "originalName": "Квентин: левая решётка сокровищницы",
    "camp": "other",
    "region": "outlaws-camp",
    "sector": "Лагерь разбойников Квентина",
    "route": "Пещера лагеря разбойников; вход в левую клетку с сундуками.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave-left-grate",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave-left-grate"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=147353"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "147353"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "outlaws-loot-cave-right-cage-chest-3",
    "name": "Квентин: правый тайник, сундук №3",
    "originalName": "Квентин: правый тайник, сундук №3",
    "camp": "other",
    "region": "outlaws-camp",
    "sector": "Лагерь разбойников Квентина",
    "route": "Третий сундук в правой клетке пещеры лагеря разбойников.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave-right-cage-chest-3",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave-right-cage-chest-3"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=237161"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "237161"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "outlaws-loot-cave-right-grate",
    "name": "Квентин: правая решётка сокровищницы",
    "originalName": "Квентин: правая решётка сокровищницы",
    "camp": "other",
    "region": "outlaws-camp",
    "sector": "Лагерь разбойников Квентина",
    "route": "Пещера лагеря разбойников; вход в правую клетку с сундуками.",
    "type": "door",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=577446"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [
      "577446"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "quentins-chest",
    "name": "Сундук Квентина",
    "originalName": "Сундук Квентина",
    "camp": "other",
    "region": "outlaws-camp",
    "sector": "Лагерь разбойников Квентина",
    "route": "Основная часть лагеря разбойников, рядом с хижиной Квентина.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Ключ от пещеры с добычей разбойников"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/quentins-chest",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/quentins-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=353131"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [],
    "searchAliases": [
      "353131"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "partial",
      "sources": [
        {
          "name": "Gothic Lock Picking",
          "url": "https://gothic-lock-picking.com/en/locks/outlaws-loot-cave"
        },
        {
          "name": "Gothic Lock Picking — сундук Квентина",
          "url": "https://gothic-lock-picking.com/en/locks/quentins-chest"
        }
      ],
      "reviewedAt": "2026-10-16",
      "note": "Подтверждён только ключ. Добыча за решёткой не приписана сундуку Квентина."
    }
  },
  {
    "id": "old-camp-training-grounds-lower-chest",
    "name": "Тренировочный двор: нижний сундук",
    "originalName": "Тренировочный двор: нижний сундук",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Первый этаж развалин у тренировочной площадки стражи внутри замка.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/warder-training-ground-lower-left-chest",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/warder-training-ground-lower-left-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=121517"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "121517"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "old-camp-training-grounds-upper-chest",
    "name": "Тренировочный двор: верхний сундук",
    "originalName": "Тренировочный двор: верхний сундук",
    "camp": "old",
    "region": "old-camp",
    "sector": "Старый лагерь",
    "route": "Второй этаж развалин у тренировочной площадки стражи внутри замка.",
    "type": "chest",
    "floor": null,
    "contents": [],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "Gothic Lock Picking",
      "url": "https://gothic-lock-picking.com/en/locks/warder-training-ground-upper-right-chest",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/warder-training-ground-upper-right-chest"
      },
      {
        "name": "Gothic Lock Picking",
        "url": "https://gothic-lock-picking.com/en/locks/old-camp-training-grounds-second-floor-chest"
      },
      {
        "name": "Lorthiz",
        "url": "https://lorthiz.github.io/gothic-remake-solved-locks/search.html?s=227753"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "landmark",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "castle"
    ],
    "searchAliases": [
      "227753"
    ],
    "plateCount": 6,
    "solutionStatus": "unconfirmed"
  },
  {
    "id": "molerat-matriarch-cave-chest",
    "name": "Сундук пещеры матки кротокрысов",
    "originalName": "Сундук пещеры матки кротокрысов",
    "camp": "other",
    "region": "caves",
    "sector": "Пещеры",
    "route": "Пещера с маткой кротокрысов; сверяйте карту и вход в руководстве.",
    "type": "chest",
    "floor": null,
    "contents": [
      "Кусок руды × 22",
      "Эссенция ловкости × 1"
    ],
    "valuable": false,
    "warnings": [],
    "config": null,
    "gameVersion": null,
    "chapter": null,
    "source": {
      "name": "SpecialGamesClub",
      "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-cave-of-molerat/",
      "license": "Собственное краткое описание фактов и ссылка на руководство; текст, изображения и массив комбинаций источника не перенесены."
    },
    "locationSources": [
      {
        "name": "SpecialGamesClub",
        "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-cave-of-molerat/"
      }
    ],
    "verification": "unknown",
    "notes": "Местоположение приведено по указанным источникам; в игре нами не проверено.",
    "locationPrecision": "area",
    "identity": "known",
    "access": "lockpick",
    "tags": [
      "cave"
    ],
    "searchAliases": [],
    "plateCount": null,
    "solutionStatus": "unconfirmed",
    "loot": {
      "coverage": "listed",
      "sources": [
        {
          "name": "SpecialGamesClub",
          "url": "https://specialgamesclub.ru/article/guide/gothic-1-remake-chest-in-cave-of-molerat/",
          "author": "Евгений Баранов",
          "license": "Факты из руководства; частичное использование с прямой ссылкой"
        }
      ],
      "reviewedAt": "2026-10-16"
    }
  }
];


export const CATALOG_ALIASES:Record<string,string>={"cavalorn-cave-unknown":"cavalorn-storeroom-door","new-camp-peasant-upstairs-grate":"new-camp-peasant-housing-door"};

export function completeness(entry:LockEntry):'confirmed'|'location'|'incomplete' {
 if(entry.solutionStatus==='confirmed' && entry.profiles && Object.values(entry.profiles).some(Boolean)) return 'confirmed';
 return !entry.config && entry.identity==='known' && entry.locationPrecision!=='unknown' ? 'location' : 'incomplete';
}
export const CATALOG_COUNTS={total:LOCK_CATALOG.length,confirmed:LOCK_CATALOG.filter(e=>completeness(e)==='confirmed').length,location:LOCK_CATALOG.filter(e=>completeness(e)==='location').length,incomplete:LOCK_CATALOG.filter(e=>completeness(e)==='incomplete').length,observations:LOCK_CATALOG.filter(e=>e.config).length};
// Search each meaningful word independently; accept ordinary Russian case endings.
const SEARCH_STOP_WORDS = new Set(['в','во','на','у','возле','около','рядом','с','со','от','за','к','ко','и','по','из','для','под','над']);
function searchWords(value:string):string[] {
 return value.toLocaleLowerCase('ru').replace(/ё/g,'е').match(/[\p{L}\p{N}]+/gu) || [];
}
function searchStem(word:string):string {
 if (!/^[а-я]+$/.test(word) || word.length < 5) return word;
 return word.replace(/(?:иями|ями|ами|ого|ему|ому|ыми|ими|ая|яя|ое|ее|ые|ие|ый|ий|ой|ей|ую|юю|ов|ев|ам|ям|ах|ях|ом|ем|а|я|ы|и|у|ю|е|о|ь)$/u,'');
}
export function filterCatalog(options:{query?:string;area?:string;camp?:string|null;region?:string;type?:string;status?:string;valuable?:boolean;opened?:string[];hideOpened?:boolean}):LockEntry[] {
 const rawTerms=searchWords(options.query||'');
 const fingerprint=rawTerms.length>=4&&rawTerms.length<=7&&rawTerms.every(word=>/^[1-7]$/.test(word));
 const terms=fingerprint?[rawTerms.join('')]:rawTerms.filter(word=>!SEARCH_STOP_WORDS.has(word)).map(searchStem);
 return LOCK_CATALOG.filter(e=>{
  if ((options.camp&&e.camp!==options.camp)||(options.region&&e.region!==options.region)||(options.type&&e.type!==options.type)||(options.area&&!e.tags?.includes(options.area))||(options.status&&completeness(e)!==options.status)||(options.valuable&&!e.valuable)||(options.hideOpened&&options.opened?.includes(e.id))) return false;
  if (!terms.length) return true;
  const words=searchWords([e.name,e.originalName,e.sector,e.route||'',REGIONS.find(r=>r.id===e.region)?.name||'',...e.contents,...(e.searchAliases||[]),...(e.tags||[])].join(' ')).map(searchStem);
  return terms.every(term=>words.some(word=>word.startsWith(term)));
 });
}
