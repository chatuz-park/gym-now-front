import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface ProgressData {
  date: string
  weight?: number
  body_fat?: number
  muscle_mass?: number
  sessions?: number
  chest?: number
  waist?: number
  biceps?: number
  forearms?: number
  thighs?: number
  calves?: number
  neck?: number
  shoulders?: number
  hips?: number
}

interface ProgressChartProps {
  data: ProgressData[]
  selectedMetrics: string[]
  title?: string
  height?: number
}

const ProgressChart: React.FC<ProgressChartProps> = ({ 
  data, 
  selectedMetrics, 
  title,
  height = 400,
}) => {
  // Colores para las diferentes métricas
  const colors = {
    weight: '#8884d8',
    body_fat: '#ff7300',
    muscle_mass: '#82ca9d',
    sessions: '#6366f1',
    chest: '#ffc658',
    waist: '#ff6b6b',
    biceps: '#4ecdc4',
    forearms: '#45b7d1',
    thighs: '#96ceb4',
    calves: '#feca57',
    neck: '#ff9ff3',
    shoulders: '#54a0ff',
    hips: '#5f27cd'
  }

  // Formatear fecha para mostrar en el eje X
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Formatear tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{ color?: string; name?: string; value?: number | string }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">
            {label ? formatDate(label) : ''}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No hay datos de progreso disponibles</p>
      </div>
    )
  }

  // Preparar datos para la gráfica
  const chartData = data.map(item => ({
    ...item,
    date: formatDate(item.date)
  }))

  return (
    <div className="w-full">
      {title ? <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3> : null}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {selectedMetrics.map((metric) => {
              const color = colors[metric as keyof typeof colors] || '#8884d8'
              return (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ fill: color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
                  name={getMetricDisplayName(metric)}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Función para obtener nombres de visualización de las métricas
const getMetricDisplayName = (metric: string): string => {
  const names: { [key: string]: string } = {
    weight: 'Peso (kg)',
    body_fat: 'Grasa Corporal (%)',
    muscle_mass: 'Masa Muscular (kg)',
    chest: 'Pecho (cm)',
    waist: 'Cintura (cm)',
    biceps: 'Bíceps (cm)',
    forearms: 'Antebrazos (cm)',
    thighs: 'Muslos (cm)',
    calves: 'Pantorrillas (cm)',
    neck: 'Cuello (cm)',
    shoulders: 'Hombros (cm)',
    hips: 'Caderas (cm)',
    sessions: 'Sesiones',
  }
  return names[metric] || metric
}

export default ProgressChart 