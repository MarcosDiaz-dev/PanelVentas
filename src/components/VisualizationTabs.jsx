"use client"

import { useState } from "react"
import { BarChart2, Table, Grid3X3, RefreshCw, Download } from "lucide-react"
import ChartSection from "./ChartSection"
import DataTable from "./DataTable"
import PivotTable from "./PivotTable"
import "../styles/VisualizationTabs.css"

function VisualizationTabs({ data, darkMode, onExport }) {
  // Cambiar el orden de las pestañas y establecer "pivot" como la pestaña activa por defecto
  const [activeTab, setActiveTab] = useState("pivot")

  const renderTabContent = () => {
    // Añadir logs para depuración
    console.log("Renderizando contenido de pestaña:", activeTab, {
      salesData: data.salesData ? data.salesData.length : 0,
      salesByDate: data.salesByDate ? data.salesByDate.length : 0,
      tableData: data.tableData ? data.tableData.length : 0,
      conversionData: data.conversionData ? data.conversionData.length : 0,
      productPerformanceData: data.productPerformanceData ? data.productPerformanceData.length : 0,
    })

    switch (activeTab) {
      case "pivot":
        return <PivotTable data={data} darkMode={darkMode} />
      case "table":
        return <DataTable data={data.tableData} detailedData={data.detailedTableData} onExport={onExport} />
      case "charts":
        return (
          <ChartSection
            salesData={data.salesData}
            conversionData={data.conversionData}
            productPerformanceData={data.productPerformanceData}
            salesByDate={data.salesByDate}
          />
        )
      default:
        return <div>Contenido no disponible</div>
    }
  }

  return (
    <div className={`visualization-container ${darkMode ? "dark" : ""}`}>
      <div className="visualization-header">
        <div className="tabs-container">
          {/* Cambiar el orden de las pestañas: Tabla Dinámica, Tabla de Datos, Gráficos */}
          <button
            className={`tab-button ${activeTab === "pivot" ? "active" : ""}`}
            onClick={() => setActiveTab("pivot")}
          >
            <Grid3X3 size={18} />
            <span>Tabla Dinámica</span>
          </button>
          <button
            className={`tab-button ${activeTab === "table" ? "active" : ""}`}
            onClick={() => setActiveTab("table")}
          >
            <Table size={18} />
            <span>Tabla de Datos</span>
          </button>
          <button
            className={`tab-button ${activeTab === "charts" ? "active" : ""}`}
            onClick={() => setActiveTab("charts")}
          >
            <BarChart2 size={18} />
            <span>Gráficos</span>
          </button>
        </div>
        <div className="visualization-actions">
          <button className="action-button" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            <span>Actualizar</span>
          </button>
          <button className="action-button" onClick={() => onExport("csv")}>
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      <div className="visualization-content">{renderTabContent()}</div>
    </div>
  )
}

export default VisualizationTabs
