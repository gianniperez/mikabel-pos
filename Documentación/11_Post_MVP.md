# 🚀 Post-MVP: Roadmap de Evolución Mikabel POS

Este documento centraliza la visión estratégica para transformar a Mikabel de un POS básico a una plataforma de gestión inteligente 360°. Las ideas se agrupan por impacto en el negocio y viabilidad técnica.

---

## 📊 1. Inteligencia de Negocio & Reportes Pro

_Transformar datos en decisiones para el dueño._

### 📈 Crecimiento de Deuda (Aging & Flow)

- **Concepto**: Monitor de salud financiera que compara `Deuda Emitida` vs `Deuda Cobrada` semanalmente.
- **KPI**: "Índice de Incobrabilidad". Si la brecha crece, el sistema sugiere pausar nuevos fiados a clientes específicos.
- **Estado**: ⏳ Pendiente

### ✅ Margen Neto x Categoría — **Implementado (15/03/2026)**

- **Concepto**: Utilizar el campo `costPrice` (Costo) para calcular la ganancia real.
- **Implementación**: Se extendió `CashSession` con `totalCost`. El cierre de caja acumula el costo de los productos vendidos. Los reportes ahora muestran el margen neto real.

### ✅ Análisis de Horas Pico (Heatmap) — **Implementado (15/03/2026)**

- **Concepto**: Histograma de tickets por hora y día.
- **Implementación**: Gráfico de barras visible en `/reports` con rango configurable 8:00–23:00 hs.

---

## 🛒 2. Operativa de Tienda & Logística

_Hacer que el trabajo diario sea más rápido y preciso._

### ✅ Módulo de Gestión de Proveedores — **Implementado (15/03/2026)**

- **Concepto**: CRUD de proveedores (Coca-Cola, Panadería, etc.) vinculado a los egresos de caja.
- **Implementación**: Nueva sección `/suppliers` con registro de compras/pagos (efectivo, transferencia, tarjeta, fiado) y panel de deudas pendientes por distribuidor.

### ✅ Comunicación Directa (Mensajes al Personal) — **Implementado**

- **Concepto**: Un banner en el inicio para que el dueño pueda dejarle mensajes a sus empleadas.

### ✅ Registro de Ajustes de Inventario (Control de Pérdidas) — **Implementado (15/03/2026)**

- **Concepto**: Motivos de cambio de stock fuera de ventas (Rotura, Vencimiento, Consumo Interno).
- **Implementación**: `StockAdjustmentModal` con selección de motivo y observaciones. Requiere PIN de admin para empleadas.

### ✅ Gestión Dinámica de Permisos — **Implementado (15/03/2026)**

- **Concepto**: El administrador puede otorgar permisos temporales o específicos a empleados.
- **Implementación**: `UserPermissionModal` en `/users`. Permisos: `edit_stock`, `edit_prices`, `edit_product`, `delete_customer`, `view_reports`, `view_suppliers`.

### ✅ Vista de Reposición Urgente (Filtros de Stock) — **Implementado (15/03/2026)**

- **Concepto**: Un botón de "Priorizar Reposición" que mueva arriba los productos con stock crítico.
- **Implementación**: Filtro en el inventario que ordena por `stock <= minStock` primero.

### ✅ Identificación Visual (Fotos de Productos) — **Implementado (15/03/2026)**

- **Concepto**: Soporte para fotos de productos para facilitar el reconocimiento visual en el POS.
- **Implementación**: Componente `ProductImage` con `next/image`, carga diferida, y placeholder `ImageOff`. Upload via Cloudinary. Visible en Inventario (miniatura) y POS (tarjeta 1:1).

---

## 🤝 3. Fidelización & Experiencia del Cliente

_Asegurar que los vecinos siempre prefieran Mikabel._

### 📱 Integración con WhatsApp

- **Recordatorios de Deuda**: Botón en el panel de Deudas para enviar el estado de cuenta por WhatsApp en un click.
- **Estado**: ⏳ Pendiente

### 🎖️ Sistema de Puntos / Club Mikabel

- **Concepto**: Acumulación de puntos por cada $1000 de compra.
- **Estado**: ⏳ Pendiente

---

## ⚙️ 4. Infraestructura & Escalabilidad

_Preparar el sistema para más tráfico y mayor seguridad._

### ☁️ Migración a Cloud Functions (Agregaciones)

- **Motivo**: A medida que la colección `sales` crezca, las consultas de reportes en tiempo real serán lentas/caras.
- **Solución**: Funciones de Firebase que actualicen documentos de `stats` diarios/mensuales ante cada venta.
- **Estado**: ⏳ Pendiente

### ✅ Soporte para Múltiples Cajas — **Implementado**

- **Concepto**: Capacidad de tener 2 o 3 terminales cobrando simultáneamente con sesiones independientes por empleado.

### ⚖️ Integración con Balanzas

- **Concepto**: Lectura de tickets de balanza de carnicería/verduría (códigos EAN-13).
- **Estado**: ❌ Descartado (baja prioridad)

---

## 🛠️ 5. Deuda Técnica & UI/UX

- **Modo Offline 2.0**: Sincronización robusta mediante Service Workers para operar 100% sin internet durante horas.
- **Atajos de Teclado**: Configuración personalizada de teclas (ej. F4 para "Fiado", F9 para "Cerrar Ticket").

---

> **Estado del Roadmap:** Evolutivo. Última actualización: 15/03/2026.
> **Próximo Paso Sugerido:** Implementar "Crecimiento de Deuda" (Monitor de Salud Financiera de Clientes).
