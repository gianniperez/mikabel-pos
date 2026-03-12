# Reporte de QA y Auditoría MVP (Fases 1 a 4)

Este documento contiene un escaneo técnico y de producto basado en los flujos principales (Auth, Inventario DEXIE, Turno Activo y Terminal POS Zero-Latency).

---

## 1. Escenarios de Test & Casos de Prueba

### Módulo: Inventario & DEXIE

- **Caso A1:** Dar de alta un producto y verificar que aparezca inmediatamente en `IndexedDB` local sin refrescar el navegador. (Test Pasado teóricamente, depende del observable de liveQuery).
- **Caso A2:** Editar un producto en otra pestaña. El POS Dashboard debe reflejar el nuevo precio/stock gracias al Sync global.
- **Edge Case Identificado:** Si dos administradores editan el mismo producto simultáneamente, gana la última escritura en Firestore, pero ¿qué pasa si el DEXIE de uno de los POS pierde internet durante el pull?
  - _Riesgo:_ Desfase temporal de precios en la caja.

### Módulo: Sesiones de Caja (Turnos)

- **Caso B1:** Bloqueo de POS. Ingresar a `/pos` sin turno abierto -> Debe mostrar overlay de "Caja Cerrada".
- **Caso B2:** Cierre Z. Realizar un cierre declarando menos dinero del contabilizado. El sistema genera el Ticket Z con el flag de `Faltante`.
- **Edge Case Identificado:** Si el usuario desloguea (SignOut Firebase) con un Turno Activo en su LocalStorage (Zustand). ¿Qué sucede cuando otro usuario loguea en esa misma máquina? ¿Hereda el turno en memoria o se blanquea?
  - _Bug Potencial:_ El `useCashSessionStore` persiste en LocalStorage. Si `logout` no emite un `clearSession()`, el siguiente cajero podría operar con el turno de la sesión anterior.

### Módulo: Terminal POS (Zero-Latency)

- **Caso C1:** Bulk Pricing. Agregar 1 ítem (precio normal), agregar 2 más -> El Subtotal salta y muestra flag visual de precio Mayorista. (Validado en el código de `calculateCartTotals`).
- **Caso C2:** Surcharges. Presionar Transferencia (+10%) e inmediatamente "Efectivo" de vuelta. El recargo se debe calcular y descartar al vuelo antes de insertar a Firebase. (Validado tras la corrección del Lint).
- **Edge Case Identificado (Crítico - Condition Race de Sync):**
  En `CheckoutModal.tsx`, al hacer `processTicketSync`, se hace un Fire-And-Forget asíncrono.
  Si falla (ej: micro-corte WiFi), el ticket queda "varado" en el arreglo `syncQueue` de Zustand. Actualmente **no hay ningún mecanismo automático** (cronjob o loop de retry periódico) que re-intente subir los tickets fallidos ni un botón en la UI para forzar el re-intento de los tickets encolados.
  - _Bug Real:_ El stock físico y la contabilidad fiscal del Turno de la Nube no van a coincidir si la PC local apagó el navegador teniendo tickets en la `syncQueue`.

---

## 2. Puntos Ciegos / Mejoras Detectadas (Reporte DT)

1. **Orfandad de Cola Optimista (SyncQueue Leak):**
   - **Problema:** En el POS se priorizó la velocidad visual, encolando los recibos pagados a Firebase. Si el batch write falla (error de red), el ticket se queda guardado en DEXIE/LocalStorage, pero jamas se reintenta subir.
   - **Solución Propuesta:** Implementar un efecto global `usePosSyncLoop` que lea la cola `syncQueue` cada X segundos buscando tickets pendientes, e intente mandarlos si hay conexión `navigator.onLine`. Añadir también un indicador rojo visual (ej: "Hay 2 ventas sin subir") en el Header del POS.

2. **Limpieza del Turno al Desloguear:**
   - **Problema:** Zustand persistido no está amarrado al UID del empleado autenticado por defecto.
   - **Solución Propuesta:** Asegurar de interceptar el hook de `logout` para vaciar Zustand de POS y Sesiones locales.

3. **Descuentos Flexibles de Admin:**
   - **Problema:** Está definida la variable `discount` de dólares fijos en POS, pero en UI de Frontend no hay un componente Input donde el administrador pueda tipear ese descuento global para el ticket.
   - **Solución Propuesta:** Solo visual. Un Popup o Input pequeño abajo del recargo de tarjeta en el Pad que diga "Restar Monto" (discrecional o protegido por rol).

---

### Diagnóstico Final MVP

El sistema es altamente competitivo y funcional para producción bajo condiciones normales. Para declarar la fase de POS "Bulletproof", recomiendaba inyectar al menos el loop automático de re-intento en la cola del carrito.

**[ANEXO POST-FASE 6 - RESOLUCIÓN]**
_Todas las "Oportunidades de Mejora" detectadas en este documento han sido parcheadas rigurosamente:_

- El bug `SyncQueue Leak` fue resuelto inyectando un observador `usePosSyncLoop` global, garantizando inmutabilidad. Funciona en paralelo con el `OfflineBanner` instaurado en la Fase 6.
- El `logout` purga eficientemente el ID de Caja (`persist.clearStorage()`) y la autenticación simultánea.
