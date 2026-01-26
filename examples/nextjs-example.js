"use strict";
// @ts-nocheck
/**
 * Ejemplo de uso del Chat Widget en Next.js 13+ (App Router)
 * Con TypeScript, Server Components y Client Components
 *
 * ⚠️ NOTA: Este archivo contiene MÚLTIPLES EJEMPLOS de código en secciones separadas.
 * NO está diseñado para ejecutarse directamente - es un archivo de REFERENCIA.
 * Copia las secciones individuales que necesites a tus propios archivos.
 *
 * Los errores de "Duplicate identifier" son esperados porque hay múltiples
 * ejemplos de imports en diferentes secciones del mismo archivo.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
exports.default = HomePage;
exports.ChatButton = ChatButton;
exports.default = ProductPage;
// ========== app/layout.tsx (Root Layout) ==========
var chat_widget_standalone_1 = require("@botuyo/chat-widget-standalone");
require("./globals.css");
exports.metadata = {
    title: 'Mi App con Chat Widget',
    description: 'Ejemplo de integración del Chat Widget en Next.js',
};
function RootLayout(_a) {
    var children = _a.children;
    return (<html lang="es">
      <body>
        <chat_widget_standalone_1.ChatWidgetProvider apiKey={process.env.NEXT_PUBLIC_CHAT_API_KEY} apiBaseUrl={process.env.NEXT_PUBLIC_CHAT_API_URL} theme={{
            primaryColor: '#10b981',
            botName: 'Asistente BotUyo',
            position: 'bottom-right',
            welcomeMessage: '¡Hola! 👋 ¿Cómo puedo ayudarte?',
            bubbleStyles: {
                launcher: {
                    pulse: true
                }
            }
        }} includeSEOMetadata={true} onNavigate={function (url) {
            // Next.js navigation
            window.location.href = url;
        }}>
          {children}
        </chat_widget_standalone_1.ChatWidgetProvider>
      </body>
    </html>);
}
// ========== app/page.tsx (Homepage - Server Component) ==========
var ChatButton_1 = require("@/components/ChatButton");
function HomePage() {
    return (<main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">
          Next.js + Chat Widget
        </h1>
        
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Bienvenido</h2>
          <p className="text-gray-600 mb-6">
            Este es un ejemplo de integración del Chat Widget en Next.js 13+
            usando el App Router y Server/Client Components.
          </p>
          
          {/* Client Component con control del chat */}
          <ChatButton_1.ChatButton />
        </div>
      </div>
    </main>);
}
// ========== components/ChatButton.tsx (Client Component) ==========
'use client';
var chat_widget_standalone_2 = require("@botuyo/chat-widget-standalone");
function ChatButton() {
    var chat = (0, chat_widget_standalone_2.useChatWidget)();
    return (<div className="space-y-4">
      <div className="flex gap-3">
        <button onClick={chat.open} className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition">
          Abrir Chat
        </button>

        <button onClick={function () { return chat.sendMessage('Hola, necesito información'); }} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition">
          Mensaje Rápido
        </button>
      </div>

      {chat.unreadCount > 0 && (<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Tienes {chat.unreadCount} mensaje(s) nuevo(s)
          </p>
        </div>)}
    </div>);
}
// ========== app/products/[id]/page.tsx (Dynamic Route con Context) ==========
'use client';
function ProductPage(_a) {
    var params = _a.params;
    return (<chat_widget_standalone_1.ChatWidgetProvider apiKey={process.env.NEXT_PUBLIC_CHAT_API_KEY} apiBaseUrl={process.env.NEXT_PUBLIC_CHAT_API_URL} pageContext={{
            page: 'Product',
            productId: params.id,
            url: window.location.href,
            // Cualquier información relevante del producto
        }} theme={{
            primaryColor: '#10b981',
            welcomeMessage: "\u00BFTienes preguntas sobre este producto? \uD83D\uDECD\uFE0F",
        }}>
      <div>
        <h1>Producto {params.id}</h1>
        {/* Contenido del producto */}
      </div>
    </chat_widget_standalone_1.ChatWidgetProvider>);
}
// ========== .env.local ==========
/*
NEXT_PUBLIC_CHAT_API_KEY=your-api-key-here
NEXT_PUBLIC_CHAT_API_URL=https://api.botuyo.com
*/
// ========== next.config.js ==========
/*
/** @type {import('next').NextConfig} *\/
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@botuyo/chat-widget-standalone'],
}

module.exports = nextConfig
*/
// ========== tsconfig.json ==========
/*
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**\/*.ts", "**\/*.tsx", ".next/types/**\/*.ts"],
  "exclude": ["node_modules"]
}
*/
// ========== package.json ==========
/*
{
  "name": "nextjs-chat-widget-example",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@botuyo/chat-widget-standalone": "^1.0.0",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
*/
