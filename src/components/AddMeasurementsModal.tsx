import React from 'react'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import type { Client } from '../lib/api'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

export type MeasurementForm = {
  weight: string
  body_fat: string
  muscle_mass: string
  chest: string
  waist: string
  biceps: string
  forearms: string
  thighs: string
  calves: string
  neck: string
  shoulders: string
  hips: string
}

const FIELDS: Array<{ key: keyof MeasurementForm; label: string; required?: boolean }> = [
  { key: 'weight', label: 'Peso (kg)', required: true },
  { key: 'body_fat', label: 'Grasa Corporal (%)' },
  { key: 'muscle_mass', label: 'Masa Muscular (kg)' },
  { key: 'chest', label: 'Pecho (cm)' },
  { key: 'waist', label: 'Cintura (cm)' },
  { key: 'biceps', label: 'Bíceps (cm)' },
  { key: 'forearms', label: 'Antebrazos (cm)' },
  { key: 'thighs', label: 'Muslos (cm)' },
  { key: 'calves', label: 'Pantorrillas (cm)' },
  { key: 'neck', label: 'Cuello (cm)' },
  { key: 'shoulders', label: 'Hombros (cm)' },
  { key: 'hips', label: 'Caderas (cm)' },
]

interface AddMeasurementsModalProps {
  client: Client
  date: string
  measurements: MeasurementForm
  placeholders: MeasurementForm
  loading: boolean
  onClose: () => void
  onDateChange: (value: string) => void
  onChange: (field: keyof MeasurementForm, value: string) => void
  onSubmit: () => void
}

const AddMeasurementsModal: React.FC<AddMeasurementsModalProps> = ({
  client,
  date,
  measurements,
  placeholders,
  loading,
  onClose,
  onDateChange,
  onChange,
  onSubmit,
}) => {
  useLockBodyScroll(true)

  return (
  <div
    className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black bg-opacity-50 p-4"
    onClick={onClose}
  >
    <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(event) => event.stopPropagation()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white sticky top-0 z-10 border-b">
        <CardTitle>Agregar Medidas</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="w-10 h-10">
              <AvatarImage src={client.profile_image} />
              <AvatarFallback>
                {client.name.split(' ').map((part) => part[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{client.name}</p>
              <p className="text-xs text-gray-600">{client.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Fecha de las medidas *</label>
            <Input
              type="date"
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium text-gray-600">
                  {field.label}{field.required ? ' *' : ''}
                </label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={placeholders[field.key]}
                  value={measurements[field.key]}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={onSubmit}
              className="flex-1 bg-primary-600 hover:bg-primary-700"
              disabled={!date || !measurements.weight || loading}
            >
              {loading ? 'Agregando...' : 'Agregar Medidas'}
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  </div>
  )
}

export default AddMeasurementsModal
