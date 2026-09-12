import React, { useState, useEffect, useRef } from 'react'
import { 
  Search, Plus, Edit, Trash2, Loader2, RefreshCw, 
  Dumbbell, Eye, X, Save, AlertCircle, Upload, Image as ImageIcon
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useDebounce } from '../hooks/useDebounce'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import {
  useExercisesQuery,
  useCreateExerciseMutation,
  useUpdateExerciseMutation,
  useDeleteExerciseMutation,
  useUploadExerciseImageMutation,
} from '../hooks/useExercises'
import { handleApiError } from '../lib/api'
import { getVideoEmbed } from '../lib/videoEmbed'
import type { Exercise } from '../lib/api'
import toast from 'react-hot-toast'

const VideoModal: React.FC<{ exercise: Exercise; onClose: () => void }> = ({
  exercise,
  onClose,
}) => {
  const embed = getVideoEmbed(exercise.video_url!)

  return (
    <div
      className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{exercise.name}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
            {embed.type === 'iframe' ? (
              <iframe
                src={embed.src}
                title={exercise.name}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={embed.src}
                className="h-full w-full"
                controls
                autoPlay
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ExerciseFormData {
  name: string
  description: string
  muscle_groups: string[]
  equipment: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructions: string[]
  video_url?: string
  image_url?: string
}

const Exercises: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInputValue, setSearchInputValue] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [videoExercise, setVideoExercise] = useState<Exercise | null>(null)
  useLockBodyScroll(isCreateModalOpen || isEditModalOpen || isDeleteModalOpen || !!videoExercise)
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    description: '',
    muscle_groups: [],
    equipment: [],
    difficulty: 'beginner',
    instructions: []
  })
  const [newMuscleGroup, setNewMuscleGroup] = useState('')
  const [newEquipment, setNewEquipment] = useState('')
  const [newInstruction, setNewInstruction] = useState('')
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Get state from URL params
  const searchTerm = searchParams.get('search') || ''
  const activeFilter = searchParams.get('filter') || 'all'

  // Debounce the search input value
  const debouncedSearchValue = useDebounce(searchInputValue, 500)

  const exercisesQuery = useExercisesQuery({ search: searchTerm, filter: activeFilter })
  const createExerciseMutation = useCreateExerciseMutation()
  const updateExerciseMutation = useUpdateExerciseMutation()
  const deleteExerciseMutation = useDeleteExerciseMutation()
  const uploadExerciseImageMutation = useUploadExerciseImageMutation()

  const exercises = exercisesQuery.data ?? []
  const exercisesLoading = exercisesQuery.isPending
  const exercisesError = exercisesQuery.error ? handleApiError(exercisesQuery.error) : null
  const creatingExercise = createExerciseMutation.isPending
  const updatingExercise = updateExerciseMutation.isPending
  const deletingExercise = deleteExerciseMutation.isPending
  const uploadingExerciseImage = uploadExerciseImageMutation.isPending
  const savingExercise = creatingExercise || updatingExercise || uploadingExerciseImage

  // Initialize search input value from URL params
  useEffect(() => {
    setSearchInputValue(searchTerm)
  }, [searchTerm])

  // Update URL params when debounced search value changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams)
    if (debouncedSearchValue) {
      newParams.set('search', debouncedSearchValue)
    } else {
      newParams.delete('search')
    }
    setSearchParams(newParams)
  }, [debouncedSearchValue, setSearchParams])

  const handleSearchChange = (value: string) => {
    setSearchInputValue(value)
  }

  const handleFilterChange = (filterId: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (filterId === 'all') {
      newParams.delete('filter')
    } else {
      newParams.set('filter', filterId)
    }
    setSearchParams(newParams)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success'
      case 'intermediate': return 'warning'
      case 'advanced': return 'destructive'
      default: return 'secondary'
    }
  }

  const getDifficultyName = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Principiante'
      case 'intermediate': return 'Intermedio'
      case 'advanced': return 'Avanzado'
      default: return difficulty
    }
  }

  const resetImageSelection = () => {
    setSelectedImageFile(null)
    setImagePreview(null)
    setImageError(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      muscle_groups: [],
      equipment: [],
      difficulty: 'beginner',
      instructions: []
    })
    resetImageSelection()
    setIsCreateModalOpen(true)
  }

  const openEditModal = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setFormData({
      name: exercise.name,
      description: exercise.description,
      muscle_groups: Array.isArray(exercise.muscle_groups) ? exercise.muscle_groups : [],
      equipment: Array.isArray(exercise.equipment) ? exercise.equipment : [],
      difficulty: exercise.difficulty,
      instructions: Array.isArray(exercise.instructions) ? exercise.instructions : [],
      video_url: exercise.video_url,
      image_url: exercise.image_url
    })
    resetImageSelection()
    setImagePreview(exercise.image_url || null)
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (exercise: Exercise) => {
    setExerciseToDelete(exercise)
    setIsDeleteModalOpen(true)
  }

  const closeModals = () => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setIsDeleteModalOpen(false)
    setSelectedExercise(null)
    setExerciseToDelete(null)
    resetImageSelection()
  }

  const cleanFormData = (data: ExerciseFormData) => {
    const cleaned = { ...data }
    
    // Limpiar campos opcionales que estén vacíos
    if (!cleaned.video_url || cleaned.video_url.trim() === '') {
      delete cleaned.video_url
    }
    
    if (!cleaned.image_url || cleaned.image_url.trim() === '') {
      delete cleaned.image_url
    }
    
    // Asegurar que los arrays no estén vacíos si no se han agregado elementos
    if (cleaned.muscle_groups.length === 0) {
      cleaned.muscle_groups = []
    }
    
    if (cleaned.equipment.length === 0) {
      cleaned.equipment = []
    }
    
    if (cleaned.instructions.length === 0) {
      cleaned.instructions = []
    }
    
    return cleaned
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setImageError('Por favor selecciona un archivo de imagen válido')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('La imagen no debe ser mayor a 5MB')
      return
    }

    setImageError(null)
    setSelectedImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadSelectedImage = async (exerciseId: number) => {
    if (!selectedImageFile) return
    const response = await uploadExerciseImageMutation.mutateAsync({
      exerciseId,
      file: selectedImageFile,
    })
    setFormData(prev => ({ ...prev, image_url: response.image_url }))
  }

  const handleCreateExercise = async () => {
    try {
      const cleanedData = cleanFormData(formData)
      const created = await createExerciseMutation.mutateAsync(cleanedData)
      if (selectedImageFile) {
        try {
          await uploadSelectedImage(created.id)
        } catch {
          toast.error('Ejercicio creado, pero no se pudo subir la imagen')
          closeModals()
          return
        }
      }
      toast.success('Ejercicio creado exitosamente')
      closeModals()
    } catch {
      toast.error('Error al crear el ejercicio')
    }
  }

  const handleUpdateExercise = async () => {
    if (!selectedExercise) return

    try {
      const cleanedData = cleanFormData(formData)
      await updateExerciseMutation.mutateAsync({ id: selectedExercise.id, data: cleanedData })
      if (selectedImageFile) {
        try {
          await uploadSelectedImage(selectedExercise.id)
        } catch {
          toast.error('Ejercicio actualizado, pero no se pudo subir la imagen')
          closeModals()
          return
        }
      }
      toast.success('Ejercicio actualizado exitosamente')
      closeModals()
    } catch {
      toast.error('Error al actualizar el ejercicio')
    }
  }

  const handleDeleteExercise = async () => {
    if (!exerciseToDelete) return

    try {
      await deleteExerciseMutation.mutateAsync(exerciseToDelete.id)
      toast.success('Ejercicio eliminado exitosamente')
      closeModals()
    } catch {
      toast.error('Error al eliminar el ejercicio')
    }
  }

  const addMuscleGroup = () => {
    if (newMuscleGroup.trim() && !formData.muscle_groups.includes(newMuscleGroup.trim())) {
      setFormData(prev => ({
        ...prev,
        muscle_groups: [...prev.muscle_groups, newMuscleGroup.trim()]
      }))
      setNewMuscleGroup('')
    }
  }

  const removeMuscleGroup = (group: string) => {
    setFormData(prev => ({
      ...prev,
      muscle_groups: prev.muscle_groups.filter(g => g !== group)
    }))
  }

  const addEquipment = () => {
    if (newEquipment.trim() && !formData.equipment.includes(newEquipment.trim())) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, newEquipment.trim()]
      }))
      setNewEquipment('')
    }
  }

  const removeEquipment = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter(e => e !== equipment)
    }))
  }

  const addInstruction = () => {
    if (newInstruction.trim() && !formData.instructions.includes(newInstruction.trim())) {
      setFormData(prev => ({
        ...prev,
        instructions: [...prev.instructions, newInstruction.trim()]
      }))
      setNewInstruction('')
    }
  }

  const removeInstruction = (instruction: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter(i => i !== instruction)
    }))
  }

  const getFilteredExercises = () => {
    if (!exercises || !Array.isArray(exercises)) return []
    return exercises
  }

  const filteredExercises = getFilteredExercises()

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'Todos', count: exercises?.length || 0 },
    { id: 'beginner', label: 'Principiantes', count: exercises?.filter(e => e.difficulty === 'beginner').length || 0 },
    { id: 'intermediate', label: 'Intermedios', count: exercises?.filter(e => e.difficulty === 'intermediate').length || 0 },
    { id: 'advanced', label: 'Avanzados', count: exercises?.filter(e => e.difficulty === 'advanced').length || 0 }
  ]

  if (exercisesError) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Ejercicios</h1>
          <p className="text-gray-600">Administra la biblioteca de ejercicios</p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error al cargar los ejercicios: {exercisesError}</p>
              <Button onClick={() => void exercisesQuery.refetch()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Ejercicios</h1>
        <p className="text-gray-600">Administra la biblioteca de ejercicios</p>
      </div>

      {/* Search and Add Exercise */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar ejercicios..."
            value={searchInputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          className="bg-primary-600 hover:bg-primary-700"
          onClick={openCreateModal}
          disabled={creatingExercise}
        >
          {creatingExercise ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Nuevo Ejercicio
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.id}
            variant={activeFilter === option.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange(option.id)}
            className="flex items-center gap-2"
          >
            {option.label}
            <Badge variant="secondary" className="ml-1">
              {option.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Exercises Grid */}
      {exercisesLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No se encontraron ejercicios</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="overflow-hidden hover:shadow-md transition-shadow">
              {exercise.image_url && (
                <img
                  src={exercise.image_url}
                  alt={exercise.name}
                  className="h-40 w-full object-cover"
                />
              )}
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{exercise.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openEditModal(exercise)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openDeleteModal(exercise)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Muscle Groups */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Grupos Musculares</h4>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(exercise.muscle_groups) ? exercise.muscle_groups.map((group, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {group}
                        </Badge>
                      )) : (
                        <span className="text-sm text-gray-500">No especificado</span>
                      )}
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Equipamiento</h4>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(exercise.equipment) ? exercise.equipment.map((equipment, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {equipment}
                        </Badge>
                      )) : (
                        <span className="text-sm text-gray-500">No especificado</span>
                      )}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="flex items-center justify-between">
                    <Badge variant={getDifficultyColor(exercise.difficulty) as any}>
                      {getDifficultyName(exercise.difficulty)}
                    </Badge>
                    {exercise.video_url && (
                      <Button size="sm" variant="ghost" onClick={() => setVideoExercise(exercise)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Video
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>

      {/* Create/Edit Exercise Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {isCreateModalOpen ? 'Crear Nuevo Ejercicio' : 'Editar Ejercicio'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Ejercicio
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Sentadillas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe el ejercicio..."
                    className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dificultad
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </div>
              </div>

              {/* Muscle Groups */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grupos Musculares
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newMuscleGroup}
                      onChange={(e) => setNewMuscleGroup(e.target.value)}
                      placeholder="Agregar grupo muscular"
                      onKeyPress={(e) => e.key === 'Enter' && addMuscleGroup()}
                    />
                    <Button size="sm" onClick={addMuscleGroup}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.muscle_groups.map((group, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {group}
                        <button
                          onClick={() => removeMuscleGroup(group)}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipamiento
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newEquipment}
                      onChange={(e) => setNewEquipment(e.target.value)}
                      placeholder="Agregar equipamiento"
                      onKeyPress={(e) => e.key === 'Enter' && addEquipment()}
                    />
                    <Button size="sm" onClick={addEquipment}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.equipment.map((equipment, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {equipment}
                        <button
                          onClick={() => removeEquipment(equipment)}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instrucciones
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newInstruction}
                      onChange={(e) => setNewInstruction(e.target.value)}
                      placeholder="Agregar instrucción"
                      onKeyPress={(e) => e.key === 'Enter' && addInstruction()}
                    />
                    <Button size="sm" onClick={addInstruction}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {formData.instructions.map((instruction, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="text-sm flex-1">{index + 1}. {instruction}</span>
                        <button
                          onClick={() => removeInstruction(instruction)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL del Video (opcional)
                  </label>
                  <Input
                    value={formData.video_url || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      video_url: e.target.value.trim() === '' ? undefined : e.target.value 
                    }))}
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen (opcional)
                  </label>
                  {imagePreview && (
                    <div className="mb-2 flex justify-center">
                      <img
                        src={imagePreview}
                        alt={formData.name || 'Vista previa'}
                        className="h-24 w-24 rounded-lg object-cover border border-gray-200"
                      />
                    </div>
                  )}
                  {imageError && (
                    <div className="mb-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                      {imageError}
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="exercise-image-upload"
                    disabled={savingExercise}
                  />
                  <label
                    htmlFor="exercise-image-upload"
                    onClick={(e) => {
                      if (savingExercise) e.preventDefault()
                    }}
                    className={`flex items-center justify-center w-full p-3 border-2 border-dashed border-gray-300 rounded-lg transition-colors ${
                      savingExercise ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-500'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      {selectedImageFile ? (
                        <ImageIcon className="w-6 h-6 text-primary-600" />
                      ) : (
                        <Upload className="w-6 h-6 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-600 text-center">
                        {selectedImageFile ? selectedImageFile.name : 'Haz clic para seleccionar una imagen'}
                      </span>
                      <span className="text-xs text-gray-500">
                        JPG, PNG o GIF (máximo 5MB)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <Button variant="outline" onClick={closeModals} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={isCreateModalOpen ? handleCreateExercise : handleUpdateExercise}
                  disabled={!formData.name.trim() || savingExercise}
                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                >
                  {savingExercise ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isCreateModalOpen ? 'Crear' : 'Actualizar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Video Modal */}
      {videoExercise?.video_url && (
        <VideoModal
          exercise={videoExercise}
          onClose={() => setVideoExercise(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && exerciseToDelete && (
        <div className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirmar Eliminación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <div>
                  <p>¿Estás seguro de que quieres eliminar el ejercicio "{exerciseToDelete.name}"?</p>
                  <p className="text-sm text-gray-600 mt-1">Esta acción no se puede deshacer.</p>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={closeModals}
                  disabled={deletingExercise}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteExercise}
                  disabled={deletingExercise}
                >
                  {deletingExercise ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

export default Exercises 