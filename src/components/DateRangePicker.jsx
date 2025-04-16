"use client"

import { useState, useEffect } from "react"
import { X, Calendar, Check } from "lucide-react"
import "../styles/DateRangePicker.css"

function DateRangePicker({ startDate, endDate, onApply, onCancel, darkMode }) {
  const [localStartDate, setLocalStartDate] = useState(startDate || "")
  const [localEndDate, setLocalEndDate] = useState(endDate || "")
  const [error, setError] = useState("")

  // Actualizar fechas locales cuando cambian las props
  useEffect(() => {
    setLocalStartDate(startDate || "")
    setLocalEndDate(endDate || "")
  }, [startDate, endDate])

  const handleApply = () => {
    // Validar que ambas fechas estén seleccionadas
    if (!localStartDate || !localEndDate) {
      setError("Por favor selecciona ambas fechas")
      return
    }

    // Validar que la fecha de inicio sea anterior a la fecha de fin
    if (new Date(localStartDate) > new Date(localEndDate)) {
      setError("La fecha de inicio debe ser anterior a la fecha de fin")
      return
    }

    onApply(localStartDate, localEndDate)
  }

  // Función para formatear fecha para mostrar
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="date-picker-overlay">
      <div className={`date-picker-modal ${darkMode ? "dark" : ""}`}>
        <div className="date-picker-header">
          <h2>Seleccionar rango de fechas</h2>
          <button className="close-button" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div className="date-picker-content">
          <div className="date-inputs">
            <div className="date-input-group">
              <label htmlFor="start-date">Fecha de inicio</label>
              <div className="date-input-container">
                <Calendar size={16} />
                <input
                  type="date"
                  id="start-date"
                  value={localStartDate}
                  onChange={(e) => {
                    setLocalStartDate(e.target.value)
                    setError("")
                  }}
                />
              </div>
              {localStartDate && <div className="date-display">{formatDateForDisplay(localStartDate)}</div>}
            </div>

            <div className="date-input-group">
              <label htmlFor="end-date">Fecha de fin</label>
              <div className="date-input-container">
                <Calendar size={16} />
                <input
                  type="date"
                  id="end-date"
                  value={localEndDate}
                  onChange={(e) => {
                    setLocalEndDate(e.target.value)
                    setError("")
                  }}
                />
              </div>
              {localEndDate && <div className="date-display">{formatDateForDisplay(localEndDate)}</div>}
            </div>
          </div>

          {error && <p className="date-picker-error">{error}</p>}

          <div className="date-picker-presets">
            <h3>Rangos predefinidos</h3>
            <div className="preset-buttons">
              <button
                onClick={() => {
                  const today = new Date()
                  const lastWeek = new Date()
                  lastWeek.setDate(today.getDate() - 7)

                  setLocalStartDate(lastWeek.toISOString().split("T")[0])
                  setLocalEndDate(today.toISOString().split("T")[0])
                  setError("")
                }}
              >
                Última semana
              </button>

              <button
                onClick={() => {
                  const today = new Date()
                  const lastMonth = new Date()
                  lastMonth.setMonth(today.getMonth() - 1)

                  setLocalStartDate(lastMonth.toISOString().split("T")[0])
                  setLocalEndDate(today.toISOString().split("T")[0])
                  setError("")
                }}
              >
                Último mes
              </button>

              <button
                onClick={() => {
                  const today = new Date()
                  const lastYear = new Date()
                  lastYear.setFullYear(today.getFullYear() - 1)

                  setLocalStartDate(lastYear.toISOString().split("T")[0])
                  setLocalEndDate(today.toISOString().split("T")[0])
                  setError("")
                }}
              >
                Último año
              </button>

              <button
                onClick={() => {
                  // Mostrar todos los datos disponibles
                  setLocalStartDate("2000-01-01")
                  setLocalEndDate("2100-12-31")
                  setError("")
                }}
              >
                Todos los datos
              </button>
            </div>
          </div>
        </div>

        <div className="date-picker-footer">
          <button className="cancel-button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="apply-button" onClick={handleApply}>
            <Check size={16} />
            Aplicar filtro
          </button>
        </div>
      </div>
    </div>
  )
}

export default DateRangePicker
