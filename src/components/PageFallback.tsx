import React from 'react'

const PageFallback: React.FC = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="flex items-center space-x-2">
      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-gray-600">Cargando...</span>
    </div>
  </div>
)

export default PageFallback
