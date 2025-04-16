"use client"

import { useState, useEffect } from "react"
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react"
import "../styles/AdvancedFilters.css"

function AdvancedFilters({ data, onFilterChange, activeFilters, darkMode }) {
  const [availableFilters, setAvailableFilters] = useState({})
  const [expandedSections, setExpandedSections] = useState({})
  // Modificar para que esté siempre visible por defecto
  const [showFilters, setShowFilters] = useState(true)

  // Extraer propiedades disponibles para filtrar del conjunto de datos
  useEffect(() => {
    if (!data || !data.salesData || data.salesData.length === 0) {
      setAvailableFilters({})
      return
    }

    // Obtener todas las propiedades únicas para cada campo filtrable
    const filters = {}
    const sampleSale = data.salesData[0]

    // Determinar qué campos son filtrables (excluir campos numéricos como id, quantity, price)
    const filterableFields = Object.keys(sampleSale).filter(
      (field) => !["id", "quantity", "price", "total"].includes(field) && typeof sampleSale[field] !== "number",
    )

    // Para cada campo filtrable, obtener valores únicos
    filterableFields.forEach((field) => {
      const uniqueValues = [...new Set(data.salesData.map((sale) => sale[field]))]
        .filter((value) => value !== undefined && value !== null && value !== "")
        .sort()

      if (uniqueValues.length > 0) {
        filters[field] = uniqueValues
      }
    })

    setAvailableFilters(filters)

    // Inicializar secciones expandidas
    const initialExpandedState = {}
    Object.keys(filters).forEach((field) => {
      initialExpandedState[field] = true // Inicialmente expandidas
    })
    setExpandedSections(initialExpandedState)
  }, [data])

  const toggleSection = (field) => {
    setExpandedSections((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleFilterSelect = (field, value) => {
    const newFilters = { ...activeFilters }

    if (!newFilters[field]) {
      newFilters[field] = [value]
    } else if (newFilters[field].includes(value)) {
      newFilters[field] = newFilters[field].filter((v) => v !== value)
      if (newFilters[field].length === 0) {
        delete newFilters[field]
      }
    } else {
      newFilters[field] = [...newFilters[field], value]
    }

    onFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    onFilterChange({})
  }

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, values) => count + values.length, 0)
  }

  const toggleFiltersVisibility = () => {
    setShowFilters(!showFilters)
  }

  // Si no hay datos o filtros disponibles, no mostrar nada
  if (Object.keys(availableFilters).length === 0) {
    return null
  }

  return (
    <div className={`advanced-filters-container ${darkMode ? "dark" : ""}`}>
      <div className="filters-header">
        <button className="toggle-filters-button" onClick={toggleFiltersVisibility}>
          <Filter size={16} />
          <span>Filtros avanzados</span>
          {getActiveFilterCount() > 0 && <span className="filter-count">{getActiveFilterCount()}</span>}
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {getActiveFilterCount() > 0 && (
          <button className="clear-filters-button" onClick={clearAllFilters}>
            <X size={14} />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {showFilters && (
        <div className="filters-content-rows">
          {Object.entries(availableFilters).map(([field, values]) => (
            <div key={field} className="filter-section-row">
              <div className="filter-section-header" onClick={() => toggleSection(field)}>
                <h4>{getFieldDisplayName(field)}</h4>
                {expandedSections[field] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {expandedSections[field] && (
                <div className="filter-options-row">
                  {values.map((value) => (
                    <label key={value} className="filter-option">
                      <input
                        type="checkbox"
                        checked={activeFilters[field]?.includes(value) || false}
                        onChange={() => handleFilterSelect(field, value)}
                      />
                      <span>{value}</span>
                      {activeFilters[field]?.includes(value) && (
                        <span className="filter-count">
                          {data.salesData.filter((sale) => sale[field] === value).length}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {getActiveFilterCount() > 0 && (
        <div className="active-filters">
          <h4>Filtros activos:</h4>
          <div className="active-filter-tags">
            {Object.entries(activeFilters).map(([field, values]) =>
              values.map((value) => (
                <div key={`${field}-${value}`} className="filter-tag">
                  <span>
                    {getFieldDisplayName(field)}: {value}
                  </span>
                  <button onClick={() => handleFilterSelect(field, value)}>
                    <X size={12} />
                  </button>
                </div>
              )),
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Función para obtener nombres más amigables para los campos
function getFieldDisplayName(field) {
  const displayNames = {
    product: "Producto",
    category: "Categoría",
    region: "Región",
    date: "Fecha",
    customerId: "Cliente",
  }

  return displayNames[field] || field.charAt(0).toUpperCase() + field.slice(1)
}

export default AdvancedFilters
