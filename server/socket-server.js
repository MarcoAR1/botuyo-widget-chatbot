
import { Server } from "socket.io";
import { createServer } from "http";

const PORT = 9090;

const httpServer = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("BotUyo Socket Simulation Server Running");
});

// Use /webchat path to match the widget's socket configuration
const io = new Server(httpServer, {
  path: "/webchat",
  transports: ['websocket', 'polling'], // Support both transports
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

console.log(`🚀 Socket Server starting on port ${PORT}...`);

io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  console.log(`   Auth:`, socket.handshake.auth);

  // Emit connection_ack immediately - this is what the widget expects
  socket.emit("connection_ack", { 
    sessionId: socket.id,
    config: {
      botName: "Test Bot",
      welcomeMessage: "¡Hola! Soy tu asistente virtual premium."
    }
  });

  // Send welcome message after brief delay
  setTimeout(() => {
    socket.emit("bot_message", {
      id: `msg-${Date.now()}`,
      type: "text",
      sender: "bot",
      content: "¡Hola! Soy tu asistente virtual premium. ¿En qué puedo ayudarte hoy?",
      timestamp: new Date().toISOString()
    });
  }, 500);

  socket.on("user_message", (data, callback) => {
    console.log(`📩 [${socket.id}] user_message:`, data);
    
    // Acknowledge message receipt
    if (callback) callback({ success: true, id: data.id });

    // Show typing indicator
    socket.emit("bot_typing", true);

    // Simulate response delay
    setTimeout(() => {
      // Stop typing
      socket.emit("bot_typing", false);

      const lowerMsg = data.content ? data.content.toLowerCase() : "";
      let responseMsg = {
        id: `msg-${Date.now()}`,
        type: "text",
        sender: "bot",
        timestamp: new Date().toISOString(),
        content: ""
      };

      // Response logic based on keywords
      if (lowerMsg.includes("image") || lowerMsg.includes("imagen")) {
        responseMsg.type = "image";
        responseMsg.imageUrl = "https://images.unsplash.com/photo-1575936123452-b67c3203c357?q=80&w=1000&auto=format&fit=crop";
        responseMsg.content = "Aquí tienes una imagen de ejemplo:";
      } else if (lowerMsg.includes("audio")) {
        responseMsg.type = "audio";
        responseMsg.content = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      } else if (lowerMsg.includes("location") || lowerMsg.includes("ubicacion")) {
        responseMsg.type = "location";
        responseMsg.latitude = 40.416775;
        responseMsg.longitude = -3.703790;
        responseMsg.content = "Oficina Central";
      } else if (lowerMsg.includes("option") || lowerMsg.includes("opcion") || lowerMsg.includes("menu")) {
        responseMsg.content = "¿Qué tipo de soporte necesitas?\n\n• Soporte Técnico\n• Ventas\n• Facturación";
      } else if (lowerMsg.includes("file") || lowerMsg.includes("archivo")) {
        responseMsg.content = "📎 Aquí tienes el documento: documento-importante.pdf";
      } else {
        const responses = [
          "Entiendo, cuéntame más sobre eso.",
          "¡Interesante! Estamos trabajando en mejorar esa funcionalidad.",
          "Perfecto, he registrado tu solicitud.",
          "¿Te gustaría ver algunas opciones? Escribe 'opciones'.",
          "Puedes pedirme:\n• imagen\n• audio\n• ubicacion\n• opciones\n• archivo"
        ];
        responseMsg.content = responses[Math.floor(Math.random() * responses.length)];
      }

      socket.emit("bot_message", responseMsg);

    }, 1500);
  });

  socket.on("typing", (isTyping) => {
    console.log(`⌨️ [${socket.id}] typing:`, isTyping);
  });

  socket.on("request_history", () => {
    console.log(`📜 [${socket.id}] request_history`);
    socket.emit("chat_history", { messages: [] });
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} - Reason: ${reason}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n🎉 Server running at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket endpoint ready at /webchat`);
});
