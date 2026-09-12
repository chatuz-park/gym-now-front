import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Verificar si la fecha es válida
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida'
  }
  
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj)
}

export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Verificar si la fecha es válida
  if (isNaN(dateObj.getTime())) {
    return 'Hora inválida'
  }
  
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

export function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-CO')}`
}

export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min((current / target) * 100, 100)
}

export function calculateAge(birthDate: string | Date): number {
  const birthDateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  
  // Verificar si la fecha es válida
  if (isNaN(birthDateObj.getTime())) {
    return 0
  }
  
  const today = new Date()
  const age = Math.floor((today.getTime() - birthDateObj.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  return age
} 