# Android WebView APK

Проект упакован через Capacitor: веб-сборка кладется в native Android WebView.

## Debug APK

```sh
npm run android:apk
```

По умолчанию Android-сборка использует backend `http://192.168.1.11:3000/api`.

Готовый файл:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Backend URL

По умолчанию фронт использует `http://localhost:3000/api`. В APK `localhost` указывает на сам Android-девайс, поэтому для реального телефона нужно перед сборкой указать доступный URL backend:

```sh
VITE_API_URL="https://your-api.example.com/api" npm run android:apk
```

Для Android-эмулятора локальный backend на Mac обычно доступен как:

```sh
VITE_API_URL="http://10.0.2.2:3000/api" npm run android:apk
```

Для физического телефона URL должен указывать на IP вашего компьютера в той же Wi-Fi сети:

```sh
VITE_API_URL="http://192.168.1.11:3000/api" npm run android:apk
```

Если IP компьютера изменился, узнайте новый адрес и пересоберите APK:

```sh
ipconfig getifaddr en0
VITE_API_URL="http://NEW_IP:3000/api" npm run android:apk
```

## Android Studio

```sh
npm run android:open
```

Если менялся веб-код, сначала выполните:

```sh
npm run mobile:build
```
