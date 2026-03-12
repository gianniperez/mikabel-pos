# Mapa del Sistema: mikabel-pos

Este documento sirve como la fuente única de verdad para entender el stack técnico, la arquitectura de archivos y las dependencias del proyecto **mikabel-pos**.

## 🚀 Stack Técnico

### Core

- **Framework:** Next.js 16 (React 19)
- **Lenguaje:** TypeScript
- **Estilos:** CSS Vanilla (Mobile First)

### Backend & Persistencia

- **Auth & DB:** Firebase (Authentication + Firestore)
- **Local Cache:** Dexie.js (IndexedDB para inventario zero-latency)
- **State Management:** Zustand (Persistente para carrito y turnos)

### POS & Periféricos

- **Escaneo:** `useEventListener` para capturar láser de barcode
- **Impresión:** `react-to-print` para tickets térmicos 80mm
- **Validación:** Zod + React Hook Form

---

## 📂 Estructura de Carpetas Clave

| Carpeta           | Contenido                                                          | Estado          |
| ----------------- | ------------------------------------------------------------------ | --------------- |
| `src/app/`        | Rutas Next.js App Router (`layout.tsx`, `page.tsx`, `favicon.ico`) | ✅ Configurado  |
| `src/components/` | Componentes UI genéricos (Button, Input, Modal, etc.)              | ✅ Configurado  |
| `src/features/`   | Features de negocio (Ventas, Inventario, Deudas, Reportes)         | ✅ Implementado |
| `src/hooks/`      | Custom hooks globales y de PWA                                     | ✅ Configurado  |
| `src/providers/`  | `AppProvider.tsx` — envuelve la app con Query/Auth                 | ✅ Configurado  |
| `src/styles/`     | `globals.css` — diseño premium de Mikabel                          | ✅ Configurado  |
| `src/types/`      | Types/Interfaces de modelos de datos                               | ✅ Configurado  |
| `src/utils/`      | Utilities y helpers de negocio                                     | ✅ Configurado  |

---

## 🛡️ Reglas de Negocio Críticas

1. **Unicidad:** No pueden existir dos productos con el mismo código de barras.
2. **Seguridad:** Los empleados no pueden editar precios ni borrar deudas. Solo Admin tiene permisos.
3. **Turnos:** No se puede vender si no hay una "Sesión de Caja" abierta.
4. **Resiliencia:** El sistema detecta si está offline y permite seguir vendiendo, sincronizando al recuperar conexión.
