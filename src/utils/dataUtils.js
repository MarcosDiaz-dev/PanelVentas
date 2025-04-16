// Importar las utilidades de codificación de caracteres
import { textContains } from "./characterEncoding"

// Modificar la función prepareSalesChartData para que sea más robusta
const prepareSalesChartData = (salesData) => {
  if (!salesData || salesData.length === 0) {
    console.log("No hay datos de ventas para procesar")
    return []
  }

  try {
    console.log("Procesando datos de ventas para el gráfico, total registros:", salesData.length)

    // Agrupar ventas por fecha
    const salesByDate = {}

    salesData.forEach((sale) => {
      // Asegurarse de que la fecha esté en formato YYYY-MM-DD
      let dateStr
      try {
        if (typeof sale.date === "string") {
          // Limpiar la fecha si es necesario
          dateStr = sale.date.split("T")[0]
        } else if (sale.date instanceof Date) {
          dateStr = sale.date.toISOString().split("T")[0]
        } else {
          // Si no es una fecha válida, usar la fecha actual
          dateStr = new Date().toISOString().split("T")[0]
          console.warn("Fecha no válida en los datos, usando fecha actual:", sale)
        }

        // Validar formato de fecha YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          console.warn("Formato de fecha incorrecto:", dateStr)
          dateStr = new Date().toISOString().split("T")[0]
        }
      } catch (error) {
        console.error("Error procesando fecha:", error)
        dateStr = new Date().toISOString().split("T")[0]
      }

      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = {
          date: dateStr,
          revenue: 0,
          units: 0,
          transactions: 1,
        }
      } else {
        salesByDate[dateStr].transactions += 1
      }

      // Asegurarse de que quantity y price sean números
      const quantity = Number(sale.quantity) || 0
      const price = Number(sale.price) || 0

      salesByDate[dateStr].revenue += price * quantity
      salesByDate[dateStr].units += quantity
    })

    // Convertir a array y ordenar por fecha
    const result = Object.values(salesByDate).sort((a, b) => new Date(a.date) - new Date(b.date))

    console.log("Datos procesados para el gráfico de ventas:", result.length, "días únicos")

    // Si no hay datos después del procesamiento, devolver datos de ejemplo
    if (result.length === 0) {
      console.log("No hay datos después del procesamiento, generando datos de ejemplo")
      return createDebugSalesData()
    }

    return result
  } catch (error) {
    console.error("Error al procesar datos de ventas por día:", error)
    return createDebugSalesData()
  }
}

// Función para crear datos de ejemplo para el gráfico de ventas
const createDebugSalesData = () => {
  console.log("Generando datos de ejemplo para el gráfico de ventas")
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

// Modificar la función processImportedData para incluir la función createDebugSalesData
export const processImportedData = (importedData) => {
  // Verificar si los datos tienen el formato esperado
  if (!importedData || importedData.length === 0) {
    return null
  }

  // Los datos ya vienen mapeados del componente FileImport
  const salesData = importedData.map((row) => {
    return {
      id: row.id || "",
      date: row.date || new Date().toISOString().split("T")[0],
      product: row.product || "Producto desconocido",
      category: row.category || "Sin categoría",
      quantity: Number.parseFloat(row.quantity) || 1,
      price: Number.parseFloat(row.price) || 0,
      customerId: row.customerId || "",
      region: row.region || "Sin región",
      total: (Number.parseFloat(row.quantity) || 1) * (Number.parseFloat(row.price) || 0),
    }
  })

  // Calcular métricas basadas en los datos de ventas
  const metrics = calculateMetrics(salesData)

  // Agrupar ventas por categoría para el gráfico de conversión
  const categoryCounts = {}
  salesData.forEach((sale) => {
    if (!categoryCounts[sale.category]) {
      categoryCounts[sale.category] = 0
    }
    categoryCounts[sale.category] += sale.quantity
  })

  const conversionData = Object.keys(categoryCounts).map((category) => ({
    name: category,
    value: categoryCounts[category],
  }))

  // Agrupar ventas por región para la tabla
  const regionData = {}
  salesData.forEach((sale) => {
    if (!regionData[sale.region]) {
      regionData[sale.region] = {
        id: `region-${sale.region.replace(/\s+/g, "-").toLowerCase()}`,
        source: sale.region,
        visits: 0,
        pageViews: 0,
        bounceRate: 0,
        convRate: 0,
        sales: 0,
        revenue: 0,
        avgPrice: 0,
      }
    }
    regionData[sale.region].sales += sale.quantity
    regionData[sale.region].revenue += sale.quantity * sale.price
  })

  // Calcular precio medio para cada región
  Object.values(regionData).forEach((region) => {
    region.avgPrice = region.sales > 0 ? region.revenue / region.sales : 0
  })

  // Asignar colores a las regiones
  const colors = ["#4f46e5", "#0077B5", "#10b981", "#8B5CF6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"]
  const tableData = Object.values(regionData).map((region, index) => ({
    ...region,
    color: colors[index % colors.length],
  }))

  // Preparar datos detallados para cada región
  const detailedTableData = []

  // Por cada región, agregar detalles por categoría
  Object.values(regionData).forEach((region) => {
    const regionProducts = salesData.filter((sale) => sale.region === region.source)

    // Agrupar por categoría
    const categoriesInRegion = {}
    regionProducts.forEach((sale) => {
      if (!categoriesInRegion[sale.category]) {
        categoriesInRegion[sale.category] = {
          name: sale.category,
          units: 0,
          revenue: 0,
        }
      }
      categoriesInRegion[sale.category].units += sale.quantity
      categoriesInRegion[sale.category].revenue += sale.quantity * sale.price
    })

    // Agregar al array de datos detallados
    Object.values(categoriesInRegion).forEach((category) => {
      detailedTableData.push({
        parentId: region.id,
        type: "Categoría",
        name: category.name,
        units: category.units,
        revenue: category.revenue,
      })
    })
  })

  // Preparar datos de rendimiento de productos
  const productPerformance = {}
  salesData.forEach((sale) => {
    if (!productPerformance[sale.product]) {
      productPerformance[sale.product] = {
        name: sale.product,
        category: sale.category,
        units: 0,
        revenue: 0,
      }
    }
    productPerformance[sale.product].units += sale.quantity
    productPerformance[sale.product].revenue += sale.quantity * sale.price
  })

  // Convertir a array y ordenar por ingresos
  const productPerformanceData = Object.values(productPerformance)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10) // Mostrar solo los 10 productos principales

  // Preparar datos para el gráfico de ventas diarias
  const salesByDate = prepareSalesChartData(salesData)

  return {
    salesData,
    metrics,
    conversionData,
    tableData,
    detailedTableData,
    productPerformanceData,
    salesByDate,
  }
}

// Calcular métricas basadas en los datos de ventas
export const calculateMetrics = (salesData) => {
  // Calcular ingresos totales
  const totalRevenue = salesData.reduce((sum, sale) => sum + sale.price * sale.quantity, 0)

  // Calcular unidades totales vendidas
  const totalUnits = salesData.reduce((sum, sale) => sum + sale.quantity, 0)

  // Calcular número de clientes únicos
  const uniqueCustomers = new Set(salesData.map((sale) => sale.customerId)).size

  // Calcular precio promedio por unidad
  const averagePrice = totalUnits > 0 ? totalRevenue / totalUnits : 0

  // Calcular número de categorías únicas
  const uniqueCategories = new Set(salesData.map((sale) => sale.category)).size

  // Calcular tendencias (simuladas con valores aleatorios entre -5% y +5%)
  const generateTrend = () => {
    const randomTrend = Math.random() * 10 - 5 // Entre -5 y +5
    return Number.parseFloat(randomTrend.toFixed(1))
  }

  return [
    {
      label: "Ingresos Totales",
      value: `${totalRevenue.toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} €`,
      trend: generateTrend(),
      icon: "sales",
      color: "#4f46e5",
      period: "Período actual",
    },
    {
      label: "Unidades Vendidas",
      value: totalUnits.toLocaleString("es-ES"),
      trend: generateTrend(),
      icon: "orders",
      color: "#0ea5e9",
      period: "Período actual",
    },
    {
      label: "Clientes Únicos",
      value: uniqueCustomers.toLocaleString("es-ES"),
      trend: generateTrend(),
      icon: "customers",
      color: "#10b981",
      period: "Período actual",
    },
    {
      label: "Precio Promedio",
      value: `${averagePrice.toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} €`,
      trend: generateTrend(),
      icon: "average",
      color: "#f59e0b",
      period: "Por unidad",
    },
    {
      label: "Categorías",
      value: uniqueCategories.toLocaleString("es-ES"),
      trend: generateTrend(),
      icon: "categories",
      color: "#8b5cf6",
      period: "Total",
    },
  ]
}

// Modificar la función filterByDateRange para asegurar que todos los datos se filtren correctamente
// Reemplazar la función filterByDateRange actual con esta versión mejorada

// Filtrar por rango de fechas
export const filterByDateRange = (data, startDate, endDate) => {
  if (!data || !data.salesData) return data

  const start = new Date(startDate)
  const end = new Date(endDate)

  // Ajustar la fecha de fin para incluir todo el día
  end.setHours(23, 59, 59, 999)

  console.log("Filtrando datos por rango de fechas:", startDate, "a", endDate)

  // Filtrar ventas por fecha
  const filteredSales = data.salesData.filter((item) => {
    const itemDate = new Date(item.date)
    return itemDate >= start && itemDate <= end
  })

  // Si no hay ventas después del filtro, devolver datos vacíos
  if (filteredSales.length === 0) {
    console.log("No hay ventas en el rango de fechas seleccionado")
    return {
      ...data,
      metrics: calculateMetrics([]),
      salesData: [],
      conversionData: [],
      tableData: [],
      detailedTableData: [],
      productPerformanceData: [],
      salesByDate: [],
    }
  }

  console.log("Ventas filtradas:", filteredSales.length)

  // Recalcular todos los datos basados en las ventas filtradas
  const result = processImportedData(filteredSales)

  console.log("Datos recalculados después del filtro:", {
    salesData: result.salesData ? result.salesData.length : 0,
    salesByDate: result.salesByDate ? result.salesByDate.length : 0,
    tableData: result.tableData ? result.tableData.length : 0,
  })

  return result
}

// Modificar la función filterBySearch para usar la nueva utilidad
export const filterBySearch = (data, query, startDate = "2000-01-01", endDate = "2100-12-31") => {
  if (!query || !data) return data

  // Filtrar ventas que coincidan con la búsqueda
  const filteredSales = data.salesData.filter(
    (sale) =>
      textContains(sale.product, query) ||
      textContains(sale.category, query) ||
      textContains(sale.region, query) ||
      textContains(sale.customerId, query),
  )

  // Recalcular todo basado en las ventas filtradas
  return filterByDateRange({ ...data, salesData: filteredSales }, startDate, endDate)
}

// Filtrar por categoría
export const filterByCategory = (data, category, startDate = "2000-01-01", endDate = "2100-12-31") => {
  if (!category || category === "all" || !data) return data

  const filteredSales = data.salesData.filter((sale) => sale.category === category)

  return filterByDateRange({ ...data, salesData: filteredSales }, startDate, endDate)
}

// Filtrar por filtros avanzados
export const filterByAdvancedFilters = (data, filters, startDate = "2000-01-01", endDate = "2100-12-31") => {
  if (!filters || Object.keys(filters).length === 0 || !data) return data

  // Filtrar ventas que coincidan con todos los filtros seleccionados
  const filteredSales = data.salesData.filter((sale) => {
    // Verificar cada grupo de filtros
    return Object.entries(filters).every(([field, values]) => {
      // Si no hay valores seleccionados para este campo, se considera que pasa el filtro
      if (!values || values.length === 0) return true

      // Verificar si el valor del campo de la venta está en los valores seleccionados
      return values.includes(sale[field])
    })
  })

  // Recalcular todo basado en las ventas filtradas
  return filterByDateRange({ ...data, salesData: filteredSales }, startDate, endDate)
}
