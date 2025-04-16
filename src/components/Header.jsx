"use client"

import { useState, useEffect, useRef } from "react"
import { Download, Calendar, Filter, Moon, Sun, Search, FileUp, X } from "lucide-react"
import "../styles/Header.css"

function Header({
  onExport,
  onOpenDatePicker,
  dateRange,
  onFilterChange,
  activeFilter,
  darkMode,
  onToggleDarkMode,
  onSearch,
  onImport,
  isDataImported,
  availableCategories = [],
}) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)

  // Crear la opción "Todas las categorías" y añadirla a las categorías disponibles
  const filters = [
    { value: "all", label: "Todas las categorías" },
    ...(availableCategories.map((category) => ({ value: category, label: category })) || []),
  ]

  // Datos para sugerencias de búsqueda (productos, categorías, regiones)
  const [searchData, setSearchData] = useState({
    products: [],
    categories: [],
    regions: [],
  })

  // Extraer datos para sugerencias cuando cambian las categorías disponibles
  useEffect(() => {
    if (window.originalData && window.originalData.salesData) {
      // Extraer productos, categorías y regiones únicas
      const products = [...new Set(window.originalData.salesData.map((item) => item.product))].sort()
      const categories = [...new Set(window.originalData.salesData.map((item) => item.category))].sort()
      const regions = [...new Set(window.originalData.salesData.map((item) => item.region))].sort()

      setSearchData({
        products,
        categories,
        regions,
      })
    }
  }, [availableCategories])

  // Cerrar sugerencias al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleFilterSelect = (filter) => {
    onFilterChange(filter)
    setShowFilterDropdown(false)
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchValue(value)

    if (value.trim().length > 0) {
      // Generar sugerencias basadas en el texto de búsqueda
      const query = value.toLowerCase()

      // Buscar coincidencias en productos, categorías y regiones
      const productMatches = searchData.products.filter((product) => product.toLowerCase().includes(query)).slice(0, 3)

      const categoryMatches = searchData.categories
        .filter((category) => category.toLowerCase().includes(query))
        .slice(0, 3)

      const regionMatches = searchData.regions.filter((region) => region.toLowerCase().includes(query)).slice(0, 3)

      // Combinar resultados y limitar a 8 sugerencias
      const allSuggestions = [
        ...productMatches.map((item) => ({ text: item, type: "Producto" })),
        ...categoryMatches.map((item) => ({ text: item, type: "Categoría" })),
        ...regionMatches.map((item) => ({ text: item, type: "Región" })),
      ].slice(0, 8)

      setSuggestions(allSuggestions)
      setShowSuggestions(allSuggestions.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }

    // Debounce para la búsqueda real
    const timer = setTimeout(() => {
      onSearch(value)
    }, 300)

    return () => clearTimeout(timer)
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchValue(suggestion.text)
    onSearch(suggestion.text)
    setShowSuggestions(false)
  }

  const clearSearch = () => {
    setSearchValue("")
    onSearch("")
    setShowSuggestions(false)
  }

  // Formatear fechas para mostrar
  const formatDateRange = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return "Seleccionar fechas"
    }

    const formatDate = (dateStr) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }

    return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
  }

  // Determinar la etiqueta del filtro activo
  const getActiveFilterLabel = () => {
    const activeFilterObj = filters.find((f) => f.value === activeFilter)
    return activeFilterObj ? activeFilterObj.label : "Todas las categorías"
  }

  return (
    <header className={`dashboard-header ${darkMode ? "dark" : ""}`}>
      <div className="header-title">
        <h1>Panel de Análisis de Ventas</h1>
        <p>Estadísticas detalladas y métricas de rendimiento</p>
      </div>

      <div className="header-actions">
        <div className="search-container" ref={searchRef}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar producto, categoría..."
            value={searchValue}
            onChange={handleSearchChange}
          />
          {searchValue && (
            <button
              className="clear-search"
              onClick={clearSearch}
              aria-label="Limpiar búsqueda"
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="suggestion-item" onClick={() => handleSuggestionClick(suggestion)}>
                  <span className="suggestion-text">{suggestion.text}</span>
                  <span className="suggestion-type">{suggestion.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="dropdown-button date-range-button" onClick={onOpenDatePicker} disabled={!isDataImported}>
          <Calendar size={18} />
          <span>{formatDateRange()}</span>
        </button>

        <div className="dropdown-container">
          <button
            className="dropdown-button"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            disabled={!isDataImported}
          >
            <Filter size={18} />
            <span>{getActiveFilterLabel()}</span>
          </button>

          {showFilterDropdown && (
            <div className="dropdown-menu">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  className={activeFilter === filter.value ? "active" : ""}
                  onClick={() => handleFilterSelect(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="icon-button" onClick={() => onExport("csv")} disabled={!isDataImported}>
          <Download size={18} />
          <span>Exportar CSV</span>
        </button>

        <button className="icon-button" onClick={onImport}>
          <FileUp size={18} />
          <span>Importar CSV</span>
        </button>

        <button className="icon-button theme-toggle" onClick={onToggleDarkMode}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}

export default Header
