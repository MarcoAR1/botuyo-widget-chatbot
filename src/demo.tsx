import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChatWidget } from './ChatWidget'
import './styles/globals.css'

// Demo configuration
const config = {
  serverUrl: process.env.VITE_SERVER_URL || 'http://localhost:8080',
  apiKey: process.env.VITE_API_KEY || 'demo_key_123',
  theme: {
    primaryColor: '#3b82f6',
    botName: 'Sarah',
    position: 'bottom-right' as const,
  },
  lang: 'es' as const,
  onReady: () => {
    console.log('✅ Chatbot ready!')
  },
  onMessage: (message: any) => {
    console.log('📨 New message:', message)
  },
  onError: (error: Error) => {
    console.error('❌ Chatbot error:', error)
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChatWidget {...config} />
  </React.StrictMode>,
)
