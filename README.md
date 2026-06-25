# Трасса — мобильное приложение

Веб-версия на React (Vite), упаковывается в Android/iOS через Capacitor.

## 1. Установка

```bash
npm install
```

## 2. Разработка в браузере

```bash
npm run dev
```
Откроется на `http://localhost:5173` — для проверки логики и вёрстки, без эмулятора.

## 3. Первая упаковка в нативные проекты

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Трасса" "kz.trassa.app" --web-dir=dist
# конфиг уже создан в capacitor.config.json — если cap init спросит, можно подтвердить перезапись

npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios        # только на macOS с установленным Xcode
```

Команды создадут папки `android/` и `ios/` — это полноценные нативные проекты
(Android Studio / Xcode), их стоит закоммитить в git, если будете кастомизировать
нативную часть (иконки, разрешения, push).

## 4. Каждый раз после изменений в src/

```bash
npm run cap:android   # build + sync + открыть Android Studio
npm run cap:ios        # build + sync + открыть Xcode
```

Или по отдельности:
```bash
npm run build       # обычная сборка Vite → папка dist/
npx cap sync         # копирует dist/ в android/ и ios/, обновляет плагины
```

## 5. Сборка для публикации

**Android** — в Android Studio: `Build → Generate Signed Bundle / APK` → выбрать
`Android App Bundle (.aab)` → это и загружается в Google Play Console.

**iOS** — в Xcode: `Product → Archive` → после архивации откроется Organizer,
оттуда `Distribute App → App Store Connect`.

## 6. Полезные плагины (ставить по мере необходимости)

```bash
npm install @capacitor/push-notifications   # уведомления о новых ставках/откликах
npm install @capacitor/app                  # обработка кнопки "назад" на Android
npm install @capacitor/status-bar           # цвет статус-бара под тёмную тему
```
После установки каждого плагина — снова `npx cap sync`.

## Структура проекта

```
trassa-mobile/
├── index.html
├── vite.config.js
├── capacitor.config.json
├── package.json
└── src/
    ├── main.jsx     # точка входа React
    ├── index.css    # глобальные стили под мобильный full-screen
    └── App.jsx       # вся логика и UI приложения
```

## Что ещё нужно перед реальным релизом

Сейчас все данные (грузы, ставки) живут в `useState` и пропадают при перезапуске —
это нормально для демо, но для продакшена нужен бэкенд + БД, авторизация по SMS
и push-уведомления. Подробный чек-лист обсуждали в чате.
