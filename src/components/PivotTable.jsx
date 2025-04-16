"use client"

import { useState, useEffect } from "react"
import { Download } from "lucide-react"
import "../styles/PivotTable.css"

function PivotTable({ data, darkMode }) {
  const [rowField, setRowField] = useState("category")
  const [columnField, setColumnField] = useState("region")
  const [valueField, setValueField] = useState("quantity")
  const [aggregation, setAggregation] = useState("sum")
  const [pivotData, setPivotData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Detectar campos disponibles en los datos
  const availableFields =
    data && data.salesData && data.salesData.length > 0
      ? Object.keys(data.salesData[0]).filter((field) => !["id", "total"].includes(field))
      : []

  const numericFields =
    data && data.salesData && data.salesData.length > 0
      ? availableFields.filter(
          (field) =>
            typeof data.salesData[0][field] === "number" || !isNaN(Number.parseFloat(data.salesData[0][field])),
        )
      : []

  const dimensionFields =
    data && data.salesData && data.salesData.length > 0
      ? availableFields.filter((field) => !numericFields.includes(field) && field !== "date")
      : []

  // Generar datos de la tabla dinámica cuando cambian los campos o datos
  useEffect(() => {
    if (!data || !data.salesData || data.salesData.length === 0) return

    setIsLoading(true)

    // Simular procesamiento para mostrar el estado de carga
    setTimeout(() => {
      // Obtener valores únicos para filas y columnas
      const rowValues = [...new Set(data.salesData.map((item) => item[rowField]))].sort()
      const columnValues = [...new Set(data.salesData.map((item) => item[columnField]))].sort()

      // Crear estructura de datos para la tabla dinámica
      const pivotResult = {
        rowValues,
        columnValues,
        data: {},
        totals: {
          rows: {},
          columns: {},
          grand: 0,
        },
      }

      // Inicializar estructura de datos
      rowValues.forEach((row) => {
        pivotResult.data[row] = {}
        pivotResult.totals.rows[row] = 0

        columnValues.forEach((col) => {
          pivotResult.data[row][col] = 0
        })
      })

      // Inicializar totales de columnas
      columnValues.forEach((col) => {
        pivotResult.totals.columns[col] = 0
      })

      // Calcular valores para cada celda
      data.salesData.forEach((sale) => {
        const rowValue = sale[rowField]
        const colValue = sale[columnField]
        const value = Number.parseFloat(sale[valueField]) || 0

        // Asegurarse de que existen las estructuras necesarias
        if (pivotResult.data[rowValue] && columnValues.includes(colValue)) {
          // Aplicar la agregación seleccionada
          if (aggregation === "sum") {
            pivotResult.data[rowValue][colValue] += value
            pivotResult.totals.rows[rowValue] += value
            pivotResult.totals.columns[colValue] += value
            pivotResult.totals.grand += value
          } else if (aggregation === "count") {
            pivotResult.data[rowValue][colValue] += 1
            pivotResult.totals.rows[rowValue] += 1
            pivotResult.totals.columns[colValue] += 1
            pivotResult.totals.grand += 1
          } else if (aggregation === "avg") {
            // Para promedios, necesitamos almacenar suma y conteo
            if (!pivotResult.sums) {
              pivotResult.sums = {}
              pivotResult.counts = {}
              rowValues.forEach((r) => {
                pivotResult.sums[r] = {}
                pivotResult.counts[r] = {}
                columnValues.forEach((c) => {
                  pivotResult.sums[r][c] = 0
                  pivotResult.counts[r][c] = 0
                })
              })
            }

            pivotResult.sums[rowValue][colValue] += value
            pivotResult.counts[rowValue][colValue] += 1

            // Calcular promedio
            pivotResult.data[rowValue][colValue] =
              pivotResult.counts[rowValue][colValue] > 0
                ? pivotResult.sums[rowValue][colValue] / pivotResult.counts[rowValue][colValue]
                : 0
          }
        }
      })

      // Si es promedio, calcular los totales correctamente
      if (aggregation === "avg") {
        // Calcular promedios para totales de filas
        rowValues.forEach((row) => {
          let rowSum = 0
          let rowCount = 0
          columnValues.forEach((col) => {
            rowSum += pivotResult.sums[row][col]
            rowCount += pivotResult.counts[row][col]
          })
          pivotResult.totals.rows[row] = rowCount > 0 ? rowSum / rowCount : 0
        })

        // Calcular promedios para totales de columnas
        columnValues.forEach((col) => {
          let colSum = 0
          let colCount = 0
          rowValues.forEach((row) => {
            colSum += pivotResult.sums[row][col]
            colCount += pivotResult.counts[row][col]
          })
          pivotResult.totals.columns[col] = colCount > 0 ? colSum / colCount : 0
        })

        // Calcular promedio general
        let grandSum = 0
        let grandCount = 0
        rowValues.forEach((row) => {
          columnValues.forEach((col) => {
            grandSum += pivotResult.sums[row][col]
            grandCount += pivotResult.counts[row][col]
          })
        })
        pivotResult.totals.grand = grandCount > 0 ? grandSum / grandCount : 0
      }

      setPivotData(pivotResult)
      setIsLoading(false)
    }, 300)
  }, [data, rowField, columnField, valueField, aggregation])

  const handleExportCSV = () => {
    if (!pivotData) return

    // Crear contenido CSV
    let csvContent = "data:text/csv;charset=utf-8,"

    // Encabezados
    csvContent += `${rowField.toUpperCase()} / ${columnField.toUpperCase()},`
    pivotData.columnValues.forEach((col) => {
      csvContent += `${col},`
    })
    csvContent += "TOTAL\n"

    // Datos
    pivotData.rowValues.forEach((row) => {
      csvContent += `${row},`
      pivotData.columnValues.forEach((col) => {
        const value = formatValue(pivotData.data[row][col])
        csvContent += `${value},`
      })
      csvContent += `${formatValue(pivotData.totals.rows[row])}\n`
    })

    // Totales
    csvContent += "TOTAL,"
    pivotData.columnValues.forEach((col) => {
      csvContent += `${formatValue(pivotData.totals.columns[col])},`
    })
    csvContent += `${formatValue(pivotData.totals.grand)}\n`

    // Crear enlace de descarga
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "tabla_dinamica.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatValue = (value) => {
    if (typeof value !== "number") return value

    if (valueField === "price" || valueField === "total" || valueField === "revenue") {
      return value.toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }

    if (aggregation === "avg") {
      return value.toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }

    return value.toLocaleString("es-ES")
  }

  const getFieldDisplayName = (field) => {
    const displayNames = {
      product: "Producto",
      category: "Categoría",
      region: "Región",
      date: "Fecha",
      customerId: "Cliente",
      quantity: "Cantidad",
      price: "Precio",
      total: "Total",
      revenue: "Ingresos",
    }

    return displayNames[field] || field.charAt(0).toUpperCase() + field.slice(1)
  }

  const getAggregationDisplayName = (agg) => {
    const displayNames = {
      sum: "Suma",
      count: "Conteo",
      avg: "Promedio",
    }

    return displayNames[agg] || agg
  }

  const getValueFieldSuffix = () => {
    if (valueField === "price" || valueField === "total" || valueField === "revenue") {
      return " €"
    }
    return ""
  }

  if (!data || !data.salesData || data.salesData.length === 0) {
    return (
      <div className={`pivot-table-container ${darkMode ? "dark" : ""}`}>
        <div className="pivot-table-message">
          <p>No hay datos disponibles para crear la tabla dinámica.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`pivot-table-container ${darkMode ? "dark" : ""}`}>
      <div className="pivot-table-header">
        <h3>Tabla Dinámica</h3>
        <div className="pivot-table-actions">
          <button className="pivot-action" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      <div className="simple-field-selector">
        <div className="field-selector-item">
          <label>Filas:</label>
          <select value={rowField} onChange={(e) => setRowField(e.target.value)}>
            {dimensionFields.map((field) => (
              <option key={field} value={field}>
                {getFieldDisplayName(field)}
              </option>
            ))}
          </select>
        </div>

        <div className="field-selector-item">
          <label>Columnas:</label>
          <select value={columnField} onChange={(e) => setColumnField(e.target.value)}>
            {dimensionFields.map((field) => (
              <option key={field} value={field}>
                {getFieldDisplayName(field)}
              </option>
            ))}
          </select>
        </div>

        <div className="field-selector-item">
          <label>Valores:</label>
          <select value={valueField} onChange={(e) => setValueField(e.target.value)}>
            {numericFields.map((field) => (
              <option key={field} value={field}>
                {getFieldDisplayName(field)}
              </option>
            ))}
          </select>
        </div>

        <div className="field-selector-item">
          <label>Agregación:</label>
          <select value={aggregation} onChange={(e) => setAggregation(e.target.value)}>
            <option value="sum">Suma</option>
            <option value="count">Conteo</option>
            <option value="avg">Promedio</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="pivot-loading">
          <div className="pivot-spinner"></div>
          <p>Generando tabla dinámica...</p>
        </div>
      ) : pivotData ? (
        <div className="pivot-table-wrapper">
          <table className="pivot-table">
            <thead>
              <tr>
                <th className="corner-header">
                  {getFieldDisplayName(rowField)} / {getFieldDisplayName(columnField)}
                </th>
                {pivotData.columnValues.map((col) => (
                  <th key={col} className="column-header">
                    {col}
                  </th>
                ))}
                <th className="total-header">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {pivotData.rowValues.map((row) => (
                <tr key={row}>
                  <th className="row-header">{row}</th>
                  {pivotData.columnValues.map((col) => (
                    <td key={`${row}-${col}`} className="data-cell">
                      {formatValue(pivotData.data[row][col])}
                      {getValueFieldSuffix()}
                    </td>
                  ))}
                  <td className="row-total">
                    {formatValue(pivotData.totals.rows[row])}
                    {getValueFieldSuffix()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th className="total-label">TOTAL</th>
                {pivotData.columnValues.map((col) => (
                  <td key={`total-${col}`} className="column-total">
                    {formatValue(pivotData.totals.columns[col])}
                    {getValueFieldSuffix()}
                  </td>
                ))}
                <td className="grand-total">
                  {formatValue(pivotData.totals.grand)}
                  {getValueFieldSuffix()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="pivot-table-message">
          <p>Selecciona los campos para generar la tabla dinámica.</p>
        </div>
      )}
    </div>
  )
}

export default PivotTable
