# Сборка APK через CodeMagic

## Подготовка проекта

### 1. Создать Git репозиторий
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```

### 2. Зарегистрироваться на CodeMagic
- Перейди на https://codemagic.io
- Залогинься через GitHub/GitLab/Bitbucket
- Подключи репозиторий vk_guests

### 3. Настроить переменные окружения в CodeMagic

В настройках приложения на CodeMagic добавь:

**Environment variables:**
- `EXPO_TOKEN` - токен от Expo (получить: `npx expo login` → `npx expo whoami --token`)

### 4. Настроить Android Keystore (для подписи приложения)

**Вариант A: Автоматическая подпись через Expo**
- Ничего не нужно, Expo сам создаст keystore при первой сборке

**Вариант B: Своя подпись**
1. Создай keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore vk_guests.keystore -alias vk_guests -keyalg RSA -keysize 2048 -validity 10000
```

2. В CodeMagic → Settings → Code signing добавь keystore файл

### 5. Запустить сборку

После push в репозиторий CodeMagic автоматически:
1. Установит зависимости
2. Соберёт APK через EAS
3. Отправит APK на email или в Artifacts

## Альтернатива: Локальная сборка через EAS

Если не хочешь настраивать CodeMagic, можешь собрать локально:

```bash
# Установи EAS CLI
npm install -g eas-cli

# Залогинься
eas login

# Собери APK
eas build -p android --profile preview
```

После сборки получишь ссылку на скачивание APK.

## Настройка VK OAuth для Android APK

После сборки APK нужно настроить VK-приложение:

1. Открой https://dev.vk.com/apps
2. Перейди в настройки своего приложения
3. Добавь Android платформу:
   - Package name: `com.vkguests.app`
   - Certificate fingerprint: SHA-1 от твоего keystore
   
Получить SHA-1:
```bash
keytool -list -v -keystore vk_guests.keystore -alias vk_guests
```

Или если используешь Expo keystore:
```bash
eas credentials -p android
```

## Тестирование

1. Скачай APK из CodeMagic Artifacts или EAS
2. Установи на Android устройство
3. Разреши установку из неизвестных источников
4. Запусти приложение
5. Авторизуйся через VK или используй демо-режим
