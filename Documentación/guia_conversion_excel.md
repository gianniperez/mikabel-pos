# Guía: Conversión de Excel a Mikabel POS JSON

Para pasar tus datos de Excel al archivo `seed-template.json`, el método más rápido es usar una **fórmula de concatenación** directamente en Excel.

## 1. Preparar las columnas

Asegúrate de que tus columnas en Excel estén en este orden (ejemplo):

- **A**: Código
- **B**: Nombre
- **C**: Precio Costo
- **D**: Precio Venta
- **E**: Unidad (unit, kg, 100gr)
- **F**: Stock
- **G**: Stock Mínimo
- **H**: ID Categoría (ej: cat_1)

### 2. La "Fórmula Mágica"

En una nueva columna (ej: columna **K**), pega la siguiente fórmula y arrástrala hacia abajo:

```excel
="{""code"": """ & A2 & """, ""name"": """ & B2 & """, ""brand"": null, ""categoryId"": """ & H2 & """, ""costPrice"": " & C2 & ", ""salePrice"": " & D2 & ", ""bulkPrice"": null, ""bulkQuantity"": null, ""stock"": " & F2 & ", ""minStock"": " & G2 & ", ""quantityUnit"": """ & E2 & """},"
```

### 3. Copiar y Pegar

1. Selecciona todos los resultados de esa columna.
2. Cópialos.
3. Abre el archivo `seed-template.json`.
4. Pégalos dentro del array `"products": [ ... ]`.
5. **Importante**: Borra la última coma del último producto para que el JSON sea válido.

### Tips de Limpieza

- **Precios**: Si tus precios tienen "$" o puntos de miles, quítales el formato en Excel para que queden como números puros (ej: `1500.50`).
- **Unidades**: Usa la función `BUSCARV` o `REEMPLAZAR` para que "Unidades" pase a ser `unit` y "Kilos" pase a ser `kg`.
- **Categorías**: Puedes asignar un ID temporal como `cat_16` (Varios) a todos y luego editarlos en el sistema, o crear la lista de categorías primero en el JSON.
