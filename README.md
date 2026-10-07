# Прогресс пловца — Арина Ракова

Одностраничное приложение со статистикой выступлений спортсменки. Интерфейс собран по макету Figma на React 19, TypeScript, TanStack React Query и Ant Design.

## Запуск

```bash
npm install
npm run dev
```

Production-сборка:

```bash
npm run build
npm run preview
```

## Данные

Приложение при старте загружает `static/swimming-results.json` через TanStack React Query. JSON сформирован из исходного XLSX-файла и содержит 78 результатов, даты, соревнования, города, длину бассейна, дисциплины, дистанции, время, расчётный разряд и ссылку на открытый источник.

Чтобы повторно сформировать JSON из XLSX, поместите исходный файл в соседнюю папку `outputs` и запустите:

```bash
npm run data:export
```

## Публикация

В репозитории есть `netlify.toml`: Netlify запускает `npm run build` и публикует каталог `dist`.
