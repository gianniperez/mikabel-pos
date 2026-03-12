# 🚀 Post-MVP: Roadmap de Evolución Mikabel POS

Este documento centraliza la visión estratégica para transformar a Mikabel de un POS básico a una plataforma de gestión inteligente 360°. Las ideas se agrupan por impacto en el negocio y viabilidad técnica.

---

## 📊 1. Inteligencia de Negocio & Reportes Pro

_Transformar datos en decisiones para el dueño._

### 📈 Crecimiento de Deuda (Aging & Flow)

- **Concepto**: Monitor de salud financiera que compara `Deuda Emitida` vs `Deuda Cobrada` semanalmente.
- **KPI**: "Índice de Incobrabilidad". Si la brecha crece, el sistema sugiere pausar nuevos fiados a clientes específicos.

### 💰 Margen Neto x Categoría

- **Concepto**: Utilizar el campo `costPrice` (Costo) para calcular la ganancia real.
- **Visualización**: Mapa de calor indicando qué categorías (ej. Bebidas vs Limpieza) dejan más dinero neto, no solo volumen de venta.

### ⚡ Análisis de Horas Pico (Heatmap)

- **Concepto**: Histograma de tickets por hora y día.
- **Utilidad**: Decidir rotación de personal y momentos de reposición de góndola sin interferir con picos de clientes.

---

## 🛒 2. Operativa de Tienda & Logística

_Hacer que el trabajo diario sea más rápido y preciso._

### 🚚 Módulo de Gestión de Proveedores

- **Concepto**: CRUD de proveedores (Coca-Cola, Panadería, etc.) vinculado a los egresos de caja.
- **Funcionalidad**: Control de "Cuentas Corrientes" con proveedores. ¿Cuánto le debemos al distribuidor de lácteos?

### 📸 Carga de Stock mediante OCR (AI)

- **Concepto**: Tomar una foto al remito/factura del proveedor desde el celular.
- **Tecnología**: Google Cloud Vision / Gemini Flash.
- **Resultado**: El sistema reconoce productos y cantidades, actualizando el stock automáticamente sin tipeo manual.

### 📢 Comunicación Directa

- **Concepto**: Un banner en el inicio para que el dueño pueda dejarle mensajes a sus empleadas (ej: "Hoy reponer heladeras" o "¡Buen día!").

### 📝 Registro de Ajustes de Inventario

- **Concepto**: Motivos de cambio de stock fuera de ventas (Rotura, Vencimiento, Consumo Interno).
- **Auditoría**: Reporte mensual de "Pérdida de Mercadería".

### 🔐 Gestión Dinámica de Permisos

- **Concepto**: El administrador puede otorgar permisos temporales o específicos a empleados (ej: permitir edición de un producto específico para corregir stock mal cargado).
- **Seguridad**: Registro de quién otorgó el permiso y para qué acción.

### 📊 Vista de Reposición Urgente (Filtros de Stock)

- **Concepto**: Un botón de "Priorizar Reposición" en el inventario que mueva arriba de todo los productos con stock crítico o bajo el mínimo.
- **Utilidad**: Generar la lista de compras del día en segundos.

---

## 🤝 3. Fidelización & Experiencia del Cliente

_Asegurar que los vecinos siempre prefieran Mikabel._

### 📱 Integración con WhatsApp

- **Recordatorios de Deuda**: Botón en el panel de Deudas para enviar el estado de cuenta por WhatsApp en un click.
- **Promociones del Día**: Envío masivo de ofertas a clientes frecuentes.

### 🎖️ Sistema de Puntos / Club Mikabel

- **Concepto**: Acumulación de puntos por cada $1000 de compra (solo para ventas pagas o deudas saldadas).
- **Incentivo**: Descuentos automáticos en el POS para clientes "Premium".

---

## ⚙️ 4. Infraestructura & Escalabilidad

_Preparar el sistema para más tráfico y mayor seguridad._

### ☁️ Migración a Cloud Functions (Agregaciones)

- **Motivo**: A medida que la colección `sales` crezca, las consultas de reportes en tiempo real serán lentas/caras.
- **Solución**: Funciones de Firebase que actualicen documentos de `stats` diarios/mensuales ante cada venta.

### 🏦 Soporte para Múltiples Cajas

- **Concepto**: Capacidad de tener 2 o 3 terminales cobrando simultáneamente con sesiones de caja independientes por empleado.

### ⚖️ Integración con Balanzas

- **Concepto**: Lectura de tickets de balanza de carnicería/verduría (códigos EAN-13 que incluyen el peso/precio en el barcode).

---

## 🛠️ 5. Deuda Técnica & UI/UX

- **Modo Offline 2.0**: Sincronización robusta mediante Service Workers para operar 100% sin internet durante horas.
- **Atajos de Teclado**: Configuración personalizada de teclas (ej. F4 para "Fiado", F9 para "Cerrar Ticket").
- **Identificación Visual (Imágenes)**: Soporte para fotos de productos en alta resolución para facilitar el reconocimiento visual en el POS, especialmente para productos sin barcode claro.

---

> **Estado del Roadmap:** Evolutivo.
> **Próximo Paso Sugerido:** Implementar el "Crecimiento de Deuda" como primer paso de BI.
