"use client"

import { useState, useEffect } from "react"
import Header from "./Header"
import MetricCards from "./MetricCards"
import FileImport from "./FileImport"
import DateRangePicker from "./DateRangePicker"
import { processImportedData, filterByDateRange, filterBySearch, filterByCategory } from "../utils/dataUtils"
import "../styles/Dashboard.css"
import VisualizationTabs from "./VisualizationTabs"

function Dashboard() {
  // Estado para los datos originales y filtrados
  const [originalData, setOriginalData] = useState(null)
  const [filteredData, setFilteredData] = useState(null)

  // Estado para los filtros
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all") // Por defecto "all" (todas las categorías)
  const [searchQuery, setSearchQuery] = useState("")

  // Estado para categorías disponibles
  const [availableCategories, setAvailableCategories] = useState([])

  // Estado para la UI
  const [darkMode, setDarkMode] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [isDataImported, setIsDataImported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Cargar preferencia de modo oscuro al iniciar
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true"
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.body.classList.add("dark-mode")
    } else {
      document.body.classList.remove("dark-mode")
    }
  }, [])

  // Aplicar filtros cuando cambian los datos o filtros
  useEffect(() => {
    if (!originalData) return

    setIsLoading(true)

    // Usar setTimeout para simular procesamiento y mostrar el estado de carga
    setTimeout(() => {
      try {
        let result = { ...originalData }

        // Filtrar por rango de fechas
        if (dateRange.startDate && dateRange.endDate) {
          console.log("Aplicando filtro de fechas:", dateRange.startDate, "a", dateRange.endDate)
          result = filterByDateRange(result, dateRange.startDate, dateRange.endDate)
        }

        // Filtrar por categoría (solo si no es "all")
        if (activeFilter !== "all") {
          console.log("Aplicando filtro de categoría:", activeFilter)
          result = filterByCategory(
            result,
            activeFilter,
            dateRange.startDate || "2000-01-01",
            dateRange.endDate || "2100-12-31",
          )
        }

        // Filtrar por búsqueda
        if (searchQuery) {
          console.log("Aplicando filtro de búsqueda:", searchQuery)
          result = filterBySearch(
            result,
            searchQuery,
            dateRange.startDate || "2000-01-01",
            dateRange.endDate || "2100-12-31",
          )
        }

        console.log("Datos filtrados:", {
          salesData: result.salesData ? result.salesData.length : 0,
          salesByDate: result.salesByDate ? result.salesByDate.length : 0,
          tableData: result.tableData ? result.tableData.length : 0,
        })

        setFilteredData(result)
        setIsLoading(false)
      } catch (error) {
        console.error("Error al aplicar filtros:", error)
        setIsLoading(false)
      }
    }, 300)
  }, [originalData, dateRange, searchQuery, activeFilter])

  const handleDateRangeChange = (startDate, endDate) => {
    setDateRange({ startDate, endDate })
    setShowDatePicker(false)
  }

  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem("darkMode", newDarkMode)
    document.body.classList.toggle("dark-mode")
  }

  const handleExportData = (format) => {
    if (!filteredData || !filteredData.salesData) return

    if (format === "csv") {
      // Exportar datos de ventas como CSV
      const headers = [
        "ID_Venta",
        "Fecha",
        "Producto",
        "Categoría",
        "Cantidad",
        "Precio_Unitario",
        "Cliente_ID",
        "Region",
        "Total",
      ]

      let csvContent = headers.join(",") + "\n"

      filteredData.salesData.forEach((sale) => {
        const values = [
          sale.id,
          sale.date,
          `"${sale.product.replace(/"/g, '""')}"`, // Escapar comillas
          `"${sale.category.replace(/"/g, '""')}"`,
          sale.quantity,
          sale.price,
          sale.customerId,
          `"${sale.region.replace(/"/g, '""')}"`,
          sale.total,
        ]
        csvContent += values.join(",") + "\n"
      })

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", "datos_ventas.csv")
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleImportedData = (importedData) => {
    setIsLoading(true)
    console.log("Datos importados recibidos:", importedData.length, "registros")

    // Simular procesamiento para mostrar el estado de carga
    setTimeout(() => {
      try {
        // Procesar los datos importados
        const processedData = processImportedData(importedData)
        console.log("Datos procesados:", processedData)

        // Verificar que salesByDate se haya generado correctamente
        if (processedData && (!processedData.salesByDate || processedData.salesByDate.length === 0)) {
          console.warn("No se generaron datos para el gráfico de ventas diarias")
        } else {
          console.log(
            "Datos para el gráfico de ventas diarias generados:",
            processedData.salesByDate ? processedData.salesByDate.length : 0,
            "registros",
          )
        }

        // Extraer categorías únicas del archivo importado
        const uniqueCategories = [...new Set(importedData.map((item) => item.category))]
          .filter((category) => category && category.trim() !== "")
          .sort()

        setAvailableCategories(uniqueCategories)

        // Establecer "Todas las categorías" como filtro activo por defecto
        setActiveFilter("all")

        // Actualizar los datos originales
        setOriginalData(processedData)

        // Guardar datos en window para acceso desde otros componentes (para sugerencias de búsqueda)
        window.originalData = processedData

        setIsDataImported(true)
        setShowImport(false)

        // Establecer rango de fechas automáticamente basado en los datos
        if (processedData.salesData && processedData.salesData.length > 0) {
          const dates = processedData.salesData.map((sale) => new Date(sale.date))
          const minDate = new Date(Math.min(...dates))
          const maxDate = new Date(Math.max(...dates))

          console.log(
            "Rango de fechas detectado:",
            minDate.toISOString().split("T")[0],
            "a",
            maxDate.toISOString().split("T")[0],
          )

          setDateRange({
            startDate: minDate.toISOString().split("T")[0],
            endDate: maxDate.toISOString().split("T")[0],
          })
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error al procesar los datos importados:", error)
        setIsLoading(false)
        // Mostrar algún mensaje de error al usuario
      }
    }, 800)
  }

  // Si no hay datos importados, mostrar mensaje para importar
  if (!isDataImported && !showImport) {
    return (
      <div className={`dashboard-container ${darkMode ? "dark-mode" : ""}`}>
        <main className="dashboard-main">
          <Header
            onExport={handleExportData}
            onOpenDatePicker={() => setShowDatePicker(true)}
            dateRange={dateRange}
            onFilterChange={handleFilterChange}
            activeFilter={activeFilter}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            onSearch={handleSearch}
            onImport={() => setShowImport(true)}
            isDataImported={isDataImported}
            availableCategories={availableCategories}
          />
          <div className="dashboard-content">
            <div className="import-prompt">
              <div className="import-prompt-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 8V16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 12H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2>No hay datos para analizar</h2>
              <p>Importa un archivo CSV o Excel para comenzar a analizar tus datos de ventas.</p>
              <button className="import-button" onClick={() => setShowImport(true)}>
                Importar Datos
              </button>
            </div>
          </div>
        </main>

        {showImport && (
          <FileImport onClose={() => setShowImport(false)} onImport={handleImportedData} darkMode={darkMode} />
        )}
      </div>
    )
  }

  return (
    <div className={`dashboard-container ${darkMode ? "dark-mode" : ""}`}>
      <main className="dashboard-main">
        <Header
          onExport={handleExportData}
          onOpenDatePicker={() => setShowDatePicker(true)}
          dateRange={dateRange}
          onFilterChange={handleFilterChange}
          activeFilter={activeFilter}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          onSearch={handleSearch}
          onImport={() => setShowImport(true)}
          isDataImported={isDataImported}
          availableCategories={availableCategories}
        />
        <div className="dashboard-content">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando datos...</p>
            </div>
          ) : filteredData ? (
            <>
              <MetricCards data={filteredData.metrics} />
              <VisualizationTabs data={filteredData} darkMode={darkMode} onExport={handleExportData} />
            </>
          ) : (
            <div className="no-data-message">No hay datos disponibles.</div>
          )}
        </div>
      </main>

      {showImport && (
        <FileImport onClose={() => setShowImport(false)} onImport={handleImportedData} darkMode={darkMode} />
      )}

      {showDatePicker && (
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onApply={handleDateRangeChange}
          onCancel={() => setShowDatePicker(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  )
}

export default Dashboard
