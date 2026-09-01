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

    // Cambio de agente/variante
    agent_switched: 'Ahora estás con {{name}}',

    // Input area
    preview: 'Vista previa',
    fotos: 'Fotos',
    camara: 'Cámara',
    ubicacion: 'Ubicación',
    input_placeholder: 'Escribe un mensaje...',
    send: 'Enviar',
    cancel: 'Cancelar',
    call: 'Llamar',
    call_confirm: '¿Iniciar llamada de voz?',
    attach_photo: 'Adjuntar foto',
    attach_location: 'Compartir ubicación',
    recording: 'Grabando...',

    // Errores
    rate_limit_exceeded: 'Has enviado demasiados mensajes. Espera un momento.',
    connection_error: 'Error de conexión',
    file_too_large: 'Archivo demasiado grande',
    invalid_file: 'Tipo de archivo no válido',

    // Tool approval (authenticated agents)
    copilot: {
      proposalLabel: 'Acción propuesta',
      confirm: 'Confirmar',
      cancel: 'Cancelar',
      confirmed: 'Confirmado',
      cancelled: 'Cancelado',
      expired: 'Expirada',
      ownerOnly: 'Solo administrador',
    },

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

    // Agent / variant switch
    agent_switched: 'Now chatting with {{name}}',

    // Input area
    preview: 'Preview',
    fotos: 'Photos',
    camara: 'Camera',
    ubicacion: 'Location',
    input_placeholder: 'Type a message...',
    send: 'Send',
    cancel: 'Cancel',
    call: 'Call',
    call_confirm: 'Start a voice call?',
    attach_photo: 'Attach photo',
    attach_location: 'Share location',
    recording: 'Recording...',

    // Errors
    rate_limit_exceeded: 'You have sent too many messages. Please wait.',
    connection_error: 'Connection error',
    file_too_large: 'File too large',
    invalid_file: 'Invalid file type',

    // Tool approval (authenticated agents)
    copilot: {
      proposalLabel: 'Proposed action',
      confirm: 'Confirm',
      cancel: 'Cancel',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      expired: 'Expired',
      ownerOnly: 'Admin only',
    },

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

    // Troca de agente/variante
    agent_switched: 'Agora você está com {{name}}',

    // Área de entrada
    preview: 'Visualizar',
    fotos: 'Fotos',
    camara: 'Câmera',
    ubicacion: 'Localização',
    input_placeholder: 'Digite uma mensagem...',
    send: 'Enviar',
    cancel: 'Cancelar',
    call: 'Ligar',
    call_confirm: 'Iniciar chamada de voz?',
    attach_photo: 'Anexar foto',
    attach_location: 'Compartilhar localização',
    recording: 'Gravando...',

    // Erros
    rate_limit_exceeded: 'Você enviou muitas mensagens. Aguarde um momento.',
    connection_error: 'Erro de conexão',
    file_too_large: 'Arquivo muito grande',
    invalid_file: 'Tipo de arquivo inválido',

    // Tool approval (authenticated agents)
    copilot: {
      proposalLabel: 'Ação proposta',
      confirm: 'Confirmar',
      cancel: 'Cancelar',
      confirmed: 'Confirmado',
      cancelled: 'Cancelado',
      expired: 'Expirada',
      ownerOnly: 'Apenas administrador',
    },

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

    // Acessibilidade (A11y)
    accessibility: {
      closeChat: 'Fechar janela de chat',
      closeChatHint: 'Pressione Escape para fechar',
      chatMessages: 'Mensagens do chat',
      messageHistory: 'Histórico de mensagens',
      dialogDescription:
        'Janela de chat com {{botName}}. Pressione Escape para fechar. Use Ctrl+Enter para enviar mensagens.',
      sendMessage: 'Enviar mensagem',
      sendMessageHint: 'Pressione Enter ou Ctrl+Enter para enviar',
      typeMessage: 'Digite sua mensagem aqui',
      botMessage: 'Mensagem do assistente',
      userMessage: 'Sua mensagem',
      messageFrom: 'Mensagem de {{sender}}',
      messageTime: 'Enviado {{time}}',
      newMessage: 'Nova mensagem recebida',
    },
  },
  fr: {
    // État de connexion
    online: 'En ligne',
    offline: 'Déconnecté',
    connecting: 'Connexion...',

    // Pied de page
    con_amor_paseo_libre: 'Avec ❤️ par BotUyo',

    // Changement d'agent/variante
    agent_switched: 'Vous discutez maintenant avec {{name}}',

    // Zone de saisie
    preview: 'Aperçu',
    fotos: 'Photos',
    camara: 'Caméra',
    ubicacion: 'Emplacement',
    input_placeholder: 'Tapez un message...',
    send: 'Envoyer',
    cancel: 'Annuler',
    call: 'Appeler',
    call_confirm: 'Démarrer un appel vocal?',
    attach_photo: 'Joindre une photo',
    attach_location: 'Partager la localisation',
    recording: 'Enregistrement...',

    // Erreurs
    rate_limit_exceeded: 'Vous avez envoyé trop de messages. Veuillez patienter.',
    connection_error: 'Erreur de connexion',
    file_too_large: 'Fichier trop volumineux',
    invalid_file: 'Type de fichier invalide',

    // Tool approval (authenticated agents)
    copilot: {
      proposalLabel: 'Action proposée',
      confirm: 'Confirmer',
      cancel: 'Annuler',
      confirmed: 'Confirmé',
      cancelled: 'Annulé',
      expired: 'Expirée',
      ownerOnly: 'Administrateur uniquement',
    },

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

    // Accessibilité (A11y)
    accessibility: {
      closeChat: 'Fermer la fenêtre de chat',
      closeChatHint: 'Appuyez sur Échap pour fermer',
      chatMessages: 'Messages du chat',
      messageHistory: 'Historique des messages',
      dialogDescription:
        'Fenêtre de chat avec {{botName}}. Appuyez sur Échap pour fermer. Utilisez Ctrl+Entrée pour envoyer des messages.',
      sendMessage: 'Envoyer un message',
      sendMessageHint: 'Appuyez sur Entrée ou Ctrl+Entrée pour envoyer',
      typeMessage: 'Tapez votre message ici',
      botMessage: "Message de l'assistant",
      userMessage: 'Votre message',
      messageFrom: 'Message de {{sender}}',
      messageTime: 'Envoyé {{time}}',
      newMessage: 'Nouveau message reçu',
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
