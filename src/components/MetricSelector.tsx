import React, { useState } from 'react'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'

interface MetricOption {
  key: string
  label: string
  category: string
}

interface MetricSelectorProps {
  selectedMetrics: string[]
  onMetricToggle: (metric: string) => void
  onSelectAll: () => void
  onClearAll: () => void
}

const MetricSelector: React.FC<MetricSelectorProps> = ({
  selectedMetrics,
  onMetricToggle,
  onSelectAll,
  onClearAll
}) => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    Composición: true,
    Superior: false,
    Central: false,
    Inferior: false
  })

  const toggleSection = (category: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }
  const metricOptions: MetricOption[] = [
    // Composición corporal
    { key: 'weight', label: 'Peso (kg)', category: 'Composición' },
    { key: 'body_fat', label: 'Grasa Corporal (%)', category: 'Composición' },
    { key: 'muscle_mass', label: 'Masa Muscular (kg)', category: 'Composición' },
    
    // Medidas superiores
    { key: 'chest', label: 'Pecho (cm)', category: 'Superior' },
    { key: 'shoulders', label: 'Hombros (cm)', category: 'Superior' },
    { key: 'biceps', label: 'Bíceps (cm)', category: 'Superior' },
    { key: 'forearms', label: 'Antebrazos (cm)', category: 'Superior' },
    { key: 'neck', label: 'Cuello (cm)', category: 'Superior' },
    
    // Medidas centrales
    { key: 'waist', label: 'Cintura (cm)', category: 'Central' },
    { key: 'hips', label: 'Caderas (cm)', category: 'Central' },
    
    // Medidas inferiores
    { key: 'thighs', label: 'Muslos (cm)', category: 'Inferior' },
    { key: 'calves', label: 'Pantorrillas (cm)', category: 'Inferior' }
  ]

  const groupedMetrics = metricOptions.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = []
    }
    acc[metric.category].push(metric)
    return acc
  }, {} as { [key: string]: MetricOption[] })

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900">Seleccionar Métricas</h4>
        <div className="flex space-x-2">
          <button
            onClick={onSelectAll}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Seleccionar Todo
          </button>
          <button
            onClick={onClearAll}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(groupedMetrics).map(([category, metrics]) => (
          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection(category)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                {category}
              </h5>
              {expandedSections[category] ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {expandedSections[category] && (
              <div className="p-3 bg-white">
                <div className="grid grid-cols-2 gap-2">
                  {metrics.map((metric) => (
                    <label
                      key={metric.key}
                      className="flex items-center space-x-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric.key)}
                        onChange={() => onMetricToggle(metric.key)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedMetrics.includes(metric.key)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedMetrics.includes(metric.key) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-gray-700">{metric.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedMetrics.length === 0 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          Selecciona al menos una métrica para ver el progreso
        </p>
      )}
    </div>
  )
}

export default MetricSelector 