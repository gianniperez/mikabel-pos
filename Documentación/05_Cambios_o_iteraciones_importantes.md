# Cambios o Iteraciones Importantes

📝 _Registro histórico (log) de pivotes, cambios de alcance, decisiones arquitectónicas o ajustes estratégicos._

---

## [15/03/2026] - Bloque Post-MVP: Gestión Avanzada e Inteligencia de Negocio

- **Descripción del cambio:** Se implementaron 7 mejoras Post-MVP en una sola sesión de trabajo intensivo, elevando el sistema de un POS básico a una plataforma de gestión integral para minimarket.
- **Justificación:** Las mejoras priorizadas responden a necesidades operativas reales del negocio (control de pérdidas, rentabilidad, gestión de proveedores) identificadas durante el piloto inicial.
- **Impacto:** Se extiende el alcance del sistema significativamente. Requirió actualizar el modelo de datos (`CashSession` con `totalCost`), la interfaz de permisos (`UserPermissions` con `view_suppliers`) y agregar tres nuevas rutas de navegación (`/suppliers`, `/reports` reforzado, `/inventory` con filtros avanzados).

### Detalle de Cambios

1. **🔐 Control Fino de Permisos** (`UserPermissionModal`): El dueño puede habilitar/deshabilitar permisos específicos a cada empleada desde `/users`, con efecto inmediato en la UI y sin necesidad de cambiar roles completos.

2. **📦 Prioridad de Reposición** (`InventoryTable`): Filtro inteligente en el inventario que ordena primero los productos con stock crítico (`stock <= minStock`). Facilita la lista de compras diaria.

3. **📝 Control de Pérdidas** (`StockAdjustmentModal`): Registro formal de movimientos de stock negativos (Rotura, Vencimiento, Consumo Interno) con motivo y descripción. Requiere PIN de admin para empleadas.

4. **💰 Ganancia Real (Margen Neto)** (`/reports`): Se agregó el campo `totalCost` al modelo `CashSession`. El cierre de caja acumula el costo de cada producto vendido, permitiendo calcular el margen neto real en los reportes.

5. **🚚 Gestión de Proveedores** (`/suppliers`): Nueva sección completa con CRUD de proveedores, registro de pagos/compras (efectivo, transferencia, tarjeta o fiado) y panel de deudas pendientes por distribuidor. Integrado con los egresos de caja (`cash_movements`).

6. **⚡ Análisis de Horas Pico** (`/reports`): Histograma de ventas por hora con rango configurable de 8:00 a 23:00 (horario del negocio). Ayuda a decidir turnos y momentos de reposición.

7. **🖼️ Fotos de Productos** (`ProductImage`, Cloudinary): Componente reutilizable con carga lazy (`next/image`) y placeholder `ImageOff`. Upload via widget oficial de Cloudinary. Visible en Inventario (thumbnails) y Terminal POS (tarjetas cuadradas 1:1).

---

## [15/03/2026] - Correcciones de TypeScript para Vercel

- **Descripción del cambio:** Se corrigieron 4 errores de compilación que bloqueaban el despliegue en Vercel tras las nuevas features.
- **Justificación:** Vercel aplica verificación de tipos estricta en producción, más estricta que el servidor de desarrollo local.
- **Impacto:** Sin impacto funcional. Los cambios fueron: agregar `view_suppliers` a los permisos por defecto en `AuthProvider`, inicializar `totalCost: 0` en `OpenSessionModal`, y restaurar `// @ts-ignore` en los resolvers de Zod de los formularios con `react-hook-form`.
