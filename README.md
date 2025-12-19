# Lab / Playground

Лаборатория инженерных инструментов, моделей и экспериментов.

## Запуск

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка для продакшена
npm run build
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Структура проекта

```
src/
├── app/                    # Страницы (Next.js App Router)
│   ├── page.tsx           # Главная
│   ├── tools/page.tsx     # Инструменты
│   ├── models/page.tsx    # Модели
│   ├── digits/page.tsx    # Игра Digits
│   ├── projects/page.tsx  # Проекты
│   ├── about/page.tsx     # О сайте
│   └── not-found.tsx      # 404 страница
├── components/            # Переиспользуемые компоненты
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── PageHeader.tsx
│   └── EmptyState.tsx
└── data/                  # Данные и конфигурация
    ├── projects.ts        # Список проектов
    └── sections.ts        # Разделы главной страницы
```

## Как добавить новый проект

Отредактируйте файл `src/data/projects.ts`:

```typescript
export const projects: Project[] = [
  // ... существующие проекты
  {
    id: "my-new-project",
    title: "Название проекта",
    description: "Описание проекта",
    tags: ["тег1", "тег2"],
    status: "coming-soon", // или "prototype", "ready"
  },
];
```

## Как добавить новый раздел на главную

1. Создайте папку и файл страницы: `src/app/my-section/page.tsx`
2. Добавьте раздел в `src/data/sections.ts`:

```typescript
import { MyIcon } from "lucide-react";

export const sections: Section[] = [
  // ... существующие разделы
  {
    id: "my-section",
    title: "Мой раздел",
    description: "Описание раздела",
    href: "/my-section",
    icon: MyIcon,
    status: "coming-soon",
  },
];
```

3. Добавьте пункт меню в `src/components/Navigation.tsx`:

```typescript
const navItems = [
  // ... существующие пункты
  { href: "/my-section", label: "Мой раздел" },
];
```

## Технологии

- [Next.js 14](https://nextjs.org/) — фреймворк
- [TypeScript](https://www.typescriptlang.org/) — типизация
- [Tailwind CSS](https://tailwindcss.com/) — стили
- [Lucide React](https://lucide.dev/) — иконки
