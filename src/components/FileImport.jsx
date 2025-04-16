"use client"

import { useState, useRef } from "react"
import { X, Upload, FileText, Check, AlertCircle } from "lucide-react"
import * as XLSX from "xlsx"
import "../styles/FileImport.css"
import { ensureCorrectEncoding } from "../utils/characterEncoding"

function FileImport({ onClose, onImport, darkMode }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [error, setError] = useState("")
  const [parsedData, setParsedData] = useState(null)
  const [columnMapping, setColumnMapping] = useState({
    id: "",
    date: "",
    product: "",
    category: "",
    quantity: "",
    price: "",
    customerId: "",
    region: "",
  })
  const [showMapping, setShowMapping] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Check if file is Excel or CSV
    const fileExtension = selectedFile.name.split(".").pop().toLowerCase()
    if (!["xlsx", "xls", "csv"].includes(fileExtension)) {
      setError("Por favor selecciona un archivo Excel o CSV válido")
      return
    }

    setFile(selectedFile)
    setError("")
    parseFile(selectedFile)
  }

  // Asegurar que la importación de archivos maneje correctamente los caracteres especiales
  const parseFile = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let jsonData = []
        const fileExtension = file.name.split(".").pop().toLowerCase()

        if (fileExtension === "csv") {
          // Parse CSV with proper encoding
          const csvText = e.target.result
          const lines = csvText.toString().split(/\r\n|\n/)

          // Get headers from first line
          const headers = lines[0].split(",").map((header) =>
            // Remove quotes if present and ensure correct encoding
            ensureCorrectEncoding(header.replace(/^"(.*)"$/, "$1").trim()),
          )

          // Parse data rows
          jsonData = lines
            .slice(1)
            .filter((line) => line.trim())
            .map((line) => {
              // Handle quoted fields with commas inside
              const values = []
              let inQuote = false
              let currentValue = ""

              for (let i = 0; i < line.length; i++) {
                const char = line[i]

                if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
                  inQuote = !inQuote
                } else if (char === "," && !inQuote) {
                  values.push(currentValue)
                  currentValue = ""
                } else {
                  currentValue += char
                }
              }

              // Add the last value
              values.push(currentValue)

              // Create object with headers
              const row = {}
              headers.forEach((header, index) => {
                // Remove quotes if present and ensure correct encoding
                let value = values[index] || ""
                value = ensureCorrectEncoding(value.replace(/^"(.*)"$/, "$1"))
                row[header] = value
              })

              return row
            })
        } else {
          // Parse Excel with proper encoding
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: "array", codepage: 65001 }) // UTF-8 codepage
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]

          // Ensure all cell values are properly encoded
          jsonData = XLSX.utils.sheet_to_json(firstSheet).map((row) => {
            const encodedRow = {}
            Object.keys(row).forEach((key) => {
              const encodedKey = ensureCorrectEncoding(key)
              encodedRow[encodedKey] = typeof row[key] === "string" ? ensureCorrectEncoding(row[key]) : row[key]
            })
            return encodedRow
          })
        }

        if (jsonData.length === 0) {
          setError("El archivo no contiene datos")
          return
        }

        // Preview first 5 rows
        const previewData = jsonData.slice(0, 5)
        const headers = Object.keys(jsonData[0])

        // Auto-detect column mappings
        const newMapping = autoDetectColumns(headers, jsonData)
        setColumnMapping(newMapping)

        setParsedData(jsonData)
        setPreview({
          headers,
          rows: previewData,
        })

        // Show mapping interface if we couldn't auto-detect all columns
        const missingMappings = Object.values(newMapping).includes("")
        setShowMapping(missingMappings)
      } catch (err) {
        console.error("Error parsing file:", err)
        setError("Error al procesar el archivo. Asegúrate de que es un archivo válido.")
      }
    }

    if (file.name.endsWith(".csv")) {
      reader.readAsText(file, "UTF-8") // Especificar codificación UTF-8
    } else {
      reader.readAsArrayBuffer(file)
    }
  }

  // Auto-detect columns based on headers and sample data
  const autoDetectColumns = (headers, data) => {
    const mapping = {
      id: "",
      date: "",
      product: "",
      category: "",
      quantity: "",
      price: "",
      customerId: "",
      region: "",
    }

    // Common column names for each field
    const columnPatterns = {
      id: [/id/i, /código/i, /code/i, /venta/i, /sale/i, /ID_Venta/i],
      date: [/fecha/i, /date/i, /día/i, /day/i],
      product: [/producto/i, /product/i, /artículo/i, /item/i, /nombre/i, /name/i],
      category: [/categoría/i, /category/i, /tipo/i, /type/i],
      quantity: [/cantidad/i, /quantity/i, /unidades/i, /units/i, /qty/i],
      price: [/precio/i, /price/i, /valor/i, /value/i, /costo/i, /cost/i, /Precio_Unitario/i],
      customerId: [/cliente/i, /customer/i, /comprador/i, /buyer/i, /Cliente_ID/i],
      region: [/región/i, /region/i, /zona/i, /area/i, /ubicación/i, /location/i, /Regiones-venta/i],
    }

    // Try to match headers with patterns
    headers.forEach((header) => {
      for (const [field, patterns] of Object.entries(columnPatterns)) {
        if (mapping[field] === "" && patterns.some((pattern) => pattern.test(header))) {
          mapping[field] = header
          break
        }
      }
    })

    // For numeric fields, try to detect by checking data type
    if (mapping.quantity === "" || mapping.price === "") {
      const numericColumns = headers.filter((header) => {
        return data.slice(0, 5).every((row) => {
          const value = row[header]
          return !isNaN(Number.parseFloat(value)) && isFinite(value)
        })
      })

      if (mapping.quantity === "" && numericColumns.length > 0) {
        // Find a column that likely contains integers
        const quantityCol = numericColumns.find((col) =>
          data.slice(0, 10).every((row) => Number.isInteger(Number.parseFloat(row[col]))),
        )
        if (quantityCol) mapping.quantity = quantityCol
      }

      if (mapping.price === "" && numericColumns.length > 0) {
        // Find a column with decimal values that's not quantity
        const priceCol = numericColumns.find(
          (col) =>
            col !== mapping.quantity && data.slice(0, 10).some((row) => !Number.isInteger(Number.parseFloat(row[col]))),
        )
        if (priceCol) mapping.price = priceCol
      }
    }

    return mapping
  }

  const handleMappingChange = (field, columnName) => {
    setColumnMapping({
      ...columnMapping,
      [field]: columnName,
    })
  }

  const handleImport = () => {
    if (!parsedData) {
      setError("No hay datos para importar")
      return
    }

    // Map the data using the column mapping
    const mappedData = parsedData.map((row, index) => {
      const mappedRow = {}

      // For each field in our mapping
      Object.entries(columnMapping).forEach(([field, columnName]) => {
        if (columnName) {
          // If we have a mapping, use it and ensure correct encoding
          mappedRow[field] =
            typeof row[columnName] === "string" ? ensureCorrectEncoding(row[columnName]) : row[columnName]
        } else {
          // If no mapping, use default values
          switch (field) {
            case "id":
              mappedRow[field] = index + 1
              break
            case "date":
              mappedRow[field] = new Date().toISOString().split("T")[0]
              break
            case "product":
              mappedRow[field] = "Producto sin especificar"
              break
            case "category":
              mappedRow[field] = "Sin categoría"
              break
            case "quantity":
              mappedRow[field] = 1
              break
            case "price":
              mappedRow[field] = 0
              break
            case "customerId":
              mappedRow[field] = "C" + (index + 100)
              break
            case "region":
              mappedRow[field] = "Sin región"
              break
            default:
              mappedRow[field] = ""
          }
        }
      })

      return mappedRow
    })

    onImport(mappedData)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      parseFile(droppedFile)
    }
  }

  const renderColumnMappingUI = () => {
    if (!preview.headers) return null

    return (
      <div className={`column-mapping ${darkMode ? "dark" : ""}`}>
        <h3>Mapeo de Columnas</h3>
        <p>Por favor, selecciona qué columna corresponde a cada campo requerido:</p>

        <div className="mapping-fields">
          {Object.entries(columnMapping).map(([field, selectedColumn]) => (
            <div key={field} className="mapping-field">
              <label>
                {getFieldLabel(field)}:
                <select
                  value={selectedColumn}
                  onChange={(e) => handleMappingChange(field, e.target.value)}
                  className={!selectedColumn ? "highlight" : ""}
                >
                  <option value="">-- No seleccionado --</option>
                  {preview.headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>

        <div className="mapping-info">
          <AlertCircle size={16} />
          <span>Los campos sin mapear usarán valores predeterminados</span>
        </div>
      </div>
    )
  }

  const getFieldLabel = (field) => {
    const labels = {
      id: "ID de Venta",
      date: "Fecha",
      product: "Producto",
      category: "Categoría",
      quantity: "Cantidad",
      price: "Precio",
      customerId: "ID de Cliente",
      region: "Región",
    }
    return labels[field] || field
  }

  return (
    <div className="file-import-overlay">
      <div className={`file-import-modal ${darkMode ? "dark" : ""}`}>
        <div className="file-import-header">
          <h2>Importar Datos</h2>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="file-import-content">
          {!file ? (
            <div className="file-drop-zone" onDragOver={handleDragOver} onDrop={handleDrop}>
              <Upload size={48} />
              <p>Arrastra y suelta un archivo Excel o CSV aquí</p>
              <p className="file-drop-subtitle">o</p>
              <button className="file-select-button" onClick={() => fileInputRef.current.click()}>
                Seleccionar archivo
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
              />
            </div>
          ) : (
            <div className="file-preview">
              <div className="file-info">
                <FileText size={24} />
                <div>
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>

              {preview.headers && preview.rows && (
                <>
                  <div className="data-preview">
                    <h3>Vista previa de datos</h3>
                    <div className="table-preview-container">
                      <table className="table-preview">
                        <thead>
                          <tr>
                            {preview.headers.map((header, index) => (
                              <th key={index}>{header || `Columna ${index + 1}`}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {preview.headers.map((header, cellIndex) => (
                                <td key={cellIndex}>{row[header]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {showMapping && renderColumnMappingUI()}
                </>
              )}

              {error && <p className="error-message">{error}</p>}
            </div>
          )}
        </div>

        <div className="file-import-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="import-button" onClick={handleImport} disabled={!file || !!error}>
            <Check size={16} />
            Importar datos
          </button>
        </div>
      </div>
    </div>
  )
}

export default FileImport
