'use client'

import { useState, useRef, useMemo } from 'react'
import { useTranslations } from '@/chat-widget/i18n'
import type { MediaConfig } from '../types'
import { Send, ImageIcon, Loader2, Plus, MapPin, Mic, X, Trash2, FileIcon, Phone } from './Icons'
import { cn } from '@/lib/utils'
import { getPrimaryColor } from '../utils/theme'
import { logger } from '../utils/logger'
import { validateFile } from '../utils/fileValidation'

// --- CONFIGURACIÓN ---
const MAX_CHARS = 1000
const DEFAULT_MEDIA_CONFIG: MediaConfig = {
  enableImages: true,
  enableAudio: true,
  enableFiles: true,
  enableLocation: true,
  allowedFileTypes: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip'],
  maxFileSizeMB: 10,
}

// --- INTERFACES ---
export interface Attachment {
  type: 'image' | 'audio' | 'file'
  file: File
  previewUrl?: string
}

export interface InputAreaProps {
  isConnected: boolean
  placeholder?: string
  primaryColor?: string
  mediaConfig?: MediaConfig
  onSendMessage: (message: string) => void
  onSendAttachment?: (file: File, type: 'image' | 'audio' | 'file') => void
  onSendLocation?: (location: { latitude: number; longitude: number }) => void
  onVoiceCall?: () => void // Voice call callback
}

export function InputArea({
  isConnected,
  placeholder = 'Escribe un mensaje...',
  primaryColor,
  mediaConfig,
  onSendMessage,
  onSendAttachment,
  onSendLocation,
  onVoiceCall,
}: InputAreaProps) {
  const { t } = useTranslations()
  const [inputValue, setInputValue] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const brandColor = getPrimaryColor({ primaryColor })

  // Fusionar configuración de medios con valores por defecto
  const config = useMemo(() => ({ ...DEFAULT_MEDIA_CONFIG, ...mediaConfig }), [mediaConfig])

  // Verificar si hay alguna funcionalidad multimedia habilitada
  const hasMediaFeatures = useMemo(
    () => config.enableImages || config.enableAudio || config.enableFiles || config.enableLocation,
    [config]
  )

  // 🔥 LÓGICA DE ENVÍO CORREGIDA
  const handleSend = () => {
    const trimmedValue = inputValue.trim()

    // 🛡️ CRITICAL: Focus the textarea BEFORE clearing input.
    // Clearing inputValue unmounts the Send button → browser moves focus to next
    // focusable element (call button). By focusing textarea first, focus stays put.
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.style.height = '40px'
    }

    if (attachment) {
      onSendAttachment?.(attachment.file, attachment.type)
      setAttachment(null)
      setInputValue('')
    } else if (trimmedValue && isConnected) {
      onSendMessage(trimmedValue)
      setInputValue('')
    }

    // 🛡️ Safety net: re-focus after React re-render + any scroll/DOM mutations.
    // Catches edge cases where scrollIntoView or other effects steal focus.
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }

  // 🔥 CAPTURA DE ENTER Y CTRL+ENTER (Accesibilidad mejorada)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sin modificadores: enviar mensaje
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      handleSend()
    }
    // Ctrl+Enter o Cmd+Enter: enviar mensaje (alternativa)
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
    // Shift+Enter: nueva línea (comportamiento por defecto, no hacer nada)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_CHARS)
    setInputValue(val)

    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsMenuOpen(false)

    // Validar archivo con magic bytes
    const validationResult = await validateFile(file, {
      maxSizeMB: config.maxFileSizeMB || 10,
      allowedExtensions: config.allowedFileTypes || [
        'jpg',
        'jpeg',
        'png',
        'webp',
        'gif',
        'pdf',
        'doc',
        'docx',
        'txt',
        'zip',
      ],
      checkMagicBytes: true,
    })

    if (!validationResult.valid) {
      alert(validationResult.error || 'Archivo no válido')
      return
    }

    // Si es imagen y la compresión está habilitada, comprimir
    if (file.type.startsWith('image/') && config.enableImages) {
      setIsCompressing(true)
      try {
        // Lazy load browser-image-compression
        const { default: imageCompression } = await import('browser-image-compression')

        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        }
        const compressedFile = await imageCompression(file, options)
        setAttachment({
          type: 'image',
          file: compressedFile,
          previewUrl: URL.createObjectURL(compressedFile),
        })
      } catch (error) {
        logger.error('Image compression failed:', error)
        // Fallback: usar imagen original sin comprimir
        setAttachment({
          type: 'image',
          file,
          previewUrl: URL.createObjectURL(file),
        })
      } finally {
        setIsCompressing(false)
      }
    } else {
      // Archivo general (PDF, DOC, etc.)
      setAttachment({
        type: 'file',
        file,
        previewUrl: '',
      })
    }
  }

  const startRecording = async () => {
    if (!isConnected) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = e => audioChunksRef.current.push(e.data)
      mediaRecorder.onstop = () => {
        const audioFile = new File([new Blob(audioChunksRef.current)], 'voice.webm', {
          type: 'audio/webm',
        })
        onSendAttachment?.(audioFile, 'audio')
      }
      mediaRecorder.start()
      setIsRecording(true)
      timerRef.current = setInterval(() => setRecordingTime(v => v + 1), 1000)
    } catch {
      alert('Micrófono denegado o no disponible')
    }
  }

  const stopRecording = async (send: boolean) => {
    if (mediaRecorderRef.current) {
      if (!send) mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
    setRecordingTime(0)

    // Validar archivo de audio antes de enviar
    if (send && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, {
        type: 'audio/webm',
      })

      // Validar archivo de audio (ahora async)
      const validation = await validateFile(audioFile, { maxSizeMB: 10 })
      if (!validation.valid) {
        logger.error('Audio validation failed:', validation.error)
        alert(validation.error)
        audioChunksRef.current = []
        return
      }

      // Si es válido, enviar
      onSendAttachment?.(audioFile, 'audio')
      audioChunksRef.current = []
    }
  }

  return (
    <div className="relative">
      {/* PREVIEW DE ADJUNTO */}
      {(attachment || isCompressing) && (
        <div
          className="absolute bottom-full left-0 mb-2 p-2 rounded-2xl border shadow-soft-2xl animate-in slide-in-from-bottom-2 z-50"
          style={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
          }}
        >
          <div className="relative w-16 h-16">
            {isCompressing ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-xl">
                <Loader2 className="animate-spin text-primary h-5 w-5" />
              </div>
            ) : attachment?.type === 'image' ? (
              <>
                <img
                  src={attachment?.previewUrl}
                  className="w-full h-full object-cover rounded-xl border"
                  alt={t('preview')}
                />
                <button
                  onClick={() => setAttachment(null)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-1 shadow-md hover:scale-105"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              </>
            ) : (
              <>
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-xl border">
                  <FileIcon className="text-primary h-6 w-6" />
                  <span className="text-[8px] mt-1 font-bold truncate max-w-[60px]">
                    {attachment?.file.name}
                  </span>
                </div>
                <button
                  onClick={() => setAttachment(null)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-1 shadow-md hover:scale-105"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Input de imágenes */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={imageInputRef}
        onChange={handleFileSelect}
      />

      {/* Input de archivos generales */}
      <input
        type="file"
        accept={config.allowedFileTypes?.map(ext => `.${ext}`).join(',')}
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      <div className="flex items-center max-w-full" style={{ gap: 'var(--spacing-3)' }}>
        {/* BOTÓN PLUS / MENÚ */}
        {hasMediaFeatures && onSendAttachment && (
          <div className="relative shrink-0">
            {isMenuOpen && (
              <div
                className="absolute bottom-full left-0 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 z-[60]"
                style={{ marginBottom: 'var(--spacing-2)', gap: 'var(--spacing-2)' }}
              >
                {/* Opción: Imágenes */}
                {config.enableImages && (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center border shadow-soft-2xl rounded-2xl transition-colors text-[10px] font-black uppercase tracking-widest"
                    style={{
                      gap: 'var(--spacing-3)',
                      padding: 'var(--spacing-3) var(--spacing-5)',
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--card-foreground))',
                    }}
                  >
                    <ImageIcon size={18} className="text-blue-500" /> {t('fotos')}
                  </button>
                )}

                {/* Opción: Archivos */}
                {config.enableFiles && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center border shadow-soft-2xl rounded-2xl transition-colors text-[10px] font-black uppercase tracking-widest"
                    style={{
                      gap: 'var(--spacing-3)',
                      padding: 'var(--spacing-3) var(--spacing-5)',
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--card-foreground))',
                    }}
                  >
                    <FileIcon size={18} className="text-purple-500" /> Archivos
                  </button>
                )}

                {/* Opción: Ubicación */}
                {config.enableLocation && onSendLocation && (
                  <button
                    onClick={() => {
                      setIsLoadingLocation(true)
                      navigator.geolocation.getCurrentPosition(
                        pos => {
                          onSendLocation?.({
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                          })
                          setIsLoadingLocation(false)
                          setIsMenuOpen(false)
                        },
                        () => setIsLoadingLocation(false)
                      )
                    }}
                    className="flex items-center border shadow-soft-2xl rounded-2xl transition-colors text-[10px] font-black uppercase tracking-widest"
                    style={{
                      gap: 'var(--spacing-3)',
                      padding: 'var(--spacing-3) var(--spacing-5)',
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--card-foreground))',
                    }}
                  >
                    {isLoadingLocation ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <MapPin size={18} className="text-emerald-500" />
                    )}{' '}
                    {t('ubicacion')}
                  </button>
                )}

                {/* Opción: Llamada de Voz */}
                {config.enableVoice && onVoiceCall && (
                  <button
                    onClick={() => {
                      onVoiceCall?.()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center border shadow-soft-2xl rounded-2xl transition-colors text-[10px] font-black uppercase tracking-widest"
                    style={{
                      gap: 'var(--spacing-3)',
                      padding: 'var(--spacing-3) var(--spacing-5)',
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--card-foreground))',
                    }}
                  >
                    <Phone size={18} className="text-amber-500" /> Llamar
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center transition-all shadow-sm z-10',
                isMenuOpen
                  ? 'bg-muted text-foreground rotate-45'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* ÁREA DE TEXTO / GRABACIÓN */}
        <div
          className={cn(
            'flex-1 relative flex items-center min-w-0 rounded-[24px] border px-4 transition-all shadow-inner',
            isRecording ? 'h-[44px]' : 'min-h-[40px] max-h-[120px]'
          )}
          style={{
            backgroundColor: isRecording ? 'hsl(var(--destructive) / 0.05)' : 'hsl(var(--muted))',
            borderColor: isRecording ? 'hsl(var(--destructive))' : 'hsl(var(--border))',
          }}
        >
          {isRecording ? (
            <div
              className="flex items-center w-full animate-in zoom-in-95"
              style={{ gap: 'var(--spacing-4)' }}
            >
              <button
                onClick={() => stopRecording(false)}
                className="text-destructive/50 hover:text-destructive"
              >
                <Trash2 size={18} />
              </button>
              <div className="flex-1 flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                <div className="flex gap-[3px]">
                  {[1, 2, 3, 4].map(i => (
                    <span
                      key={i}
                      className="w-[3px] h-3 bg-destructive/60 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-destructive font-black text-[11px] tabular-nums">
                  {Math.floor(recordingTime / 60)}:
                  {(recordingTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <button
                onClick={() => stopRecording(true)}
                className="w-7 h-7 rounded-full bg-destructive flex items-center justify-center text-white shadow-lg"
              >
                <Send size={12} fill="currentColor" />
              </button>
            </div>
          ) : (
            <div className="w-full relative flex items-center">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onKeyDown={handleKeyDown}
                onChange={handleInputChange}
                onFocus={() => setIsMenuOpen(false)}
                placeholder={placeholder}
                aria-label={t('accessibility.typeMessage')}
                aria-describedby="send-message-hint"
                aria-invalid={inputValue.length > MAX_CHARS}
                disabled={!isConnected}
                className="w-full bg-transparent text-sm py-2.5 outline-none resize-none overflow-hidden leading-tight pr-8 scrollbar-none disabled:opacity-50"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  color: 'hsl(var(--foreground))',
                }}
              />
              {/* Hint oculto para lectores de pantalla */}
              <span id="send-message-hint" className="sr-only">
                {t('accessibility.sendMessageHint')}
              </span>
              {inputValue.length > MAX_CHARS * 0.8 && (
                <span
                  className={cn(
                    'absolute right-0 text-[9px] font-bold tabular-nums',
                    inputValue.length >= MAX_CHARS ? 'text-destructive' : 'text-muted-foreground/40'
                  )}
                >
                  {MAX_CHARS - inputValue.length}
                </span>
              )}
            </div>
          )}
        </div>

        {/* BOTÓN DE ACCIÓN */}
        {!isRecording && (
          <>
            {inputValue.trim() || attachment ? (
              <button
                onClick={handleSend}
                disabled={!isConnected || (isCompressing && !!attachment)}
                className="h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md shadow-primary/20 shrink-0 disabled:opacity-30 disabled:grayscale"
                style={{ backgroundColor: brandColor }}
              >
                <Send size={18} className="text-white ml-0.5 fill-current" />
              </button>
            ) : config.enableAudio && onSendAttachment ? (
              <button
                onClick={startRecording}
                disabled={!isConnected}
                className="h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md shadow-primary/20 shrink-0 disabled:opacity-30 disabled:grayscale"
                style={{ backgroundColor: brandColor }}
              >
                <Mic size={20} strokeWidth={2.5} className="text-white" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!isConnected}
                className="h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md shadow-primary/20 shrink-0 disabled:opacity-30 disabled:grayscale"
                style={{ backgroundColor: brandColor }}
              >
                <Send size={18} className="text-white ml-0.5 fill-current" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
