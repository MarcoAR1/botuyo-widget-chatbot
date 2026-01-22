/**
 * @package @paseolibre/chat-widget
 * Gallery - Componente visual para mostrar galerías de imágenes
 */

'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GalleryProps {
  images: Array<{ src: string; alt?: string }>
  radius?: string
}

export function Gallery({ images, radius = 'rounded-lg' }: GalleryProps) {
  const t = useTranslations('common.extracted')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setIsLightboxOpen(true)
  }

  // Si solo hay 1 imagen, mostrar como imagen simple
  if (images.length === 1) {
    return (
      <div className="my-3 relative group">
        <img
          src={images[0].src}
          alt={images[0].alt || 'Imagen'}
          className={cn(
            'w-full h-auto object-cover cursor-pointer transition-all duration-300',
            'border border-border shadow-soft-md hover:shadow-soft-lg hover:scale-[1.02]',
            radius
          )}
          loading="lazy"
          onClick={() => openLightbox(0)}
        />
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={16} className="text-white" />
        </div>
      </div>
    )
  }

  // Si hay 2-3 imágenes, mostrar grid horizontal
  if (images.length <= 3) {
    return (
      <div className={cn('my-3 grid gap-2', images.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
        {images.map((img, idx) => (
          <div key={idx} className="relative group overflow-hidden">
            <img
              src={img.src}
              alt={img.alt || `Imagen ${idx + 1}`}
              className={cn(
                'w-full h-32 object-cover cursor-pointer transition-all duration-300',
                'border border-border shadow-soft-md hover:shadow-soft-lg hover:scale-110',
                radius
              )}
              loading="lazy"
              onClick={() => openLightbox(idx)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2">
              <span className="text-white text-xs font-bold bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                {idx + 1}/{images.length}
              </span>
            </div>
          </div>
        ))}

        {/* Lightbox */}
        {isLightboxOpen && <Lightbox images={images} currentIndex={currentIndex} onClose={() => setIsLightboxOpen(false)} onNext={nextImage} onPrev={prevImage} />}
      </div>
    )
  }

  // Si hay 4+ imágenes, mostrar carrusel con thumbnails
  return (
    <div className="my-3 space-y-2" >
      {/* Imagen Principal */}
      <div className="relative group">
        <img
          src={images[currentIndex].src}
          alt={images[currentIndex].alt || `Imagen ${currentIndex + 1}`}
          className={cn(
            'w-full h-56 object-cover cursor-pointer transition-all duration-300',
            'border border-border shadow-soft-md',
            radius
          )}
          loading="lazy"
          onClick={() => openLightbox(currentIndex)}
        />

        {/* Overlay con controles */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-3">
          <button
            onClick={prevImage}
            className="bg-card/90 hover:bg-card p-2 rounded-full shadow-soft-lg transition-all hover:scale-110 active:scale-95"
            aria-label={t('extracted.anterior')}
          >
            <ChevronLeft size={20} className="text-foreground" />
          </button>
          <button
            onClick={nextImage}
            className="bg-card/90 hover:bg-card p-2 rounded-full shadow-soft-lg transition-all hover:scale-110 active:scale-95"
            aria-label={t('extracted.siguiente')}
          >
            <ChevronRight size={20} className="text-foreground" />
          </button>
        </div>

        {/* Badge con contador */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-white text-xs font-bold">
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        {/* Icono de zoom */}
        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={16} className="text-white" />
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              'flex-shrink-0 w-16 h-16 overflow-hidden transition-all duration-300',
              'border-2 hover:scale-110',
              radius,
              currentIndex === idx
                ? 'border-[hsl(210,90%,50%)] ring-2 ring-[hsl(210,90%,50%)]/30 scale-105'
                : 'border-border hover:border-[hsl(210,90%,70%)] opacity-70 hover:opacity-100'
            )}
          >
            <img
              src={img.src}
              alt={img.alt || `Thumbnail ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && <Lightbox images={images} currentIndex={currentIndex} onClose={() => setIsLightboxOpen(false)} onNext={nextImage} onPrev={prevImage} />}
    </div>
  )
}

// ==========================================
// 🔍 LIGHTBOX (Modal de Imagen)
// ==========================================

interface LightboxProps {
  images: Array<{ src: string; alt?: string }>
  currentIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

function Lightbox({ images, currentIndex, onClose, onNext, onPrev }: LightboxProps) {
  const t = useTranslations('common.extracted')
  return (
    <div
      className="fixed inset-0 z-[100000] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Botón Cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all hover:scale-110 active:scale-95 z-10"
        aria-label={t('extracted.cerrar')}
      >
        <X size={24} className="text-white" />
      </button>

      {/* Contador */}
      <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full z-10">
        <span className="text-white text-sm font-bold">
          {currentIndex + 1} / {images.length}
        </span>
      </div>

      {/* Controles de Navegación */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            className="absolute left-4 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all hover:scale-110 active:scale-95 z-10"
            aria-label="Anterior"
          >
            <ChevronLeft size={32} className="text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            className="absolute right-4 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all hover:scale-110 active:scale-95 z-10"
            aria-label="Siguiente"
          >
            <ChevronRight size={32} className="text-white" />
          </button>
        </>
      )}

      {/* Imagen */}
      <img
        src={images[currentIndex].src}
        alt={images[currentIndex].alt || `Imagen ${currentIndex + 1}`}
        className="max-w-[90%] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
