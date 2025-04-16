import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, BarChart } from "lucide-react"
import "../styles/MetricCards.css"

function MetricCards({ data }) {
  const getIcon = (metric) => {
    switch (metric.icon) {
      case "sales":
        return <DollarSign size={24} />
      case "orders":
        return <ShoppingBag size={24} />
      case "customers":
        return <Users size={24} />
      case "average":
        return <BarChart size={24} />
      default:
        return <BarChart size={24} />
    }
  }

  const getTrendIcon = (trend) => {
    return trend > 0 ? <TrendingUp size={16} className="trend-up" /> : <TrendingDown size={16} className="trend-down" />
  }

  return (
    <div className="metric-cards">
      {data.map((metric, index) => (
        <div key={index} className="metric-card">
          <div
            className="metric-icon"
            style={{
              backgroundColor: metric.color + "20",
              color: metric.color,
            }}
          >
            {getIcon(metric)}
          </div>
          <div className="metric-content">
            <h3>{metric.label}</h3>
            <div className="metric-value">
              <span className="value">{metric.value}</span>
              {metric.trend !== undefined && (
                <div className={`trend ${metric.trend > 0 ? "positive" : "negative"}`}>
                  {getTrendIcon(metric.trend)}
                  <span>{Math.abs(metric.trend).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <p className="metric-period">{metric.period || "Período actual"}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MetricCards
