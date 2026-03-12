# Plan de Migración: Excel a Seed JSON

Este plan detalla cómo transformar los datos del sistema actual (Excel) al formato compatible con el sembrado de datos (`seed-template.json`) de Mikabel POS.

## Mapeo de Campos

A continuación se detalla la relación entre las columnas de tu Excel y los campos del sistema:

| Campo Excel              | Campo JSON     | Tipo   | Notas                                              |
| :----------------------- | :------------- | :----- | :------------------------------------------------- |
| **Codigo (A)**           | `code`         | String | EAN13 o código interno.                            |
| **Nombre (B)**           | `name`         | String | Nombre descriptivo del producto.                   |
| **Precio de Costo (C)**  | `costPrice`    | Number | Precio pagado al proveedor.                        |
| **Precio de Venta (D)**  | `salePrice`    | Number | Precio de góndola.                                 |
| **Unidad de medida (E)** | `quantityUnit` | Enum   | Debe ser: `"unit"`, `"kg"` o `"100gr"`.            |
| **Stock (F)**            | `stock`        | Number | Cantidad actual en inventario.                     |
| **Stock mínimo (G)**     | `minStock`     | Number | Alerta de reposición.                              |
| **Categoría (H)**        | `categoryId`   | String | Debe coincidir con un ID de la lista `categories`. |

> [!NOTE]
> Los campos **Proveedor**, **Ubicación** y **Stock Máximo** no son utilizados actualmente por el sistema y pueden ser ignorados en la conversión.

## Cambios Propuestos

### [Documentación]

#### [MODIFY] [seed-template.json](file:///c:/Users/giann/Documents/Gianni/Prog/Proyectos/mikabel-pos/Documentación/seed-template.json)

- Corregir IDs duplicados en la lista de categorías (ej. múltiples `cat_4`).
- Agregar el campo `brand` (opcional) a la estructura para permitir mayor detalle si el usuario decide extraerlo del nombre.
- Asegurar que `bulkQuantity` esté presente si se usa `bulkPrice`.

## Estrategia de Conversión

Recomiendo uno de los siguientes métodos:

1. **Fórmulas de Excel**: Crear una columna adicional en Excel que concatene los valores en formato JSON.
2. **Conversión CSV to JSON**: Exportar a CSV y usar una herramienta online, mapeando manualmente las columnas.

## Plan de Verificación

### Verificación Manual

1. **Validación de Tipos**: Asegurar que todos los precios y stocks sean números (sin "$" ni comas de miles).
2. **Validación de Categorías**: Confirmar que cada `categoryId` en los productos exista en la lista superior de `categories`.
3. **Carga Inicial**: Intentar cargar el JSON generado en el sistema y verificar que los productos aparezcan en la tabla de inventario.
