"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts"
import { Maximize2, RefreshCw, BarChart2, PieChartIcon, LineChartIcon } from "lucide-react"
import "../styles/ChartSection.css"

function ChartSection({ salesData, conversionData, productPerformanceData, salesByDate }) {
  console.log("ChartSection recibió salesByDate:", salesByDate ? salesByDate.length : 0, "registros")

  // Imprimir el primer registro para depuración
  if (salesByDate && salesByDate.length > 0) {
    console.log("Muestra de datos:", salesByDate[0])
  }

  const [activeChart, setActiveChart] = useState("sales")
  const [expandedChart, setExpandedChart] = useState(null)
  const [chartType, setChartType] = useState({
    sales: "line",
    categories: "pie",
    products: "bar",
  })

  // Estado para forzar re-renderizado
  const [key, setKey] = useState(0)

  // Forzar re-renderizado cuando cambian los datos
  useEffect(() => {
    setKey((prev) => prev + 1)
  }, [salesByDate, conversionData, productPerformanceData])

  const chartTypes = [
    { id: "sales", label: "Ventas por Día", color: "#4f46e5" },
    { id: "categories", label: "Ventas por Categoría", color: "#10b981" },
    { id: "products", label: "Rendimiento de Productos", color: "#f59e0b" },
  ]

  const handleRefresh = (chartId) => {
    console.log(`Actualizando gráfico ${chartId}`)
    setKey((prev) => prev + 1)
  }

  const toggleExpand = (chartId) => {
    setExpandedChart(expandedChart === chartId ? null : chartId)
  }

  const toggleChartType = (chartId) => {
    const types = {
      line: "bar",
      bar: "line",
      pie: "bar",
    }

    setChartType((prev) => ({
      ...prev,
      [chartId]: types[prev[chartId]] || "line",
    }))
  }

  // Crear datos de ejemplo para asegurar que el gráfico siempre muestre algo
  const createDebugData = () => {
    const today = new Date()
    const data = []

    // Generar datos para los últimos 30 días
    for (let i = 30; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)

      data.push({
        date: date.toISOString().split("T")[0],
        revenue: Math.floor(Math.random() * 10000) + 1000,
        units: Math.floor(Math.random() * 100) + 10,
        transactions: Math.floor(Math.random() * 50) + 5,
      })
    }

    return data
  }

  const renderSalesChart = () => {
    // Usar los datos procesados de salesByDate si están disponibles, o crear datos de ejemplo
    let chartData = []

    if (salesByDate && Array.isArray(salesByDate) && salesByDate.length > 0) {
      console.log("Usando datos reales para el gráfico de ventas:", salesByDate.length, "registros")
      chartData = salesByDate
    } else {
      console.log("No hay datos reales disponibles, usando datos de ejemplo")
      chartData = createDebugData()
    }

    if (chartData.length === 0) {
      return <div className="no-data-message">No hay datos disponibles para el período seleccionado</div>
    }

    // Implementación simplificada basada en la versión anterior que funcionaba
    if (chartType.sales === "line") {
      return (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                stroke="#888"
                tickFormatter={(value) => {
                  try {
                    const date = new Date(value)
                    return date.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                    })
                  } catch (error) {
                    return value
                  }
                }}
              />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value, name) => {
                  // Corregir las etiquetas del tooltip
                  if (name === "revenue") return [`${value.toFixed(2)} €`, "Ingresos"]
                  if (name === "units") return [value, "Unidades"]
                  if (name === "transactions") return [value, "Transacciones"]
                  return [value, name]
                }}
                labelFormatter={(label) => {
                  try {
                    const date = new Date(label)
                    return date.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  } catch (error) {
                    return label
                  }
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Ingresos"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="units"
                name="Unidades"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="transactions"
                name="Transacciones"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )
    } else {
      return (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                stroke="#888"
                tickFormatter={(value) => {
                  try {
                    const date = new Date(value)
                    return date.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                    })
                  } catch (error) {
                    return value
                  }
                }}
              />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value, name) => {
                  // Corregir las etiquetas del tooltip
                  if (name === "revenue") return [`${value.toFixed(2)} €`, "Ingresos"]
                  if (name === "units") return [value, "Unidades"]
                  if (name === "transactions") return [value, "Transacciones"]
                  return [value, name]
                }}
              />
              <Legend />
              <Bar dataKey="revenue" name="Ingresos" fill="#4f46e5" barSize={20} />
              <Bar dataKey="units" name="Unidades" fill="#10b981" barSize={20} />
              <Bar dataKey="transactions" name="Transacciones" fill="#f59e0b" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )
    }
  }

  const COLORS = [
    "#4f46e5",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f43f5e",
    "#6366f1",
  ]

  const renderCategoriesChart = () => {
    if (!conversionData || conversionData.length === 0) {
      return <div className="no-data-message">No hay datos disponibles para el período seleccionado</div>
    }

    if (chartType.categories === "pie") {
      return (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={conversionData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {conversionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value, name, props) => [
                  `${value} unidades (${(props.percent * 100).toFixed(1)}%)`,
                  props.payload.name,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )
    } else {
      return (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="name"
                stroke="#888"
                label={{ value: "Categoría", position: "insideBottomRight", offset: -5 }}
              />
              <YAxis stroke="#888" label={{ value: "Unidades vendidas", angle: -90, position: "insideLeft" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value) => [`${value} unidades`, "Ventas"]}
              />
              <Legend />
              <Bar dataKey="value" name="Unidades vendidas" fill="#10b981">
                {conversionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <LabelList dataKey="value" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )
    }
  }

  const renderProductsChart = () => {
    if (!productPerformanceData || productPerformanceData.length === 0) {
      return <div className="no-data-message">No hay datos disponibles para el período seleccionado</div>
    }

    // Asegurarse de que los datos estén formateados correctamente
    const formattedData = productPerformanceData.map((item) => ({
      ...item,
      revenue: Number(item.revenue),
      units: Number(item.units),
    }))

    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={formattedData} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              type="number"
              stroke="#888"
              label={{ value: "Ingresos (€)", position: "insideBottomRight", offset: -5 }}
            />
            <YAxis type="category" dataKey="name" stroke="#888" width={120} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                border: "none",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value, name) => {
                // Corregir las etiquetas del tooltip
                if (name === "revenue") return [`${value.toFixed(2)} €`, "Ingresos"]
                if (name === "units") return [value, "Unidades"]
                return [value, name]
              }}
            />
            <Legend />
            <Bar dataKey="revenue" name="Ingresos" fill="#f59e0b">
              <LabelList dataKey="revenue" position="right" formatter={(value) => `${value.toFixed(2)} €`} />
            </Bar>
            <Bar dataKey="units" name="Unidades" fill="#4f46e5">
              <LabelList dataKey="units" position="right" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderChart = (chartId) => {
    switch (chartId) {
      case "sales":
        return renderSalesChart()
      case "categories":
        return renderCategoriesChart()
      case "products":
        return renderProductsChart()
      default:
        return null
    }
  }

  const renderChartTypeToggle = (chartId) => {
    if (chartId === "sales") {
      return (
        <button onClick={() => toggleChartType(chartId)}>
          {chartType[chartId] === "line" ? <BarChart2 size={16} /> : <LineChartIcon size={16} />}
        </button>
      )
    } else if (chartId === "categories") {
      return (
        <button onClick={() => toggleChartType(chartId)}>
          {chartType[chartId] === "pie" ? <BarChart2 size={16} /> : <PieChartIcon size={16} />}
        </button>
      )
    }
    return null
  }

  return (
    <div className={`chart-section ${expandedChart ? "expanded" : ""}`} key={key}>
      {!expandedChart ? (
        <>
          <div className="chart-tabs">
            {chartTypes.map((chart) => (
              <button
                key={chart.id}
                className={`chart-tab ${activeChart === chart.id ? "active" : ""}`}
                onClick={() => setActiveChart(chart.id)}
                style={{
                  "--tab-color": chart.color,
                  borderBottom: activeChart === chart.id ? `2px solid ${chart.color}` : "none",
                }}
              >
                {chart.label}
              </button>
            ))}
          </div>

          <div className="chart-container">
            <div className="chart-header">
              <h3>{chartTypes.find((c) => c.id === activeChart)?.label}</h3>
              <div className="chart-actions">
                {renderChartTypeToggle(activeChart)}
                <button onClick={() => handleRefresh(activeChart)}>
                  <RefreshCw size={16} />
                </button>
                <button onClick={() => toggleExpand(activeChart)}>
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>
            {renderChart(activeChart)}
          </div>
        </>
      ) : (
        <div className="expanded-chart">
          <div className="chart-header">
            <h3>{chartTypes.find((c) => c.id === expandedChart)?.label}</h3>
            <div className="chart-actions">
              {renderChartTypeToggle(expandedChart)}
              <button onClick={() => handleRefresh(expandedChart)}>
                <RefreshCw size={16} />
              </button>
              <button onClick={() => toggleExpand(expandedChart)}>
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
          {renderChart(expandedChart)}
        </div>
      )}
    </div>
  )
}

export default ChartSection
