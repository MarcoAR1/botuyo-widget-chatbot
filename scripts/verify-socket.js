
import { io } from "socket.io-client";

const SOCKET_URL = "http://127.0.0.1:9090";

console.log(`🔌 Connecting to ${SOCKET_URL}...`);

const socket = io(SOCKET_URL, {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("✅ API Connectivity Verified: Connected to Socket Server");
  console.log(`   Session ID: ${socket.id}`);

  // Join room
  socket.emit("join_room", { apiKey: "test-key" });
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection Error:", err.message);
  process.exit(1);
});

socket.on("room_joined", (data) => {
  console.log("✅ Room joined:", data);
});

socket.on("bot_message", (msg) => {
  console.log("📩 Bot Message Received:", msg.content);
  if (msg.role === 'assistant') {
      console.log("✅ Verification Successful: Bot responded.");
      socket.disconnect();
      process.exit(0);
  }
});

// Timeout
setTimeout(() => {
    console.error("❌ Timeout: No response from bot.");
    process.exit(1);
}, 5000);
