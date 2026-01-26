/**
 * Sistema de internacionalización del Chat Widget
 * Idiomas soportados: español, inglés, portugués, francés
 */

export const translations = {
  es: {
    // Estado de conexión
    online: 'En línea',
    offline: 'Desconectado',
    connecting: 'Conectando...',

    // Footer
    con_amor_paseo_libre: 'Con ❤️ por BotUyo',

    // Input area
    preview: 'Vista previa',
    fotos: 'Fotos',
    ubicacion: 'Ubicación',
    input_placeholder: 'Escribe un mensaje...',
    send: 'Enviar',
    attach_photo: 'Adjuntar foto',
    attach_location: 'Compartir ubicación',
    recording: 'Grabando...',

    // Errores
    rate_limit_exceeded: 'Has enviado demasiados mensajes. Espera un momento.',
    connection_error: 'Error de conexión',
    file_too_large: 'Archivo demasiado grande',
    invalid_file: 'Tipo de archivo no válido',

    // Extracted (común)
    extracted: {
      assistant: 'Asistente',
      anterior: 'Anterior',
      siguiente: 'Siguiente',
      cerrar: 'Cerrar',
      cerrar_chat: 'Cerrar chat',
      abrir_chat: 'Abrir chat',
      ver_ubicacion: 'Ver ubicación',
    },

    // Accesibilidad (A11y)
    accessibility: {
      closeChat: 'Cerrar ventana de chat',
      closeChatHint: 'Presiona Escape para cerrar',
      chatMessages: 'Mensajes del chat',
      messageHistory: 'Historial de mensajes',
      dialogDescription:
        'Ventana de chat con {{botName}}. Presiona Escape para cerrar. Usa Ctrl+Enter para enviar mensajes.',
      sendMessage: 'Enviar mensaje',
      sendMessageHint: 'Presiona Enter o Ctrl+Enter para enviar',
      typeMessage: 'Escribe tu mensaje aquí',
      botMessage: 'Mensaje del asistente',
      userMessage: 'Tu mensaje',
      messageFrom: 'Mensaje de {{sender}}',
      messageTime: 'Enviado {{time}}',
      newMessage: 'Nuevo mensaje recibido',
    },
  },
  en: {
    // Connection status
    online: 'Online',
    offline: 'Offline',
    connecting: 'Connecting...',

    // Footer
    con_amor_paseo_libre: 'With ❤️ by BotUyo',

    // Input area
    preview: 'Preview',
    fotos: 'Photos',
    ubicacion: 'Location',
    input_placeholder: 'Type a message...',
    send: 'Send',
    attach_photo: 'Attach photo',
    attach_location: 'Share location',
    recording: 'Recording...',

    // Errors
    rate_limit_exceeded: 'You have sent too many messages. Please wait.',
    connection_error: 'Connection error',
    file_too_large: 'File too large',
    invalid_file: 'Invalid file type',

    // Extracted (common)
    extracted: {
      assistant: 'Assistant',
      anterior: 'Previous',
      siguiente: 'Next',
      cerrar: 'Close',
      cerrar_chat: 'Close chat',
      abrir_chat: 'Open chat',
      ver_ubicacion: 'View location',
    },

    // Accessibility (A11y)
    accessibility: {
      closeChat: 'Close chat window',
      closeChatHint: 'Press Escape to close',
      chatMessages: 'Chat messages',
      messageHistory: 'Message history',
      dialogDescription:
        'Chat window with {{botName}}. Press Escape to close. Use Ctrl+Enter to send messages.',
      sendMessage: 'Send message',
      sendMessageHint: 'Press Enter or Ctrl+Enter to send',
      typeMessage: 'Type your message here',
      botMessage: 'Assistant message',
      userMessage: 'Your message',
      messageFrom: 'Message from {{sender}}',
      messageTime: 'Sent {{time}}',
      newMessage: 'New message received',
    },
  },
  pt: {
    // Estado da conexão
    online: 'Online',
    offline: 'Desconectado',
    connecting: 'Conectando...',

    // Rodapé
    con_amor_paseo_libre: 'Com ❤️ por BotUyo',

    // Área de entrada
    preview: 'Visualizar',
    fotos: 'Fotos',
    ubicacion: 'Localização',
    input_placeholder: 'Digite uma mensagem...',
    send: 'Enviar',
    attach_photo: 'Anexar foto',
    attach_location: 'Compartilhar localização',
    recording: 'Gravando...',

    // Erros
    rate_limit_exceeded: 'Você enviou muitas mensagens. Aguarde um momento.',
    connection_error: 'Erro de conexão',
    file_too_large: 'Arquivo muito grande',
    invalid_file: 'Tipo de arquivo inválido',

    // Extraído (comum)
    extracted: {
      assistant: 'Assistente',
      anterior: 'Anterior',
      siguiente: 'Próximo',
      cerrar: 'Fechar',
      cerrar_chat: 'Fechar chat',
      abrir_chat: 'Abrir chat',
      ver_ubicacion: 'Ver localização',
    },
  },
  fr: {
    // État de connexion
    online: 'En ligne',
    offline: 'Déconnecté',
    connecting: 'Connexion...',

    // Pied de page
    con_amor_paseo_libre: 'Avec ❤️ par BotUyo',

    // Zone de saisie
    preview: 'Aperçu',
    fotos: 'Photos',
    ubicacion: 'Emplacement',
    input_placeholder: 'Tapez un message...',
    send: 'Envoyer',
    attach_photo: 'Joindre une photo',
    attach_location: 'Partager la localisation',
    recording: 'Enregistrement...',

    // Erreurs
    rate_limit_exceeded: 'Vous avez envoyé trop de messages. Veuillez patienter.',
    connection_error: 'Erreur de connexion',
    file_too_large: 'Fichier trop volumineux',
    invalid_file: 'Type de fichier invalide',

    // Extrait (commun)
    extracted: {
      assistant: 'Assistant',
      anterior: 'Précédent',
      siguiente: 'Suivant',
      cerrar: 'Fermer',
      cerrar_chat: 'Fermer le chat',
      abrir_chat: 'Ouvrir le chat',
      ver_ubicacion: "Voir l'emplacement",
    },
  },
}

export type SupportedLocale = keyof typeof translations

// Detección automática de idioma
export function detectLanguage(): SupportedLocale {
  if (typeof navigator === 'undefined') return 'es'

  const browserLang = navigator.language.split('-')[0] as SupportedLocale
  return translations[browserLang] ? browserLang : 'es'
}
