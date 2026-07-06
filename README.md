##1234 📦 Структура

```
/
├── index.html          # Главная — каталог плагинов
├── plugin.html         # Страница плагина
├── about.html          # О проекте
├── 404.html            # Страница ошибки
├── manifest.json       # PWA манифест
├── sw.js               # Service Worker
├── css/
│   ├── material.css    # Material 3 design tokens
│   ├── style.css       # Основные стили
│   └── responsive.css  # Адаптивность
├── js/
│   ├── app.js          # Главная страница
│   ├── plugin.js       # Страница плагина
│   ├── search.js       # Поиск и фильтрация
│   ├── gallery.js      # Lightbox галерея
│   ├── router.js       # URL утилиты
│   ├── theme.js        # Навигация и тема
│   └── utils.js        # Утилиты
├── data/
│   └── plugins.json    # Данные плагинов
└── assets/
    ├── logo.svg
    ├── icons/
    └── plugins/
        └── {plugin-id}/
            ├── icon.png
            ├── plugin.apk
            ├── plugin.jar
            └── screenshots/
```

## ➕ Добавление плагина

1. Создать папку `assets/plugins/plugin-id/`
2. Положить `icon.png`, `plugin.apk`, `plugin.jar`, `screenshots/1.png` ...
3. Добавить запись в `data/plugins.json`
4. Запушить — плагин появится автоматически

## 🛠️ Технологии

- HTML5 + CSS3 + Vanilla JS ES2023
- Material Design 3
- PWA (Service Worker, Web App Manifest)
- GitHub Pages

## 📄 Лицензия

MIT
