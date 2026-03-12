# Mikabel POS 📦🚀

## Introducción

**Mikabel POS** es un Punto de Venta (POS) y Gestor de Inventario de grado profesional, diseñado específicamente para resolver las necesidades logísticas de un Minimarket de alta dinámica.

**¿Qué problema resuelve?**
Evita el desfase de precios en góndola, la pérdida de trazabilidad en el control de stock y el caos de las libretas de "fiados" en formato papel. Mikabel POS centraliza la facturación rápida en caja (Zero-Latency), la gestión de turnos/arqueo, el inventario vivo y el control estructurado de deudas (cuentas corrientes de clientes vecinales).

---

## 🌟 Logros del Proyecto (MVP Completo)

- **Zero-Latency Checkout**: Escaneo e impresión instantánea con lectura láser de códigos de barras (EAN-13 e Internos).
- **Inventario Híbrido**: Sincronización en tiempo real entre Firebase y **IndexedDB (Dexie)** para funcionamiento ininterrumpido.
- **Resiliencia Offline**: Algoritmo de sincronización idempotente `usePosSyncLoop` que garantiza que ninguna venta se pierda ante micro-cortes de internet.
- **Gestión de Fiados**: Libreta digital de clientes con historial de deudas y abonos parciales.
- **Reporting & Tickets**: Generación de tickets de venta y reportes de cierre Z personalizados con branding de marca.
- **Seguridad Admin**: Reglas de negocio estrictas (`firestore.rules`) protegiendo precios y stocks críticos.

---

## 🛠️ Stack Tecnológico

- **Next.js 16 (App Router)**: Framework principal para una experiencia fluida.
- **Firebase**: Autenticación, Base de datos (Firestore) y Hosting.
- **Dexie.js**: Gestión de base de datos local para performance extrema.
- **Zustand**: Gestión de estado global (Carrito, Sesiones de Caja).
- **TanStack Query**: Sincronización de datos asíncronos.
- **Tailwind CSS v4**: Diseño premium, limpio y responsivo (Mobile-First).
- **Sonner**: Sistema de notificaciones toast.

## Arquitectura del Proyecto (FSD)

```text
src/
 ├── app/              # Las pantallas o Páginas Web (Rutas)
 ├── components/       # Componentes Genéricos (Botones base, Modales universales)
 ├── features/         # Funcionalidades del negocio (Ej. Login, Checkout)
 ├── hooks/            # Funciones reutilizables generales
 ├── providers/        # Configuraciones globales (React Query y Zustand)
 ├── types/            # Definiciones de TypeScript
 └── utils/            # Funciones matemáticas o formateadores de fechas genéricos
```

---

## 📂 Documentación del Proyecto

Toda la estrategia, objetivos y guías técnicas se encuentran en la carpeta `/Documentación`

---

## 🚀 Instalación y Desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local  # Completar con llaves de Firebase

# 3. Iniciar servidor
npm run dev
```

### Comandos Clave

- `npm run generate`: Generar automáticamente componentes/features bajo arquitectura FSD.
- `npm run build`: Generar build de producción optimizado.
- `npm run test`: Ejecutar suite de pruebas (Vitest).

---

## 🔮 Oportunidades de Mejora (Post-MVP)

- **Business Intelligence**: Monitoreo de salud financiera (Crecimiento de Deuda) y análisis de márgenes netos por categoría.
- **Operaciones AI**: Carga automatizada de stock mediante OCR de facturas de proveedores.
- **Fidelización**: Integración con WhatsApp para recordatorios de deuda y sistema de puntos para clientes frecuentes.
- **Infraestructura**: Soporte para múltiples terminales de cobro y lectura de tickets de balanzas electrónicas.
- **UX Avanzada**: Modo offline robusto 2.0, atajos de teclado personalizables e identificación visual de productos con imágenes.

---

## 🛡️ Calidad de Código

Este proyecto usa **Husky** y **lint-staged** para asegurar que cada línea de código subida al repositorio cumpla con los estándares de calidad y formato definidos.
