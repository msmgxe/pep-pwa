# Pep Education — Estado de Proyectos

> Documento maestro de referencia. Última actualización: 2026-05-14.

---

## 1. Resumen de lo que tienes

Tienes **tres proyectos** que comparten el mismo backend (Supabase):

| Proyecto | Carpeta | URL | Para qué sirve |
|---|---|---|---|
| **Admin** | `Pep/admin/` | https://pepeducation-admin.vercel.app | Panel del nutricionista |
| **Flutter** | `Pep/mobile_flutter/` | App Store / APK directo | App móvil nativa |
| **PWA** | `PepPWA/` | https://pep-pwa.vercel.app | App instalable sin App Store |

---

## 2. Por qué existen tanto Flutter como la PWA

El problema original: **probar en iPhone real requiere Apple Developer Account ($99/año)**.

La solución fue crear la PWA como alternativa:

| Plataforma | Flutter (Pep) | PWA (PepPWA) |
|---|---|---|
| **iOS App Store** | Requiere cuenta Apple ($99/año) | No aplica |
| **iOS directo** | No posible | ✅ Safari → "Agregar a inicio" (gratis) |
| **Android APK** | ✅ Build con Android Studio | ✅ Capacitor → APK |
| **Navegador web** | No aplica | ✅ Funciona en cualquier browser |

> La PWA **no reemplaza** Flutter — ambas comparten el mismo Supabase y tienen paridad de funciones.

---

## 3. Cómo referirte a cada proyecto al pedir cambios

| Lo que dices | Carpeta donde trabajo |
|---|---|
| "en la PWA" o "en PepPWA" | `/Users/marco/Proyectos/PepPWA/` |
| "en Flutter" o "en mobile" | `/Users/marco/Proyectos/Pep/mobile_flutter/` |
| "en el admin" | `/Users/marco/Proyectos/Pep/admin/` |

---

## 4. Cómo probar en iPhone (sin Developer Account)

Esto aplica para la **PWA**. Solo necesitas que esté desplegada en Vercel.

1. Desde el iPhone, abrir **Safari** (no Chrome — Chrome en iOS no puede instalar PWA)
2. Ir a: **https://pep-pwa.vercel.app**
3. Tocar el botón **Compartir** (cuadrado con flecha ↑ en la barra inferior)
4. Seleccionar **"Agregar a pantalla de inicio"**
5. Confirmar → aparece el ícono de Pep en el home del iPhone
6. Se abre como app a pantalla completa, sin barra de Safari

> La app se actualiza automáticamente cuando se redesploya en Vercel — el usuario no necesita reinstalar.

---

## 5. Cómo probar en Android

### Opción A — Navegador (más rápido)
Abrir Chrome en Android y entrar a **https://pep-pwa.vercel.app**.
Chrome muestra automáticamente un banner para instalar como app.

### Opción B — APK directo (Flutter o PWA con Capacitor)

**Desde Flutter:**
```bash
cd /Users/marco/Proyectos/Pep/mobile_flutter
flutter build apk --release
# APK en: build/outputs/flutter-apk/app-release.apk
```

**Desde la PWA:**
```bash
cd /Users/marco/Proyectos/PepPWA
npm run sync:android   # build + copiar assets
npm run open:android   # abre Android Studio
```
En Android Studio: **Build → Build APK(s)** → APK en `android/app/build/outputs/apk/debug/`

Enviar el APK por WhatsApp. El usuario acepta "instalar de fuentes desconocidas" si aparece.

---

## 6. Flujo de desarrollo y deploy

### Publicar cambios en la PWA
```bash
cd /Users/marco/Proyectos/PepPWA
npx vercel --prod
```
> Usa `npx vercel` (sin `-g`) para evitar problemas de permisos.

### El admin se despliega automáticamente
```bash
cd /Users/marco/Proyectos/Pep/admin
git add .
git commit -m "descripción"
git push
# Vercel detecta el push y redesploya solo
```

### Flutter se prueba con:
```bash
cd /Users/marco/Proyectos/Pep/mobile_flutter
flutter run              # en simulador o dispositivo conectado
flutter build apk        # genera APK
```

---

## 7. Tech Stack

### Flutter (`Pep/mobile_flutter/`)
- **Framework:** Flutter 3 + Dart
- **Backend:** Supabase Flutter SDK
- **Estado:** ChangeNotifier (services)
- **i18n:** `LanguageService` con JSON embebido
- **Unidades:** `UnitsService` (kg/lbs, cm/ft) guardado en `SharedPreferences`

### PWA (`PepPWA/`)
- **Framework:** Ionic React v8 + Vite + TypeScript
- **Backend:** @supabase/supabase-js (mismo proyecto Supabase)
- **PWA:** vite-plugin-pwa (service worker automático)
- **Android:** Capacitor v7
- **Gráficas:** Recharts
- **i18n:** i18next + react-i18next (ES / EN / PT)

### Admin (`Pep/admin/`)
- **Framework:** Next.js (App Router)
- **Backend:** Supabase JS
- **Deploy:** Vercel (CI/CD automático con GitHub)

---

## 8. Funcionalidades — Estado actual

| Feature | Flutter | PWA |
|---|---|---|
| Login / Registro con OTP 6 dígitos | ✅ | ✅ |
| Selector de idioma en registro | ✅ | ✅ |
| Reenvío de código con contador 5 min | ✅ | ✅ |
| Onboarding 6 pasos | ✅ | ✅ |
| Home con IMC y próxima cita | ✅ | ✅ |
| Registro de pesos + foto | ✅ | ✅ |
| Progreso con gráficas + logros | ✅ | ✅ |
| Calendario de citas | ✅ | ✅ |
| Tips del nutricionista | ✅ | ✅ |
| Soporte WhatsApp | ✅ | ✅ |
| Perfil con foto | ✅ | ✅ |
| i18n ES / EN / PT | ✅ | ✅ |
| Adaptación a notch (iPhone / Android) | ✅ | ✅ |
| PWA instalable en iOS sin App Store | ❌ | ✅ |
| APK Android por WhatsApp | ✅ | ✅ |

---

## 9. Adaptación a pantallas y notch — Qué se hizo

### Flutter (cambios recientes)

Los tres modales del app tenían riesgo de desbordamiento en pantallas pequeñas (iPhone SE) cuando aparecía el teclado. Se corrigieron:

| Archivo | Qué se corrigió |
|---|---|
| `lib/screens/auth/otp_sheet.dart` | Modal OTP: scroll + maxHeight 85% |
| `lib/screens/tabs/weight_screen.dart` | Modal de pesaje: scroll + maxHeight 85% |
| `lib/screens/tabs/reminders_screen.dart` | Modal de cita: scroll + maxHeight 85% |

**Patrón aplicado en los tres:**
```dart
// Antes
Container(padding: viewInsets) → Column(mainAxisSize.min)

// Ahora
Padding(viewInsets) → Container(maxHeight: 85%) → SingleChildScrollView → Column
```

Los demás screens (Home, Progress, Tips, Profile, Login, Register) ya manejaban correctamente el notch mediante `Scaffold` + `AppBar` (top) y `BottomNavigationBar` (bottom).

### PWA — Sin cambios necesarios

Ionic maneja el notch automáticamente:
- `viewport-fit=cover` en `index.html` → el viewport llega hasta los bordes
- `IonContent` aplica `env(safe-area-inset-top/bottom)` automáticamente
- `IonModal` con `IonContent` resuelve scroll y teclado sin código adicional

---

## 10. Supabase — Tablas y configuración

**URL:** `https://mpdpbfaorquuqvhawwea.supabase.co`

| Tabla | Contenido |
|---|---|
| `profiles` | Datos del paciente (nombre, peso actual, altura, sexo, etc.) |
| `measurements` | Historial de pesajes con fecha y foto |
| `calendar_events` | Citas y recordatorios |
| `tips` | Tips publicados por el nutricionista |
| `patient-photos` | Bucket de Storage para fotos |

**Configuraciones importantes en Supabase:**
- Auth → Sign In/Providers → Email → **Email OTP length: 6** (cambiado de 8)
- Ambas apps validan exactamente 6 dígitos

**Columnas que NO existen en `profiles`** (se guardan localmente):
- `weight_unit` → `SharedPreferences` (Flutter) / `localStorage` (PWA)
- `height_unit` → ídem

---

## 11. Configuración del Admin (Vercel)

- **Repo:** https://github.com/msmgxe/pepeducation-admin
- **Git user requerido:** `msmgxe@users.noreply.github.com`
  (Vercel Hobby bloquea deploys si el commit viene de otro email)
- **URL:** https://pepeducation-admin.vercel.app

---

*Actualizado: 2026-05-14*
