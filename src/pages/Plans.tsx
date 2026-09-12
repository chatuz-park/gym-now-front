import React, { useEffect, useState } from 'react'
import {
  AlertCircle, CreditCard, Loader2, Plus, RefreshCw, Search, Trash2, X,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useDebounce } from '../hooks/useDebounce'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useAuth } from '../hooks/useAuth'
import {
  useCreatePlanMutation,
  useDeletePlanMutation,
  usePlansQuery,
  useUpdatePlanMutation,
} from '../hooks/usePlans'
import { handleApiError } from '../lib/api'
import type { Plan, PlanColor } from '../lib/api'
import { canManagePlans } from '../lib/rbac'
import { PLAN_COLORS, getPlanColorClass } from '../definitions'
import toast from 'react-hot-toast'

interface PlanFormData {
  name: string
  slug: string
  description: string
  price: string
  duration_days: string
  features: string[]
  color: PlanColor
  is_active: boolean
}

const EMPTY_FORM: PlanFormData = {
  name: '',
  slug: '',
  description: '',
  price: '',
  duration_days: '30',
  features: [],
  color: 'blue',
  is_active: true,
}

function formatPrice(price: number) {
  return `$${price.toLocaleString('es-CO')}`
}

const Plans: React.FC = () => {
  const { user } = useAuth()
  const canWrite = canManagePlans(user?.role)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInputValue, setSearchInputValue] = useState('')
  const [formData, setFormData] = useState<PlanFormData>(EMPTY_FORM)
  const [newFeature, setNewFeature] = useState('')
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  useLockBodyScroll(isFormOpen || !!planToDelete)

  const searchTerm = searchParams.get('search') || ''
  const statusFilter = searchParams.get('status') || 'all'
  const debouncedSearchValue = useDebounce(searchInputValue, 500)

  const plansQuery = usePlansQuery({
    search: searchTerm || undefined,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
  })
  const createPlanMutation = useCreatePlanMutation()
  const updatePlanMutation = useUpdatePlanMutation()
  const deletePlanMutation = useDeletePlanMutation()

  const plans = plansQuery.data ?? []
  const plansLoading = plansQuery.isPending
  const plansError = plansQuery.error ? handleApiError(plansQuery.error) : null
  const saving = createPlanMutation.isPending || updatePlanMutation.isPending

  useEffect(() => {
    setSearchInputValue(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (debouncedSearchValue) {
        next.set('search', debouncedSearchValue)
      } else {
        next.delete('search')
      }
      return next
    })
  }, [debouncedSearchValue, setSearchParams])

  const handleFilterChange = (filterId: string) => {
    const next = new URLSearchParams(searchParams)
    if (filterId === 'all') {
      next.delete('status')
    } else {
      next.set('status', filterId)
    }
    setSearchParams(next)
  }

  const openCreate = () => {
    setEditingPlan(null)
    setFormData(EMPTY_FORM)
    setNewFeature('')
    setIsFormOpen(true)
  }

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price: String(plan.price),
      duration_days: String(plan.duration_days),
      features: Array.isArray(plan.features) ? plan.features : [],
      color: plan.color,
      is_active: plan.is_active,
    })
    setNewFeature('')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingPlan(null)
    setFormData(EMPTY_FORM)
    setNewFeature('')
  }

  const addFeature = () => {
    const value = newFeature.trim()
    if (!value || formData.features.includes(value)) return
    setFormData((prev) => ({ ...prev, features: [...prev.features, value] }))
    setNewFeature('')
  }

  const removeFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((item) => item !== feature),
    }))
  }

  const handleSave = async () => {
    const price = Number(formData.price)
    const durationDays = Number(formData.duration_days)
    if (!formData.name.trim()) {
      toast.error('El nombre del plan es obligatorio')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error('El precio debe ser un número válido')
      return
    }
    if (!Number.isFinite(durationDays) || durationDays < 1) {
      toast.error('La duración debe ser de al menos 1 día')
      return
    }

    const payload: Partial<Plan> = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || undefined,
      description: formData.description.trim(),
      price,
      duration_days: durationDays,
      features: formData.features,
      color: formData.color,
      is_active: formData.is_active,
    }

    try {
      if (editingPlan) {
        await updatePlanMutation.mutateAsync({ id: editingPlan.id, data: payload })
        toast.success('Plan actualizado')
      } else {
        await createPlanMutation.mutateAsync(payload)
        toast.success('Plan creado')
      }
      closeForm()
    } catch (error) {
      toast.error(handleApiError(error))
    }
  }

  const handleDelete = async () => {
    if (!planToDelete) return
    try {
      await deletePlanMutation.mutateAsync(planToDelete.id)
      toast.success('Plan eliminado')
      setPlanToDelete(null)
    } catch (error) {
      toast.error(handleApiError(error))
    }
  }

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Activos' },
    { id: 'inactive', label: 'Inactivos' },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Planes</h1>
        <p className="text-gray-600">
          Administra los planes de suscripción que se asignan a los clientes.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchInputValue}
            onChange={(event) => setSearchInputValue(event.target.value)}
            placeholder="Buscar por nombre o código"
            className="pl-10"
          />
        </div>
        {canWrite && (
          <Button className="bg-primary-600 hover:bg-primary-700" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo plan
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            type="button"
            size="sm"
            variant={statusFilter === filter.id ? 'default' : 'outline'}
            onClick={() => handleFilterChange(filter.id)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {plansError && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-red-600">Error al cargar los planes: {plansError}</p>
            <Button onClick={() => void plansQuery.refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {plansLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Cargando planes…
        </div>
      ) : !plansError && plans.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-600">
            No hay planes que coincidan con la búsqueda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={getPlanColorClass(plan.color, 'card')}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg">{plan.name}</CardTitle>
                    <p className="truncate text-sm text-gray-500">{plan.slug}</p>
                  </div>
                  <Badge variant={plan.is_active ? 'success' : 'secondary'}>
                    {plan.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-primary-600">{formatPrice(plan.price)}</p>
                  <p className="text-sm text-gray-600">{plan.duration_days} días</p>
                </div>
                {plan.description && (
                  <p className="text-sm text-gray-600">{plan.description}</p>
                )}
                {plan.features.length > 0 && (
                  <ul className="space-y-1 text-sm text-gray-700">
                    {plan.features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                )}
                <p className="flex items-center text-sm text-gray-500">
                  <CreditCard className="mr-1.5 h-4 w-4" />
                  {plan.subscribers_count === 1 ? '1 cliente' : `${plan.subscribers_count} clientes`}
                </p>
                {canWrite && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => openEdit(plan)}>
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setPlanToDelete(plan)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingPlan ? 'Editar plan' : 'Nuevo plan'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeForm} disabled={saving}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nombre *</label>
                <Input
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Premium"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Código</label>
                <Input
                  value={formData.slug}
                  onChange={(event) => setFormData((prev) => ({ ...prev, slug: event.target.value }))}
                  placeholder="Se genera del nombre si lo dejas vacío"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="Qué incluye este plan"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Precio (COP) *</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))}
                    placeholder="199000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Duración (días) *</label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.duration_days}
                    onChange={(event) => setFormData((prev) => ({ ...prev, duration_days: event.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Color</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  value={formData.color}
                  onChange={(event) => setFormData((prev) => ({ ...prev, color: event.target.value as PlanColor }))}
                >
                  {PLAN_COLORS.map((color) => (
                    <option key={color.id} value={color.id}>{color.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Características</label>
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(event) => setNewFeature(event.target.value)}
                    placeholder="Ej. Rutinas ilimitadas"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addFeature()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addFeature}>
                    Añadir
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="gap-1">
                      {feature}
                      <button type="button" onClick={() => removeFeature(feature)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(event) => setFormData((prev) => ({ ...prev, is_active: event.target.checked }))}
                />
                Plan activo (se puede asignar a clientes)
              </label>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={closeForm} disabled={saving}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={() => void handleSave()} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingPlan ? 'Guardar' : 'Crear'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {planToDelete && (
        <div className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Eliminar plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-6 w-6 text-amber-500" />
                <p>
                  ¿Eliminar el plan <strong>{planToDelete.name}</strong>?
                  Si tiene clientes asignados, desactívalo en lugar de borrarlo.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPlanToDelete(null)}
                  disabled={deletePlanMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => void handleDelete()}
                  disabled={deletePlanMutation.isPending}
                >
                  {deletePlanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Plans
