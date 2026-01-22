'use client'

import { useState, useRef } from 'react'
import { useTranslations } from '@/chat-widget/i18n'
import {
  Send,
  Plus,
  Image as ImageIcon,
  MapPin,
  Mic,
  X,
  Trash2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPrimaryColor } from '../utils/theme'
import imageCompression from 'browser-image-compression'

// --- CONFIGURACIÓN ---
const MAX_CHARS = 1000

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
  onSendMessage: (message: string) => void
  onSendAttachment?: (file: File, type: 'image' | 'audio' | 'file') => void
  onSendLocation?: (location: { latitude: number; longitude: number }) => void
}

export function InputArea({
  isConnected,
  placeholder = 'Escribe un mensaje...',
  primaryColor,
  onSendMessage,
  onSendAttachment,
  onSendLocation,
}: InputAreaProps) {
  const t = useTranslations('common.extracted')
  const [inputValue, setInputValue] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const brandColor = getPrimaryColor({ primaryColor })

  // 🔥 LÓGICA DE ENVÍO CORREGIDA
  const handleSend = () => {
    const trimmedValue = inputValue.trim()

    if (attachment) {
      onSendAttachment?.(attachment.file, attachment.type)
      setAttachment(null)
      setInputValue('')
    } else if (trimmedValue && isConnected) {
      onSendMessage(trimmedValue)
      setInputValue('')
    }

    // Resetear altura del textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px'
    }
  }

  // 🔥 CAPTURA DE ENTER (Corregido)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_CHARS)
    setInputValue(val)

    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px'
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120,
      )}px`
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsMenuOpen(false)

    if (!file.type.startsWith('image/')) {
      setAttachment({ type: 'file', file, previewUrl: '' })
      return
    }

    setIsCompressing(true)
    try {
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
      setAttachment({
        type: 'image',
        file,
        previewUrl: URL.createObjectURL(file),
      })
    } finally {
      setIsCompressing(false)
    }
  }

  const startRecording = async () => {
    if (!isConnected) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data)
      mediaRecorder.onstop = () => {
        const audioFile = new File(
          [new Blob(audioChunksRef.current)],
          'voice.webm',
          { type: 'audio/webm' },
        )
        onSendAttachment?.(audioFile, 'audio')
      }
      mediaRecorder.start()
      setIsRecording(true)
      timerRef.current = setInterval(() => setRecordingTime((v) => v + 1), 1000)
    } catch (err) {
      alert('Micrófono denegado o no disponible')
    }
  }

  const stopRecording = (send: boolean) => {
    if (mediaRecorderRef.current) {
      if (!send) mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop())
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
    setRecordingTime(0)
  }

  return (
    <div className="w-full bg-background/95 backdrop-blur-md px-4 py-3 border-t border-border/40 relative">
      {/* PREVIEW DE ADJUNTO */}
      {(attachment || isCompressing) && (
        <div className="absolute bottom-full left-4 mb-2 p-1.5 bg-card rounded-2xl border border-border shadow-soft-2xl animate-in slide-in-from-bottom-2 z-50">
          <div className="relative w-16 h-16">
            {isCompressing ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-xl">
                <Loader2 className="animate-spin text-primary h-5 w-5" />
              </div>
            ) : (
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
            )}
          </div>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      <div className="flex items-center gap-3 max-w-full">
        {/* BOTÓN PLUS / MENÚ */}
        <div className="relative shrink-0">
          {isMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 z-[60]">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 px-5 py-3 bg-card border border-border shadow-soft-2xl rounded-2xl hover:bg-muted transition-colors text-[10px] font-black uppercase tracking-widest text-foreground"
              >
                <ImageIcon size={18} className="text-blue-500" /> {t('fotos')}
              </button>
              <button
                onClick={() => {
                  setIsLoadingLocation(true)
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      onSendLocation?.({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                      })
                      setIsLoadingLocation(false)
                      setIsMenuOpen(false)
                    },
                    () => setIsLoadingLocation(false),
                  )
                }}
                className="flex items-center gap-3 px-5 py-3 bg-card border border-border shadow-soft-2xl rounded-2xl hover:bg-muted transition-colors text-[10px] font-black uppercase tracking-widest text-foreground"
              >
                {isLoadingLocation ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <MapPin size={18} className="text-emerald-500" />
                )}{' '}
                {t('ubicacion')}
              </button>
            </div>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center transition-all shadow-sm z-10',
              isMenuOpen
                ? 'bg-muted text-foreground rotate-45'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted',
            )}
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* ÁREA DE TEXTO / GRABACIÓN */}
        <div
          className={cn(
            'flex-1 relative flex items-center min-w-0 rounded-[24px] border border-border/50 px-4 transition-all focus-within:bg-background focus-within:ring-1 focus-within:ring-primary/20 shadow-inner',
            isRecording
              ? 'bg-destructive/5 border-destructive/20 h-[44px]'
              : 'bg-muted/40 min-h-[40px] max-h-[120px]',
          )}
        >
          {isRecording ? (
            <div className="flex items-center w-full gap-4 animate-in zoom-in-95">
              <button
                onClick={() => stopRecording(false)}
                className="text-destructive/50 hover:text-destructive"
              >
                <Trash2 size={18} />
              </button>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex gap-[3px]">
                  {[1, 2, 3, 4].map((i) => (
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
                className="w-full bg-transparent text-sm py-2.5 outline-none resize-none overflow-hidden leading-tight text-foreground placeholder:text-muted-foreground/60 pr-8 scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              />
              {inputValue.length > MAX_CHARS * 0.8 && (
                <span
                  className={cn(
                    'absolute right-0 text-[9px] font-bold tabular-nums',
                    inputValue.length >= MAX_CHARS
                      ? 'text-destructive'
                      : 'text-muted-foreground/40',
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
            ) : (
              <button
                onClick={startRecording}
                disabled={!isConnected}
                className="h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md shadow-primary/20 shrink-0 disabled:opacity-30 disabled:grayscale"
                style={{ backgroundColor: brandColor }}
              >
                <Mic size={20} strokeWidth={2.5} className="text-white" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
