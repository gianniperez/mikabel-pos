# Roadmap de Implementación MVP - Mikabel POS

Este documento centraliza el paso a paso técnico para llevar Mikabel POS de un boilerplate a un MVP funcional tipo **Punto de Venta Profesional**, basado en el **SRD v3.0**.

---

## 🚀 Fase 0: Setup, Branding & Tooling (Sprint 0)

_Objetivo: Preparar el terreno, conectar infraestructura y librerías físicas._

- [✅] **Alineación de Identidad:**
  - [✅] Renombrar proyecto a en `package.json` (`mikabel-pos`).
  - [✅] Actualizar Metadata en `src/app/layout.tsx` (título, descripción, OG tags).
  - [✅] Actualizar `README.md` con la descripción real de Mikabel POS.

- [✅] **Infraestructura Base:**
  - [✅] Instalar SDK de Firebase (`firebase`) e inicializar Auth y Firestore en `src/lib/firebase.ts`.
  - [✅] Crear `.env.example` con las keys de configuración.

- [✅] **Configuración Mobile-First & PWA:**
  - [✅] Generar e incluir `manifest.json`.
  - [✅] Configurar soporte de instalación (PWA) e íconos para iOS/Android.

- [✅] **Tooling Avanzado de Mostrador:**
  - [✅] Dependencias Core: `react-hook-form`, `@hookform/resolvers`, `zod`, `date-fns`, `lucide-react`.
  - [✅] Interfaces Complejas: `@tanstack/react-table` (Grillas), `sonner` (Toasts).
  - [✅] Librerías de Periféricos: `usehooks-ts` (para `useEventListener` del láser), `react-to-print` (para el ticket térmico).
  - [✅] Offline Cache: Instalar e inicializar `dexie` para la réplica de base de datos local.

---

## � Fase 1: Autenticación y Layout Principal

_Objetivo: Proteger el sistema y establecer la navegación PWA._

- [✅] **Acceso Restringido:**
  - [✅] Crear Pantalla de Login (`/login`) con Auth Providers (Google/Email).
  - [✅] Setup final Auth protegiendo el `layout` base (Wrapper de Sesión).
  - [✅] **Acceso a Registro (`/register`) exclusivo para Administradores (solo Admin puede crear cuentas de empleado).**
  - [✅] Guardar perfil de usuario en colección `users` al primer login (Rol: `employee` por default).
  - [✅] Contexto de Usuario global (Zustand) para saber ID y Rol activo.
  - [✅] **Flujo de Recuperación de Contraseña:** Pantalla `/forgot-password` con envío de email vía Firebase y validación de existencia previa del correo.

- [✅] **Navegación Core & UI:**
  - [✅] Configurar el Shell/Layout principal con Sidebar (Desktop) y BottomBar (Mobile).
  - [✅] Crear páginas vacías ruteables (`/inventory`, `/pos`, `/debts`, `/reports`, `/register`).
  - [✅] **TopBar Mobile:** Implementar menú hamburguesa responsivo con drawer de info de sesión, botón de cerrar sesión y acceso a "Registrar Empleado" (solo admins).
  - [✅] **Refinamiento de Formularios:** Agregar íconos representativos (Mail, Usuario) y toggles funcionales de visibilidad de contraseña (Ojito) en pantallas de Auth.

---

## �📦 Fase 2: Inventario Zero-Latency (Core)

_Objetivo: Catálogo instantáneo y soporte logístico híbrido._

- [✅] **Seguridad y Modelos Firestore:**
  - [✅] Implementar Security Rules (solo Admin edita/borra, Empleados leen/crean ventas).
  - [✅] Definir tipos TS estrictos (`products`, `categories`). **Todos los modelos deben incluir un `id: string` obligatorio pregenerado**.

- [✅] **Catálogo Híbrido & Caché Local:**
  - [✅] Configurar servicio de Dexie.js para sincronizar Firestore `products` -> IndexedDB al inicio de sesión.
  - [✅] Crear la pantalla "Inventario" (`/inventory`) impulsada por `@tanstack/react-table` leyendo de Dexie para máxima fluidez.
  - [✅] Funcionalidad CRUD con modal (usando `zod`). Creadores de items o actualizadores de stock.
  - [✅] Lógica generadora de Códigos Cortos Internos (para productos sueltos/verduras).

---

## ✅ Fase 3: Gestión de Turnos (Cash Sessions)

_Objetivo: Seguridad contable del empleado._

- [✅] **Gestión de Turno Activo:**
  - [✅] Pantalla de bloqueo "Caja Cerrada" si no hay sesión abierta.
  - [✅] Modal/Form de "Abrir Turno" (Ingreso monto de sencillo en caja).
  - [✅] Formulario "Registrar Egreso" (Para salidas de efectivo / Pagos a proveedores).

- [✅] **Cierre de Caja (Arqueo Z):**
  - [✅] Interfaz ciega que solicita conteo de billetes físicos totales en el cajón.
  - [✅] Cálculo de Arqueo: (Apertura + Ventas Efectivo + Abonos Fiados) - Egresos = Esperado.
  - [✅] Deshabilitar el POS, cambiar `cash_sessions` a estado "closed".
  - [✅] **Generar e imprimir el Ticket Físico de "Resumen de Cierre de Caja" (Z).**

---

## 💰 Fase 4: Terminal Punto de Venta (POS)

_Objetivo: Operación Touch/Láser Ininterrumpida a escala mostrador._

- [✅] **El Carrito de Compras (Zustand):**
  - [✅] Zustand store (`usePosStore`) para mantener productos pre-facturados, cantidades y totales.
  - [✅] Interfaz de Venta Rápida: Grid visual estilo Pad, y listado de items a la derecha. Consolidación de IDs idénticos (`Item x 8`).
- [✅] **Hardware Listeners (Global Barcode):**
  - [✅] Implementar `useEventListener('keypress')` montado permanentemente en el Dashboard.
  - [✅] Lógica "Debounce" física: Si se perciben ráfagas numéricas terminadas en `Enter` antes de 50ms, interceptarlas y mandarlas al Carrito sin requerir Focus de un input.

- [✅] **Motor Financiero Transaccional:**
  - [✅] Cálculo de total dinámico (+Surcharges x Tarjeta, -Descuentos).
  - [✅] Algoritmo multibulks (Detectar si la suma de latas de tomate activa el precio mayorista y reemplazar el `salePrice` en esa fila).

- [✅] **Cobro, Restitución e Impresión:**
  - [✅] Modal Popover de Confirmar Pago (Atajo de teclado global: `Enter`).
  - [✅] Soporte para **Pagos Mixtos** dinámicos (Permitir dividir cuenta entre Efectivo y Transferencia/Tarjeta).
  - [✅] Ejecución Optimista (Zero-Latency): Vaciar UI instantáneamente en cliente, encolar en Sync Queue (Zustand) y emitir ticket visual previo a DB.
  - [✅] Ejecución en background: Batch Update de Firestore (Crea ticket + Resta Stocks + Incrementa `totalCashSales` / `totalTransferSales` en Turno Activo).
  - [✅] Gatillado invisible con `react-to-print` para emitir ticket térmico.
  - [✅] Interfaz de "Anular Venta" y repasar el stock hacia el inventario (Exclusivo Admin).

---

## 📋 Fase 5: Libreta Barrial (Fiados)

_Objetivo: Control sano de créditos de confianza vecinal._

- [✅] **Gestión de Clientes:**
  - [✅] Listado de Clientes y vistas de su Deuda Histórica acumulada.
- [✅] **Logística de Prestamos y Abonos:**
  - [✅] Botón en el checkout del POS: "Cobrar por Fiado" -> Asignar Venta a cliente, generar `debts` e incrementar `totalDebtSales` en Turno.
  - [✅] Interfaz de "Recibir Cobro Parcial": Modificar `paidAmount` hasta alcanzar el límite.
  - [✅] Conexión a Caja Exigida: Un Abono físico debe incrementar el `totalDebtPayments` de la sesión actual (Batch Write).
  - [✅] Reglas de bloqueo (Firestore) para impedir que empleados eliminen deudas por las dudas.

---

## 📊 Fase 6: Inteligencia de Negocio y Estabilidad

_Objetivo: Calidad final para el Dueño._

- [✅] **Business Intelligence (Panel Dueño):**
  - [✅] Dashboard Financiero (Filtros por Rango de Fechas custom).
  - [✅] Desglose de "Cajas" pasadas, para revisar la performance de cada empleado y sus márgenes de faltantes.
  - [✅] Ranking dinámico de Productividad (Top productos vendidos vs Top productos paralizados en stock).
  - [✅] Alertas rojas para productos por debajo de su `minStock`.

- [✅] **UX & Fallbacks Físicos:**
  - [✅] Sistema de Toast global (`sonner`) - Éxito verde (Venta), Rojo pitido fiero (Producto Inexistente).
  - [✅] Banner _Sticky_ color carmesí si `navigator.onLine` pasa a falso (Avisando al usuario que sincronizaciones subirán tarde, pero Dexie permite seguir trabajando).
  - [✅] Refinar diseño oscuro/serio (Azul Intenso/Blanco) con tipografía Inter "brutalista" orientada a legibilidad numérica desde lejos.

---

## 🛑 Puntos Ciegos Estratégicos (Pre-Lanzamiento)

_Estos items no estaban en el roadmap original pero son críticos para evitar fallos catastróficos el "Día 1"._

- [✅] **Idempotencia de Sincronización:** El `PosSyncLoop` actual usa `increment` en Firebase sin verificar si el ticket ya se procesó. Si la red oscila y el loop reintenta, podría duplicar ventas en el reporte de caja y restar stock doble.
- [✅] **Invalidación de Caché Local:** Al vender, el stock baja en Firebase pero Dexie (local) no se entera hasta que se recarga la página o se dispara la sincronización inversa. El usuario podría ver stock incorrecto en el POS por varios minutos.
- [✅] **Configuración de Recargos:** El recargo por transferencia (10%) está hardcodeado en el código. Debería ser un campo configurable por el Admin para evitar releases de código ante cambios de política comercial.
- [✅] **PIN de Autorización Admin:** El SRD menciona que las anulaciones y ajustes de stock son "Exclusivas Admin". Si el Admin deja su sesión abierta en la caja, un empleado podría anular ventas. Se recomienda un PIN rápido para acciones críticas.
- [✅] **Validación de Entorno (Health Check):** El sistema debe explotar (o avisar amigablemente) si faltan las variables de entorno de Firebase antes de que el usuario intente loguearse.
- [✅] **Carga Inicial de Datos (Seeding):** Un script o JSON importable para que el dueño no tenga que crear 50 categorías y 200 productos uno por uno desde cero el primer día.
- [ ] **Utilidad de Importación JSON (UI Admin):** Implementar el botón "Importar JSON" en el Inventario para que el Admin pueda subir el archivo `seed-template.json` directamente y poblar la base de datos de forma automática.
