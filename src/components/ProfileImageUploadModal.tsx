import React, { useState, useRef } from 'react'
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { handleApiError } from '../lib/api'
import { useUploadProfileImageMutation } from '../hooks/useClients'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

interface ProfileImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: number
  currentImageUrl?: string
  clientName?: string
  onUploadSuccess: (imageUrl: string) => void
}

const ProfileImageUploadModal: React.FC<ProfileImageUploadModalProps> = ({
  isOpen,
  onClose,
  clientId,
  currentImageUrl,
  clientName = '',
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadProfileImageMutation()
  const uploading = uploadMutation.isPending
  useLockBodyScroll(isOpen)

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido')
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe ser mayor a 5MB')
        return
      }

      setError(null)
      setSelectedFile(file)

      // Crear preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona una imagen')
      return
    }

    setError(null)

    try {
      const response = await uploadMutation.mutateAsync({ clientId, file: selectedFile })
      onUploadSuccess(response.profile_image)
      handleClose()
    } catch (err) {
      console.error('Error uploading image:', err)
      setError(handleApiError(err) || 'Error al subir la imagen. Por favor intenta de nuevo.')
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const imageToShow = previewUrl || currentImageUrl

  return (
    <div
      className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleClose}
    >
      <Card
        className="w-full max-w-md overflow-hidden"
        onClick={handleModalContentClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white sticky top-0 z-10 border-b">
          <CardTitle>Subir Foto de Perfil</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Preview de la imagen */}
          <div className="flex justify-center">
            <Avatar className="h-32 w-32">
              <AvatarImage src={imageToShow || undefined} alt={clientName} />
              <AvatarFallback className="text-2xl">
                {clientName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Input de archivo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Selecciona una imagen
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="profile-image-upload"
              disabled={uploading}
            />
            <label
              htmlFor="profile-image-upload"
              className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {selectedFile ? selectedFile.name : 'Haz clic para seleccionar una imagen'}
                </span>
                <span className="text-xs text-gray-500">
                  JPG, PNG o GIF (máximo 5MB)
                </span>
              </div>
            </label>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Subir Imagen
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfileImageUploadModal