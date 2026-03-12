# Documento de Requerimientos del Sistema (DRS) - Mikabel App

> **Versión:** 3.0  
> **Estado:** Draft  
> **Última actualización:** 4 de Marzo, 2026  
> **Basado en:** Lineamientos de Antigravity DRS

---

## 1. Resumen Ejecutivo

Este documento detalla la arquitectura para **Mikabel App**, una plataforma de Punto de Venta (POS) y gestión de inventario para el **Minimarket Mikabel**. La aplicación centraliza la operación de un negocio familiar con alta diversidad de rubros, permitiendo un control unificado de stock, ventas y fiados (deudas), todo bajo un ecosistema enfocado en la velocidad de atención.

**Puntos Clave del MVP:**

- **PWA (Mobile First):** Diseño optimizado para móvil (empleados en góndola), con soporte responsive ultra rápido para Desktop (Caja registradora).
- **Autenticación:** Firebase Auth (Google y Email).
- **Base de Datos:** Firebase Firestore.
- **Inventario Flexible:** Manejo de códigos de barras (físicos) y códigos internos cortos para productos sin etiquetas. (MVPs sin integración directa de tickets de balanzas).
- **Ventas y Ofertas Ágiles:** Detección automática de precios por bultos/maples, y manejo de recargos por medios de pago.
- **Control de Fiados:** Historial de clientes y deudas para reemplazar la "libreta".
- **Gestión de Turnos (Caja):** Control de apertura, cierre y arqueo de caja con control de faltantes/sobrantes.

---

## 2. Definición Detallada de Componentes

### 2.1 El Minimarket como Entorno Central (Core)

La operatoria de Mikabel se divide en dos modos principales según el dispositivo de uso: Terminal de Caja (Desktop) y Asistencia en Góndola (Mobile).

#### Dashboard Administrativo y Resumen

Al iniciar sesión, el usuario accede al "Resumen del Día" (Dashboard):

- **Ventas del Día:** Total recaudado vs Día anterior.
- **Stock Crítico:** Alertas inmediatas de productos agotados o por agotarse.
- **Deudas Pendientes:** Clientes que superaron el límite de tiempo de fiado.
- **Acceso Rápido:** Botón gigante y central de "Iniciar Venta" (Mobile) o habilitación del escáner en Desktop.

### 2.2 Terminal de Punto de Venta (POS) y Turnos

Módulo central para la inserción instantánea de productos a un carrito (Ticket) y control de flujo de dinero.

- **Apertura y Cierre de Caja:** Antes de vender, el empleado debe "Abrir Caja" indicando el efectivo base (sencillo). Al finalizar su turno, "Cierra Caja" para generar un reporte automático de cuadratura (Arqueo Z) e **imprimir un ticket físico de resumen**.
- **Ingreso Múltiple:** El usuario puede usar un lector láser USB (Desktop), cámara del celular (Mobile), o búsqueda instantánea por texto.
- **Motor de Ofertas:** El sistema evalúa si la cantidad de `X` producto alcanza el umbral de `bulkQuantity` para aplicar el `bulkPrice` automáticamente (Ej: Lleva 30 huevos -> cobra 1 Maple).
- **Pagos Mixtos:** Soporte para abonar un mismo ticket con múltiples medios de pago simultáneos (Ej: Parte Efectivo, Parte Transferencia/MercadoPago).
- **Recargos y Descuentos Manuales:** Posibilidad de aplicar un recargo global (ej. +10% por pago con Tarjeta/MercadoPago) o descuentos directamente en el total del ticket.
- **Cierre del Ticket:** Deducción automática del stock en un single batch Write.
- **Egresos de Caja (Pago a Proveedores):** Permite registrar la salida de efectivo de la caja en medio del turno para pagos menores (MVP: Ingreso manual con comentario; Post-MVP: Módulo de Proveedores Completo).
- **Devoluciones y Anulaciones:** Posibilidad de cancelar una compra reciente restituyendo el stock, exclusiva para el Admin o con autorización (PIN).

### 2.3 Inventario Integral (El Catálogo)

El corazón de los productos. Un listado infinito operado por `TanStack Table`.

- **Soporte Híbrido:** Si el producto no tiene Barcode, se le asigna un código interno numérico corto (Ej: 1045 - Papa Negra), facilitando aprenderlo de memoria.
- **Control Unificado:** Se define Unidad de Medida (KG, Unidad, 100gr).

### 2.4 Clientes y Deudas (Libreta Digital)

Reemplaza el sistema en papel de fiados.

- **Cliente:** Se ingresa Nombre y Apellido y opcional (Teléfono).
- **Control de Deuda:** Cada adición genera un registro inmutable de "Gasto pendiente". Cuando el cliente abona, el registro pasa a estado `Pagado`.
- **Pagos Parciales (Abonos):** Soporte para que un cliente salde solo una parte de toda la deuda acumulada.

### 2.5 Integración de Periféricos y Hardware (POS Avanzado)

Para que el sistema se comporte como un POS profesional de escritorio sin perder las ventajas estructurales de la nube:

- **Lector de Código de Barras Global:** El sistema utilizará un listener global (Ej: `usehooks-ts` o `useKeyPress`) para capturar ráfagas ultrarrápidas de teclado a nivel del `document`. Esto permite al cajero escanear un producto **en cualquier momento**, sin necesidad de estar haciendo click previo en una barra de búsqueda para enfocarla.
- **Tickets e Impresoras Térmicas:** El cierre de venta generará un recibo optimizado visualmente para papel continuo (58mm u 80mm). Al usar librerías como `react-to-print`, se envía directamente el componente de React a la API de impresión del navegador (`window.print()`), permitiendo usar cualquier impresora térmica Bluetooth, USB o de red sin requerir instalación de drivers en el código.

### 2.6 Reportes y Analíticas (Business Intelligence)

Módulo exclusivo para Administradores (Dueños) que permite evaluar la rentabilidad y el flujo de caja sin que los empleados tengan acceso a esta información confidencial (Protegido por Reglas de Firestore).

- **Filtros Dinámicos:** Generación de reportes segmentados por Día, Semana, Mes, Año, o un rango de fechas totalmente personalizado.
- **Reportes por Turno/Empleado:** Posibilidad de auditar una sesión de caja (`sessionId`) específica, o ver el historial de desempeño y el promedio de faltantes/sobrantes de cada cajero.
- **Ranking de Rotación:** Análisis de los productos más vendidos (Top Sellers) y de mayor margen vs. los de menor rotación (Stock inmovilizado/Clavos).
- **Auditoría Estricta:** Las reglas de Firebase solo permiten al Admin (Dueño) cambiar precios o meter stock a mano.
- **Flujo de Dinero (Cashflow):** Desglose de ingresos por método de pago, separando el Efectivo Físico del Dinero Digital (Bancos).

### 2.7 Casos de Uso End-to-End (E2E)

#### Caso 1: Venta Rápida de Mostrador (La hora pico)

1. El empleado (Cajero) toma los productos de la canasta del cliente.
2. Dispara el lector térmico; el producto se añade instantáneamente al carrito visual. No hace falta tocar el mouse.
3. Lo repite con 5 artículos. Uno de ellos llega a 3 unidades; el POS detecta la promo y aplica un `bulkPrice` tachando el precio original.
4. El cajero presiona un atajo de teclado (`Enter` o `Espacio`) para "Cobrar". Se abre modal de pago, pre-seteado en Efectivo.
5. Presiona `Enter` nuevamente. Se efectúa la venta (100ms), suena alerta de éxito, se dispara la impresión del ticket, el stock baja en la DB y la pantalla queda limpia esperando al siguiente cliente. Todo este proceso demora apenas un par de segundos físicos.

#### Caso 2: Operación de Libreta (El vecino fiado)

1. La vecina "Doña María" pide mercadería y dice "Anotámelo".
2. El cajero escanea los productos en el POS normal. Al cobrar, selecciona la pestaña/botón de pago "Fiado".
3. El sistema despliega el buscador de Clientes. Se tipea "María" y se la selecciona.
4. El ticket se cierra a nombre de ella y su total de deuda se incrementa en el sistema.
5. Una quincena después, María vuelve para pagar. El cajero abre el módulo "Deudas", busca "María", presiona "Recibir Pago", anota que entrega $20.000 (abono total o parcial). El sistema genera el registro de "Pago" y el cajero le entrega su ticket de comprobante.

---

## 3. Arquitectura y UX/UI

### 3.1 Navegación y Jerarquía (PWA Focus)

```text
Login (Firebase Auth) -> Dashboard
│
└── Inicio Dashboard [ID] (Bottom NavBar en Mobile)
│    ├── Inicio (Resumen del Día, Alertas, Botón Iniciar Venta)
│    ├── Ventas (Historial de tickets emitidos)
│    ├── Inventario (Catálogo maestro de Productos)
│    ├── Deudas (Historial de clientes y libretas)
│    └── Reportes (Estadísticas complejas - Admin Only)
└── Inicio Dashboard [ID] (Sticky Top NavBar en Mobile)
    ├── Menu Hamburguesa (Contiene información de la app, información del usuario y botón de cerrar sesión)
    ├── Barra de búsqueda (Se actualiza dinámicamente según el módulo en el que se encuentre el usuario)
    └── Logo de Mikabel
```

#### Comportamiento Global de la UI Móvil y Desktop

- **Desktop (Caja):** La navegación se posiciona en una Sidebar lateral fija para aprovechar el ancho de monitores standard.
- **Mobile (Góndola):** Bottom NavBar clásica que desaparece en Scroll Down.

- **Header:** El Header permanece fijo (Sticky) en la parte superior en todo momento.
- **Bottom NavBar:** Por temas de inmersión y aprovechar la pantalla vertical, la barra de navegación inferior deberá ocultarse gradualmente al hacer **Scroll hacia abajo (scroll down)** y reaparecer instantáneamente al hacer **Scroll hacia arriba (scroll up)** o llegar al final de la página.

### 3.2 Stack Tecnológico Definitivo

- **Frontend:** Next.js (App Router) / React 19 / TypeScript 5.
- **Backend/DB:** Firebase (Firestore, Auth).
- **Offline & Cache Database:** `dexie.js` (Wrapper para IndexedDB nativo). Crucial para un POS: Al iniciar turno, se sincroniza/cachea la lista completa de productos (`products`) en el disco duro del navegador. Cuando el lector láser escanea un código, busca primero en Dexie. Resultado: **Cero latencia de red al scannear productos**.
- **State Management:** Zustand (Estado del Carrito UI, Alertas) + TanStack Query (Sincronización con Firestore).
- **Forms & Validation:** React Hook Form + Zod (Evita corrupciones en los precios y previene envíos vacíos).
- **Data Grids:** `@tanstack/react-table` (Renderizado virtualizado de tablas de inventario para que el explorador no se laguee ni aunque haya miles de artículos).
- **Utilities de POS Hardware:**
  - `usehooks-ts`: Específicamente `useEventListener` para captar el escáner globalmente.
  - `react-to-print`: Para el renderizado e inyección del ticket hacia la impresora térmica de 80mm.
- **Utilities Generales:** `date-fns` (manejo temporal y reportes historicos), `lucide-react` (iconografía rápida).
- **UI:** Tailwind CSS v4 + Sonner (Notificaciones Toast no intrusivas).
- **Deployment:** Vercel o Firebase Hosting.
- **Offline & Optimistic UI Mutability:** Implementación de Cola de Sincronización (Sync Queue) en Zustand. En caso de microcortes de red, el POS aprueba el cobro visual e intenta back-sync con Firebase "fire and forget" sin deshabilitar la interfaz de la terminal.

### 3.3 Arquitectura y Convenciones (FSD)

El proyecto hereda las estrictas normativas del boilerplate `next-seed` (FSD - Feature Sliced Design):

El proyecto hereda las estrictas normativas del boilerplate fundacional (`next-seed`), garantizando un crecimiento escalable y libre de deuda técnica:

1. **Estructura FSD (Feature-Sliced Design):**
   - `src/app/`: Exclusivamente Rutas, Páginas (Next.js App Router) y Layouts.
   - `src/components/`: **Solo** UI genérica, agnóstica al negocio (Botones, Modales Base, Inputs).
   - `src/features/`: **El corazón del dominio**. Aquí viven funciones complejas aisladas (ej: `auth`, `viajes`, `propuestas`). Cada feature tiene sus propios `components/`, `types/`, `stores/` y `api/`.
   - `src/providers/`: Contextos globales (Zustand, TanStack Query, Tema).
   - `src/utils/` y `src/hooks/`: Lógica compartida, global y pura.
2. **Generación Automatizada (Plop.js):** Está **estrictamente prohibido** crear componentes o features a mano. Toda nueva pieza de UI debe inicializarse usando `npm run generate` / `npx plop` para garantizar la estructura base (Component, Types e Index de exportación).
3. **Exportaciones de Barril (Barrel Files):** Las importaciones a una feature o componente interno siempre deben realizarse apuntando a su puerta principal (el `index.ts`), nunca buceando profundamente en archivos anidados.
4. **Manejo de Estado (Boundaries):**
   - **TanStack Query:** Único responsable de la interacción con Firebase Firestore (Server State, Caching, Mutations).
   - **Zustand:** Único responsable del estado efímero de la UI (Client State) como "menús abiertos", "modo oscuro", e interconexión de componentes hermanos.
5. **Calidad Asistida (Husky & Lint-staged):** El código debe pasar por Prettier, ESLint y Vitest (si aplica) antes de cada commit. Errores de tipado bloquearán el push.

---

## 4. UX/UI General

### 4.1 Principios de Diseño

- **Velocidad Quirúrgica (Zero-Latency Rule):** La app debe responder sin lag en la pantalla de ventas. En particular, la entrada del escaneo de código no puede depender de requests HTTPS en tiempo real, debe alimentarse de un caché frontal (como IndexedDB).
- **Accesibilidad sin Ratón:** En el mostrador de caja, cada segundo cuenta. Los modales de "Confirmar", "Aceptar", o "Buscar" deben reaccionar al presionar la tecla `Enter`, `ESC` o atajos `F1-F12`. El cajero debe poder cobrar sin agarrar el mouse.
- **Touch-Targets en Mobile:** Para empleados reponiendo góndolas de almacén con teléfonos en mano, los botones de "Stock+" o "Guardar" deben tener padding masivos (`p-4` mínimo).

### 4.2 Sistema de Diseño (Design Tokens)

- **Primary Font:** Inter (Legibilidad brutalista para nombres cortos de productos y números).
- **Paleta de Colores (Brand Mikabel):**
  - **Primary:** Azul Intenso (`#3543A2`, `#142156`), refleja confianza financiera y limpieza.
  - **Secondary:** Verde Esmeralda (`#10B981`) para éxitos (Cobro realizado), y Carmesí (`#EF4444`) para alertas (Sin Stock/Deuda).
  - **Backgrounds:** Blanco puro (`#ffffff`) y grises muy tenues para diferenciar filas de tablas.
- **Forma:** Ligeramente redondeados (`Rounded-lg` o `Rounded-md`), transmitiendo orden y sistema (menos lúdico que Tripio, más serio de negocios).

---

## 5. Fases de Implementación (Firebase Focus)

- **Fase 0:** Setup de proyecto (Next.js + Firebase Auth/Firestore).
- **Fase 1:** Inventario Inteligente y Listado Base.
- **Fase 2:** Módulo POS (Ventas Rápidas) con lógica de descuentos.
- **Fase 3:** Deudas y Fiados.
- **Fase 4:** Reportes y Métricas (Dashboard Admin).

---

## 6. Notificaciones e Interacciones

| Trigger                    | Condición                                           | Acción                                                                                        |
| :------------------------- | :-------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| **Nuevo Producto**         | Se crea un nuevo producto en catálogo.              | Toast de éxito verde (Sonner).                                                                |
| **Venta Exitosa**          | Ticket cerrado y pago registrado.                   | Sonido de "Cash Register" (opcional) + Toast de éxito. UI limpia el carrito instantáneamente. |
| **Código no Reconocido**   | Se escanea un Barcode que no existe en DB.          | Alerta visual roja + Pitido de error + Modal rápido "Crear Producto?".                        |
| **Nuevo Fiado**            | Se asocia deuda a cliente (Venta por Fiado).        | Toast de advertencia (color ambar: "Fiado Registrado").                                       |
| **Límite de Fiado**        | Cliente supera un límite de deuda preestablecido.   | Modal bloqueante de advertencia al empleado antes de fiar más.                                |
| **Deuda Pagada**           | Deuda pasa de `pendiente` a `pagada`.               | Notificación de Éxito verde (Sonner).                                                         |
| **Cierre de Caja**         | Empleado realiza el arqueo de cierre.               | Notificación Push / Email al Admin con el resumen y faltantes.                                |
| **Poco Stock / Sin Stock** | El stock de un producto baja del mínimo tras venta. | Pequeña alerta visual en el Dashboard.                                                        |
| **Red Desconectada**       | Dispositivo pierde internet.                        | Banner rojo Sticky top "Modo Offline - Sincronización Pausada".                               |
| **Sync Recuperado**        | Internet vuelve y se suben las ventas cacheadas.    | Toast verde "Datos sincronizados correctamente".                                              |

---

## 7. Límites Técnicos

- **Plataforma:** PWA Mobile-First + Web Web responsive para Desktop.
- **Offline:** No disponible para MVP absoluto. Si se corta el internet, se advierte no cerrar la ventana.
- **Facturación AFIP:** No se integra facturación electrónica. (Es un control interno).

---

## 8. Modelo de Datos (Firestore Schema)

### 8.1 Estructura General

```text
/users/{userId}                          ← Colección raíz
/categories/{categoryId}                 ← Colección raíz
/products/{productId}                    ← Colección raíz
/cash_sessions/{sessionId}               ← Colección raíz (Apertura/Cierre de Caja)
/sales/{saleId}                          ← Colección raíz
  └── /items/{itemId}                    ← Subcolección de venta
/customers/{customerId}                  ← Colección raíz
/debts/{debtId}                          ← Colección raíz
```

### 8.2 Colección: `users`

| Campo       | Tipo        | Requerido | Descripción                       |
| ----------- | ----------- | --------- | --------------------------------- |
| `uid`       | `string`    | ✅        | Firebase Auth UID (= document ID) |
| `name`      | `string`    | ✅        | Nombre visible                    |
| `email`     | `string`    | ✅        | Email del usuario                 |
| `role`      | `string`    | ✅        | `'admin'` \| `'employee'`         |
| `createdAt` | `timestamp` | ✅        | Fecha de registro                 |

### 8.3 Colección: `products`

| Campo          | Tipo             | Requerido | Default  | Descripción                                     |
| -------------- | ---------------- | --------- | -------- | ----------------------------------------------- |
| `id`           | `string`         | ✅        | —        | Primary Key / Document ID (Generado en Cliente) |
| `code`         | `string`         | ✅        | —        | Barcode físico o Código interno                 |
| `name`         | `string`         | ✅        | —        | Nombre del producto                             |
| `brand`        | `string \| null` | ❌        | `null`   | Marca (opcional)                                |
| `photoUrl`     | `string \| null` | ❌        | `null`   | Imagen (opcional)                               |
| `categoryId`   | `string`         | ✅        | —        | ID de la categoría asociada                     |
| `salePrice`    | `number`         | ✅        | —        | Precio de venta unitario                        |
| `costPrice`    | `number`         | ✅        | —        | Precio de costo (Visible solo Admin)            |
| `bulkPrice`    | `number \| null` | ❌        | `null`   | Precio por lote/maple                           |
| `bulkQuantity` | `number \| null` | ❌        | `null`   | Cantidad requerida para disparar el `bulkPrice` |
| `quantityUnit` | `string`         | ✅        | `'unit'` | `'kg'` \| `'unit'` \| `'100gr'`                 |
| `stock`        | `number`         | ✅        | `0`      | Stock actual                                    |
| `minStock`     | `number`         | ✅        | `5`      | Nivel de alerta preventiva                      |
| `createdAt`    | `timestamp`      | ✅        | —        | Fecha de creación                               |
| `updatedAt`    | `timestamp`      | ✅        | —        | Última actualización                            |

### 8.4 Colección: `categories`

| Campo  | Tipo     | Requerido | Descripción                    |
| ------ | -------- | --------- | ------------------------------ |
| `id`   | `string` | ✅        | Primary Key / Document ID      |
| `name` | `string` | ✅        | Nombre (Ej: Limpieza, Bebidas) |

### 8.5 Colección: `sales` & Subcolección: `items`

#### Sales (Colección Raíz)

| Campo             | Tipo          | Requerido | Default       | Descripción                                                                |
| ----------------- | ------------- | --------- | ------------- | -------------------------------------------------------------------------- |
| `id`              | `string`      | ✅        | —             | Primary Key / Document ID                                                  |
| `vendedoraId`     | `string`      | ✅        | —             | UID del empleado que efectuó la venta                                      |
| `sessionId`       | `string`      | ✅        | —             | ID del Turno/Caja asociado                                                 |
| `subtotal`        | `number`      | ✅        | —             | Suma directa de todos los items                                            |
| `surchargeConfig` | `map \| null` | ❌        | `null`        | Objeto de % o monto fijo (`{"type": "percentage", "value": 10}`)           |
| `discountConfig`  | `map \| null` | ❌        | `null`        | Objeto de % o monto fijo (`{"type": "fixed", "value": 500}`)               |
| `total`           | `number`      | ✅        | —             | Acumulado final cobrado al cliente (`subtotal + surcharge - discount`)     |
| `payments`        | `array`       | ✅        | —             | Pagos mixtos: `[{method: 'cash', amount: 1000}, {method: 'transfer',...}]` |
| `status`          | `string`      | ✅        | `'completed'` | `'completed'` \| `'refunded'` (Si es anulada)                              |
| `createdAt`       | `timestamp`   | ✅        | —             | Fecha y hora de transacción                                                |

#### Items (Subcolección)

| Campo         | Tipo      | Requerido | Descripción                              |
| ------------- | --------- | --------- | ---------------------------------------- |
| `id`          | `string`  | ✅        | Primary Key / Document ID                |
| `productId`   | `string`  | ✅        | Referencia al documento en `products`    |
| `quantity`    | `number`  | ✅        | Cantidad vendida                         |
| `priceAtSale` | `number`  | ✅        | Snapshot del precio en el momento exacto |
| `bulkApplied` | `boolean` | ✅        | Si se aplicó el descuento mayorista      |

### 8.6 Colección: `cash_sessions` (Caja / Turnos)

| Campo                | Tipo                | Requerido | Default  | Descripción                                              |
| -------------------- | ------------------- | --------- | -------- | -------------------------------------------------------- |
| `id`                 | `string`            | ✅        | —        | Primary Key / Document ID                                |
| `employeeId`         | `string`            | ✅        | —        | UID del empleado a cargo                                 |
| `status`             | `string`            | ✅        | `'open'` | `'open'` \| `'closed'`                                   |
| `openingAmount`      | `number`            | ✅        | —        | Sencillo inicial al abrir caja                           |
| `totalMovements`     | `number`            | ✅        | `0`      | Acumulador atómico de egresos de caja física (+/-)       |
| `totalCashSales`     | `number`            | ✅        | `0`      | Acumulador de ventas pagadas en Billete                  |
| `totalTransferSales` | `number`            | ✅        | `0`      | Acumulador de ventas por MercadoPago/Banco               |
| `totalDebtPayments`  | `number`            | ✅        | `0`      | Acumulador de abonos de Libreta ingresados a caja        |
| `closingAmount`      | `number \| null`    | ❌        | `null`   | Dinero físico contado al cerrar                          |
| `systemCalculated`   | `number \| null`    | ❌        | `null`   | (Apertura - Egresos + Ventas Efec + Pagos Deuda Efec)    |
| `difference`         | `number \| null`    | ❌        | `null`   | Sobrante/Faltante (`closingAmount` - `systemCalculated`) |
| `openedAt`           | `timestamp`         | ✅        | —        | Fecha de apertura                                        |
| `closedAt`           | `timestamp \| null` | ❌        | `null`   | Fecha de cierre (`null` mientras siga activa)            |

### 8.7 Colección: `cash_movements` (Egresos / Retiros de Caja)

| Campo         | Tipo        | Requerido | Default | Descripción                                      |
| ------------- | ----------- | --------- | ------- | ------------------------------------------------ |
| `id`          | `string`    | ✅        | —       | Primary Key / Document ID                        |
| `sessionId`   | `string`    | ✅        | —       | ID del turno de caja del que se retira el dinero |
| `employeeId`  | `string`    | ✅        | —       | Empleado que registró la salida                  |
| `amount`      | `number`    | ✅        | —       | Monto de dinero físico retirado                  |
| `type`        | `string`    | ✅        | —       | `'supplier_payment'` \| `'owner_withdrawal'`     |
| `description` | `string`    | ✅        | —       | Comentario / Proveedor (`"Pago a Panadero"`)     |
| `createdAt`   | `timestamp` | ✅        | —       | Creado                                           |

### 8.8 Colecciones: `customers` y `debts`

#### Customers (Clientes Fiados)

| Campo       | Tipo     | Requerido | Default | Descripción                              |
| ----------- | -------- | --------- | ------- | ---------------------------------------- |
| `id`        | `string` | ✅        | —       | Primary Key / Document ID                |
| `name`      | `string` | ✅        | —       | Nombre / Apodo del vecino                |
| `totalDebt` | `number` | ✅        | `0`     | Sumatoria calculada de deudas pendientes |

#### Debts (Deuda Individual)

| Campo        | Tipo                | Requerido | Default     | Descripción                                     |
| ------------ | ------------------- | --------- | ----------- | ----------------------------------------------- |
| `id`         | `string`            | ✅        | —           | Primary Key / Document ID                       |
| `customerId` | `string`            | ✅        | —           | UID del cliente                                 |
| `saleId`     | `string \| null`    | ❌        | `null`      | ID del ticket original, si aplica               |
| `amount`     | `number`            | ✅        | —           | Monto original prestado / comprado              |
| `paidAmount` | `number`            | ✅        | `0`         | Sumatoria de pagos parciales / abonos           |
| `status`     | `string`            | ✅        | `'pending'` | `'pending'` \| `'partial'` \| `'paid'`          |
| `employeeId` | `string`            | ✅        | —           | Empleado que otorgó el crédito                  |
| `createdAt`  | `timestamp`         | ✅        | —           | Fecha de otorgamiento                           |
| `paidAt`     | `timestamp \| null` | ❌        | `null`      | Fecha en que el `paidAmount` igualó al `amount` |

---

## 9. Roles y Permisos (RBAC)

### 9.1 Definición de Roles

- **Admin/Dueño (Admin):** Tiene acceso absoluto al sistema. Es la única persona capaz de ver precios de costo (y por lo tanto calcular márgenes), crear/eliminar productos clave o anular deudas e historiales.
- **Empleado (Employee):** Usuario base para operar caja y consultar góndola. Restringido para cuidar los balances de la empresa.

### 9.2 Matriz de Permisos

| Operación                                     | Admin Dueño | Empleado Caja                  |
| --------------------------------------------- | ----------- | ------------------------------ |
| **Productos e Inventario**                    |             |                                |
| Ver productos                                 | ✅          | ✅                             |
| Crear nuevos productos                        | ✅          | ✅ (con revisión/límites)      |
| Crear/Registrar nuevos usuarios (Empleados)   | ✅          | ❌                             |
| Editar Precio Venta / Stock Manual            | ✅          | ❌ (Stock solo baja por Venta) |
| Ver Precio de Costo                           | ✅          | ❌                             |
| Eliminar productos                            | ✅          | ❌                             |
| **Ventas / POS**                              |             |                                |
| Crear Venta (Facturar)                        | ✅          | ✅ (Bajo un Turno Abierto)     |
| Ver Historial de Ventas (Propio Turno)        | ✅          | ✅                             |
| Ver Historial de Ventas Total                 | ✅          | ❌                             |
| Anular Venta (Devolución)                     | ✅          | ❌ (Requiere PIN de Admin)     |
| **Caja y Turnos**                             |             |                                |
| Abrir / Cerrar Caja (Arqueo)                  | ✅          | ✅ (Su propia caja)            |
| Modificar registros de cierre históricos      | ✅          | ❌                             |
| **Clientes y Deudas (Fiados)**                |             |                                |
| Ver Clientes / Deudas                         | ✅          | ✅                             |
| Registrar nuevo préstamo (Fiado)              | ✅          | ✅                             |
| Marcar pago de Fiado                          | ✅          | ✅                             |
| Editar / Borrar deuda                         | ✅          | ❌                             |
| **Administración General**                    |             |                                |
| Acceder a Reportes Financieros / Rentabilidad | ✅          | ❌                             |

---

## 10. Operaciones del Sistema

### 10.1 Módulo: POS / Venta Rápida

| Operación         | Input                                      | Output                               | Quién          | Side Effects                                                                    |
| ----------------- | ------------------------------------------ | ------------------------------------ | -------------- | ------------------------------------------------------------------------------- |
| Realizar Venta    | `items[]`, `paymentType` (con `sessionId`) | Sale document creado                 | Admin/Employee | Resta stock de c/ producto. Fallo si DB cae.                                    |
| Venta con Recargo | `paymentType=card`, `%`                    | Sale(`total = subtotal + surcharge`) | Admin/Employee | Se cobra más caro pero el stock baja exactamente igual.                         |
| Anular Venta      | `saleId`                                   | Modifica Sale status a `refunded`    | Admin          | Devuelve los items al `products.stock` (Suma algorítmica iterando los `items`). |

### 10.2 Módulo: Caja / Turnos

| Operación      | Input                         | Output                | Quién          | Side Effects                                                                           |
| -------------- | ----------------------------- | --------------------- | -------------- | -------------------------------------------------------------------------------------- |
| Abrir Caja     | `openingAmount`               | Session doc(`open`)   | Admin/Employee | Habilita el Botón de POS. Registra hora de inicio.                                     |
| Asentar Egreso | `sessionId`, `amount`, `desc` | Movement doc creado   | Admin/Employee | Genera recibo de salida. Resta al cálculo del efectivo esperado en el Arqueo.          |
| Cerrar Caja    | `sessionId`, `closingAmount`  | Session doc(`closed`) | Admin/Employee | Imprime Ticket Z automáticamente. Deshabilita POS y calcula Faltante de dinero físico. |

### 10.3 Módulo: Productos

| Operación           | Input                   | Output              | Quién            | Side Effects                                  |
| ------------------- | ----------------------- | ------------------- | ---------------- | --------------------------------------------- |
| Crear Producto      | Payload producto        | Product doc creado  | Admin/Employee\* | Si `code` está vacío, auto-genera un short ID |
| Ajustar Stock(Mano) | `productId`, `cantidad` | Product doc editado | Admin            | —                                             |

### 10.3 Módulo: Deudas

| Operación   | Input                  | Output             | Quién          | Side Effects                       |
| ----------- | ---------------------- | ------------------ | -------------- | ---------------------------------- |
| Nuevo Fiado | `customerId`, `amount` | Debt doc creado    | Admin/Employee | Incrementa `totalDebt` del Cliente |
| Pagar Deuda | `debtId`               | Debt doc(`paidAt`) | Admin/Employee | Reduce `totalDebt` del Cliente     |

---

## 11. Diagramas de Estado

### 11.1 Venta POS (Ticket)

```text
┌──────────┐   (checkout)   ┌─────────────┐   (Anulación    ┌──────────────┐
│ Cart UI  │ ─────────────→ │  Completed  │ ──────────────→ │  Refunded    │
└──────────┘                └─────────────┘   por Admin)    └──────────────┘
```

- Un Ticket completado nunca puede ser eliminado, solo Anulado (`refunded`), generando trazabilidad.

### 11.2 Caja / Sesión de Turno

```text
┌──────────┐  Cobros y    ┌─────────────┐  (Cuadrar y     ┌──────────────┐
│   Open   │ ───────────→ │ Operations  │ ──────────────→ │   Closed     │
└──────────┘  Egresos     └─────────────┘  Contar billetes)└──────────────┘
```

- Solo se puede operar el POS si existe una sesión `open`. Solo puede haber una sesión `open` a la vez por usuario/caja.

### 11.3 Deuda (Fiado)

```text
┌──────────┐  Cobro de     ┌──────────┐
│ Pending  │ ────────────→ │   Paid   │
└──────────┘  Mercadería   └──────────┘
```

- Irreversible mediante la UI por parte de Empleados. Un error de pago mal anotado debe solucionarlo el Admin borrando o ajustando el registro.

---

## 12. Reglas de Seguridad Firestore

### 12.1 Pseudocódigo (Protección del Core del Minimarket)

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helpers
    function isLoggedIn() { return request.auth != null; }
    function isAdmin() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'; }

    // --- Users ---
    match /users/{userId} {
      allow read: if isLoggedIn();
      allow write: if isAdmin();
    }

    // --- Products ---
    match /products/{prodId} {
      allow read: if isLoggedIn();
      // Empleados no pueden leer Costos, esto se resuelve omitiendo en Client-Side o usando reglas granulares (Difícil en MVPs basicos, se evalúa confiar en UI hide, o hacer Cloud Function)
      allow create: if isLoggedIn();
      allow update, delete: if isAdmin();
    }

    match /sales/{saleId} {
      // Necesita Auth y una sesión abierta. (Regla compleja para MVP, usualmente se simplifica a isLoggedIn en Rules y validación local)
      allow create: if isLoggedIn();
      allow update: if isAdmin(); // Para marcarlas como Refunded
      allow read: if isAdmin() || resource.data.vendedoraId == request.auth.uid;

      match /items/{itemId} {
         allow create, read: if isLoggedIn();
      }
    }

    // --- Cash Sessions ---
    match /cash_sessions/{sessionId} {
      allow create, update: if isLoggedIn();
      allow read: if isAdmin() || resource.data.employeeId == request.auth.uid;
    }

    // --- Debts / Customers ---
    match /customers/{custId} {
      allow read: if isLoggedIn();
      allow create, update: if isLoggedIn();
      allow delete: if isAdmin();
    }

    match /debts/{debtId} {
       allow create, read, update: if isLoggedIn(); // Update para pasarlo a Paid
       allow delete: if isAdmin();
    }

  }
}
```

---

## 13. Edge Cases y Manejo de Errores

| Escenario                             | Comportamiento                                                                                                                                                                                                                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Intento de Vender sin Stock**       | ⚠️ El sistema advierte, pero **permite** vender dejando stock negativo (Puede ser un error de conteo humano que no debe frenar la caja).                                                                                                                                                               |
| **Doble Código de Barras (Repetido)** | ❌ Error 409. El sistema rechaza crear o actualizar obligando a usar un código distinto.                                                                                                                                                                                                               |
| **Lector Láser Disparando Rápido**    | ⚡ Se implementará un mecanismo de `Debounce/Throttling` en el Input de búsqueda del POS para no ingresar el mismo código 10 veces en 1 milisegundo si el scanner de mano falla o "tiembla".                                                                                                           |
| **Venta en Modo Offline (Red cae)**   | ⚠️ El carrito de ventas actual queda cacheado (Zustand) para no perder los productos marcados. Se permite guardar en IndexedDB temporalmente y sincronizar en background, o se bloquea el final final de transacción hasta tener internet (Dependiendo si el módulo PWA Service Worker se implementa). |
| **Devolución de Producto Vendido**    | 🔧 El Admin selecciona "Anular" en el historial. El servidor lee los `items` de la subcolección y devuelve dinámicamente el `quantity` al `stock` del producto. La Venta queda como `refunded`.                                                                                                        |

---

## 14. Reglas Canónicas (Single Source of Truth)

1. **Inmutabilidad del Ticket (Append-Only):** Una vez que una Venta (`Sale`) es generada, NO se puede editar/mutar la información del ticket, ni de sus productos, ni de sus métodos de pago (para evitar fraudes internos en la caja). Si hay un error, el Administrador debe Anular (`Refund`) el ticket completo, lo cual genera una restitución automática del stock, dejando rastro de trazabilidad y exigiendo refacturar.
2. **Snapshot de Precios Históricos:** Dentro de cada ítem de venta, **siempre** debe guardarse el `priceAtSale`. El historial de tickets o cálculos de ganancia históricas JAMÁS consultan el campo `.price` actual del catálogo `products`, sino el "Snapshot" que quedó congelado en el ticket.
3. **Eventos y Escuchas (Debounce Hardware):** El lector de código de barras físico no emite otra cosa que inputs de teclado muy veloces seguidos de un comando `ENTER`. Se debe sanitizar esos strings con un "Debounce", asegurando que si un láser doble-dispara defectuoso en `10ms`, el sistema solo registre 1 producto y no lo sature.
4. **Múltiples unidades, un solo ID:** El carrito visual del POS consolida los objetos duplicados incrementando `Quantity` en la misma fila (Ej: x8 Leche). En la base de datos se guarda consolidado también.
5. **Permisividad del Mostrador (Flujo Ininterrumpido):** La caja no se puede frenar jamás. Validaciones rígidas tales como `(Stock < 0)` no deben trabar botones de cobro, solo funcionar mediante Alertas Pasivas. El operario humano manda, luego resuelve las fallas logísticas de conteo el Admin.

---

## 15. Decisiones Técnicas Decididas

- **Database:** Firebase Firestore (NoSQL, colecciones limpias).
- **Tablas:** `@tanstack/react-table` (Fundamental para lidiar con cientos de miles de filas de productos fluidamente).
- **UI:** Tailwind CSS v4.
- **State:** Zustand para el estado del Carrito POS.
- **PWA:** Totalmente requerida para uso con celulares en la parte posterior del comercio.

---

## 16. Funcionalidades Post-MVP

Para asegurar una entrega inicial rápida pero sentar las bases de evolución corporativa de Mikabel, el SRD estipula los siguientes agregados a futuro:

1. **Notificaciones Externas Automatizadas:** Al cerrar la caja (Arqueo Z), el sistema disparará un Worker que enviará un resumen ejecutivo (Ventas Efectivo vs Tarjetas, Egresos, Cantidad de tickets y Faltante/Sobrante) por **WhatsApp** o **Email** directo a los dueños. Esto brinda paz mental sin tener que iniciar sesión en el Dashboard para auditar la operatoria de cierre.
2. **Módulo de Gestión de Proveedores:** Reemplazar los Egresos de Caja genéricos (de "Comentario Libre") por un CRUD completo de Proveedores habituales. Conectará cuentas corrientes de marcas, registro de fiados al dueño, y días de visitas. Logrando que el Balance P&L (Profit and Loss) del negocio sea 100% autogestionado en digital.
3. **Escaneo de Facturas OCR (AI):** Carga rápida de stock e ingreso de mercadería tomándole una foto al remito impreso del proveedor desde el celular y reconociendo SKUs y códigos automáticamente.

---

## 17. Glosario de Definiciones

- **POS (Point Of Sale / Punto de Venta):** Terminal o dispositivo operado por un cajero donde el cliente efectúa el pago y se registran las salidas del inventario.
- **Bulk Price / Precio Bulto:** Descuento automático (Estrategia Mayorista) que se activa cuando en el carrito se superan `X` unidades de un producto (Ej: Precio Oferta de Maple, vs Precio por media Docena).
- **Arqueo (Z-Report) / Caja (Session):** Auditoría que compara el dinero físico en las manos del cajero versus el que el sistema dice que debería haber según las ventas en efectivo registradas.
- **Snapshot Price:** Valor numérico impreso en piedra en el ticket que representa el costo exacto del producto el martes pasado, impidiendo que el ticket cambie de precio si el admin aumenta los valores del almacén el miércoles.
- **PWA (Progressive Web App):** App Web que se ejecuta de tal manera en el dispositivo (Instalada en Inicio) que permite ocultar la url del navegador y usar APIs del sistema.
- **Fiado / Libreta de Almacén:** Crédito informal basado en confianza barrial otorgado por el Minimarket de Mikabel donde se anota lo que los vecinos se llevan sin abonar en el momento, para saldar la deuda semanas después (día de cobro salarial, ej: Fin de Quincena).
