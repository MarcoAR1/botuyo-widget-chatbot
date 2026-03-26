import { ChatWidget } from '@botuyo/chat-widget-standalone'

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Test App for BotUyo Widget</h1>
      <p>The widget should appear in the bottom right corner.</p>
      
      <ChatWidget 
        agentId="test-agent" 
        apiUrl="https://api.botuyo.com" 
        theme={{ defaultLocale: 'es' }}
      />
    </div>
  )
}

export default App
