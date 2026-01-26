// @ts-nocheck
/**
 * Ejemplo de uso del Chat Widget en una aplicación React con TypeScript
 * Usando el ChatWidgetProvider para acceso global al estado del chat
 * 
 * NOTA: Este es código de ejemplo y no se incluye en el build de producción.
 */

import React from 'react';
import { 
  ChatWidgetProvider, 
  useChatWidget,
  type ChatWidgetProviderProps as _ChatWidgetProviderProps,
  type ChatTheme 
} from '@botuyo/chat-widget-standalone';

// ========== Configuración del Tema ==========
const chatTheme: ChatTheme = {
  primaryColor: '#10b981',
  botName: 'Asistente BotUyo',
  logoUrl: '/logo.png',
  position: 'bottom-right',
  welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte hoy?',
  inputPlaceholder: 'Escribe tu mensaje aquí...',
  borderRadius: '1rem',
  launcherBorderRadius: '50%',
  starterPrompt: '¿Necesitas ayuda? 💬',
  bubbleStyles: {
    radius: {
      bubble: 'rounded-2xl',
      image: 'rounded-xl',
      button: 'rounded-full',
      card: 'rounded-2xl'
    },
    bot: {
      bg: 'bg-gray-100',
      text: 'text-gray-900',
      border: 'border-gray-200'
    },
    launcher: {
      pulse: true
    }
  }
};

// ========== Componente con botones de control ==========
function ChatControls() {
  const chat = useChatWidget();

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Control del Chat</h2>
      
      <div className="space-y-3">
        <button
          onClick={chat.open}
          className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
        >
          🚀 Abrir Chat
        </button>

        <button
          onClick={chat.close}
          className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
        >
          ❌ Cerrar Chat
        </button>

        <button
          onClick={chat.toggle}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
        >
          🔄 Toggle Chat
        </button>

        <button
          onClick={() => chat.sendMessage('Hola, necesito ayuda con mi reserva')}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
        >
          💬 Mensaje Rápido
        </button>

        <button
          onClick={chat.clearMessages}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
        >
          🗑️ Limpiar Historial
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Estado:</h3>
        <ul className="space-y-1 text-sm">
          <li>
            Estado: <strong>{chat.isOpen ? '✅ Abierto' : '❌ Cerrado'}</strong>
          </li>
          <li>
            Mensajes sin leer: <strong className="text-green-600">{chat.unreadCount}</strong>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ========== Botón flotante personalizado (opcional) ==========
function _CustomFloatingButton() {
  const chat = useChatWidget();

  return (
    <button
      onClick={chat.toggle}
      className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition transform hover:scale-110"
      aria-label="Toggle Chat"
    >
      💬 
      {chat.unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
          {chat.unreadCount}
        </span>
      )}
    </button>
  );
}

// ========== Layout Principal ==========
function AppContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎉 Ejemplo React + TypeScript
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Este ejemplo muestra cómo integrar el Chat Widget en una aplicación React
            usando el <code className="bg-gray-200 px-2 py-1 rounded">ChatWidgetProvider</code> y 
            el hook <code className="bg-gray-200 px-2 py-1 rounded">useChatWidget()</code>.
          </p>
        </header>

        <div className="max-w-md mx-auto">
          <ChatControls />
        </div>

        {/* Botón flotante personalizado (opcional, el widget ya tiene uno) */}
        {/* <CustomFloatingButton /> */}
      </div>
    </div>
  );
}

// ========== App Root con Provider ==========
export default function App() {
  return (
    <ChatWidgetProvider
      // Configuración requerida
      apiKey={process.env.REACT_APP_CHAT_API_KEY || 'demo-api-key'}
      apiBaseUrl={process.env.REACT_APP_CHAT_API_URL || 'https://api.botuyo.com'}
      
      // Tema personalizado
      theme={chatTheme}
      
      // Contexto de página
      pageContext={{
        page: 'React Example',
        url: window.location.href,
        title: 'React TypeScript Example'
      }}
      
      // Metadata SEO automática
      includeSEOMetadata={true}
      
      // Estado inicial (opcional)
      initialState={{
        isOpen: false
      }}
      
      // Callbacks
      onStateChange={(isOpen) => {
        console.log('Chat widget:', isOpen ? 'opened' : 'closed');
      }}
      
      onNavigate={(url) => {
        console.log('Navigate to:', url);
        // Usar React Router aquí si lo necesitas
        window.location.href = url;
      }}
      
      onLogin={(userData) => {
        console.log('User logged in:', userData);
        // Guardar token, actualizar estado global, etc.
      }}
      
      onEvent={(eventName, data) => {
        console.log('Event:', eventName, data);
      }}
    >
      <AppContent />
    </ChatWidgetProvider>
  );
}

// ========== Tipos disponibles para importar ==========
/*
import type {
  ChatWidgetProps,
  ChatWidgetProviderProps,
  ChatWidgetContextValue,
  ChatTheme,
  BubbleStyles,
  UserContext,
  PageContext,
  ChatMessage,
  TextMessage,
  ImageMessage,
  AudioMessage,
  LocationMessage,
  AuthenticatedUser
} from '@botuyo/chat-widget-standalone';
*/
