# Деплой на Vercel

## Проблема

Ваш проект состоит из двух частей:
1. **React Native мобильное приложение** (Expo) - не может быть задеплоено на Vercel
2. **Node.js/Express сервер** - может быть задеплоен на Vercel

Vercel предназначен для веб-приложений и серверов, но не для мобильных приложений React Native.

## Решение

### 1. Деплой Backend сервера на Vercel

#### Шаг 1: Установите Vercel CLI

```bash
npm install -g vercel
```

#### Шаг 2: Войдите в Vercel

```bash
vercel login
```

#### Шаг 3: Настройте переменные окружения

Перейдите в настройки проекта на Vercel и добавьте следующие переменные:

- `JWT_SECRET` - ваш секретный ключ для JWT
- `VK_CLIENT_ID` - ID вашего VK приложения
- `VK_CLIENT_SECRET` - секретный ключ VK приложения
- `VK_REDIRECT_URI` - URL для OAuth callback (например: `https://your-app.vercel.app/auth/callback`)

#### Шаг 4: Задеплойте проект

```bash
vercel
```

Или сразу в production:

```bash
vercel --prod
```

### 2. Деплой мобильного приложения

Для React Native приложения используйте **другие платформы**:

#### Вариант А: Expo Application Services (EAS)

```bash
# Установите EAS CLI
npm install -g eas-cli

# Войдите в Expo
eas login

# Создайте билд для Android
eas build --platform android

# Создайте билд для iOS
eas build --platform ios

# Или опубликуйте через OTA
eas update
```

#### Вариант Б: Expo Snack (для демо)

Опубликуйте проект на Expo Snack для быстрого просмотра:
```bash
expo publish
```

#### Вариант В: Web версия через Vercel

Если хотите создать **веб-версию** вашего React Native приложения:

```bash
# Добавьте web конфигурацию
npm run web

# Соберите для продакшена
expo build:web

# Задеплойте web-build папку на Vercel
cd web-build
vercel
```

## Структура деплоя

После правильной настройки:

- **Backend API**: `https://your-app.vercel.app/api/...`
- **Мобильное приложение**: через Expo (EAS) или App Store/Google Play
- **Web версия** (опционально): через Vercel

## Обновление конфигурации

После деплоя backend на Vercel, обновите `src/config/vk.ts` в мобильном приложении:

```typescript
export const API_URL = 'https://your-app.vercel.app';
```

## Проверка работы API

После деплоя проверьте:

```bash
curl https://your-app.vercel.app/api/health
```

Должен вернуть:
```json
{
  "status": "ok",
  "timestamp": "2025-12-03T...",
  "version": "1.0.0"
}
```

## Альтернативы Vercel для backend

- **Heroku** - классический выбор для Node.js
- **Railway.app** - современная альтернатива Heroku
- **Render** - бесплатный tier для небольших проектов
- **AWS Lambda** - serverless решение
- **DigitalOcean App Platform** - простой деплой

## Рекомендации

1. **Для backend**: Используйте Vercel (уже настроено)
2. **Для мобильного приложения**: Используйте EAS Build + Expo
3. **Для веб-версии**: Соберите через `expo build:web` и деплойте на Vercel

## Команды для быстрого деплоя

```bash
# Backend на Vercel
vercel --prod

# Мобильное приложение на EAS
eas build --platform all --auto-submit

# Web версия на Vercel
expo build:web && cd web-build && vercel --prod
```
