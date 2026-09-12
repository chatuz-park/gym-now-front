import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { getVideoEmbed } from '../lib/videoEmbed'
import type { Exercise } from '../lib/api'

interface ExerciseHowToModalProps {
  exercise: Exercise
  onClose: () => void
}

const ExerciseHowToModal: React.FC<ExerciseHowToModalProps> = ({ exercise, onClose }) => {
  useLockBodyScroll(true)
  const overlayRef = useRef<HTMLDivElement>(null)
  const embed = exercise.video_url ? getVideoEmbed(exercise.video_url) : null
  const instructions = Array.isArray(exercise.instructions) ? exercise.instructions : []

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.target === overlayRef.current) onClose()
    }
    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-black bg-opacity-50 p-4"
    >
      <Card
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{exercise.name}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Cerrar"
            className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {exercise.description && (
            <p className="text-sm text-gray-600">{exercise.description}</p>
          )}

          {embed && (
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
          )}

          {instructions.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">Cómo hacerlo</h4>
              <ol className="space-y-2">
                {instructions.map((step, index) => (
                  <li key={index} className="flex gap-2 text-sm text-gray-700">
                    <span className="font-medium text-gray-500">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!embed && instructions.length === 0 && (
            <p className="text-sm text-gray-500">
              Este ejercicio aún no tiene video ni instrucciones.
            </p>
          )}
        </CardContent>
      </Card>
    </div>,
    document.body
  )
}

export default ExerciseHowToModal
