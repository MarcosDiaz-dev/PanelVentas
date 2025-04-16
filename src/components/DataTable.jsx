"use client"

import { useState } from "react"
import { ArrowUp, ArrowDown, Download, ChevronDown, ChevronUp } from "lucide-react"
import "../styles/Datatable.css"

function DataTable({ data, detailedData, onExport }) {
  const [sortField, setSortField] = useState("revenue")
  const [sortDirection, setSortDirection] = useState("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState({})
  const itemsPerPage = 5

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (sortDirection === "asc") {
      return a[sortField] > b[sortField] ? 1 : -1
    } else {
      return a[sortField] < b[sortField] ? 1 : -1
    }
  })

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const toggleRowExpand = (rowId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }))
  }

  const renderSortIcon = (field) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />
  }

  const getDetailedDataForRow = (rowId) => {
    return detailedData ? detailedData.filter((item) => item.parentId === rowId) : []
  }

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h3>Análisis Detallado de Ventas</h3>
        <div className="table-actions">
          <button className="table-action" onClick={() => onExport("csv")}>
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}></th>
              <th>Región</th>
              <th className={sortField === "sales" ? "active" : ""} onClick={() => handleSort("sales")}>
                <span>Unidades</span>
                {renderSortIcon("sales")}
              </th>
              <th className={sortField === "revenue" ? "active" : ""} onClick={() => handleSort("revenue")}>
                <span>Ingresos</span>
                {renderSortIcon("revenue")}
              </th>
              <th className={sortField === "avgPrice" ? "active" : ""} onClick={() => handleSort("avgPrice")}>
                <span>Precio Medio</span>
                {renderSortIcon("avgPrice")}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => {
                const detailedItems = getDetailedDataForRow(row.id)
                const hasDetails = detailedItems.length > 0

                return (
                  <>
                    <tr key={row.id || index} className={hasDetails ? "expandable-row" : ""}>
                      <td>
                        {hasDetails && (
                          <button className="expand-button" onClick={() => toggleRowExpand(row.id)}>
                            {expandedRows[row.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                      </td>
                      <td>
                        <div className="source-cell">
                          <div className="source-icon" style={{ backgroundColor: row.color }}>
                            {row.source.charAt(0).toUpperCase()}
                          </div>
                          <span>{row.source}</span>
                        </div>
                      </td>
                      <td>{row.sales.toLocaleString()}</td>
                      <td>
                        {row.revenue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        €
                      </td>
                      <td>
                        {(row.revenue / row.sales).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        €
                      </td>
                    </tr>

                    {hasDetails && expandedRows[row.id] && (
                      <tr className="detail-row">
                        <td colSpan={5}>
                          <div className="detail-content">
                            <h4>Desglose por {detailedItems[0].type}</h4>
                            <table className="detail-table">
                              <thead>
                                <tr>
                                  <th>{detailedItems[0].type}</th>
                                  <th>Unidades</th>
                                  <th>Ingresos</th>
                                  <th>% del Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detailedItems.map((item, idx) => (
                                  <tr key={idx}>
                                    <td>{item.name}</td>
                                    <td>{item.units.toLocaleString()}</td>
                                    <td>
                                      {item.revenue.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}{" "}
                                      €
                                    </td>
                                    <td>{((item.revenue / row.revenue) * 100).toFixed(1)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="no-data">
                  No hay datos disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Anterior
          </button>

          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`pagination-page ${currentPage === page ? "active" : ""}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}

export default DataTable
