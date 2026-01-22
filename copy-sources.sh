#!/bin/bash

# Script to copy chatbot source files from main app to CDN package

SOURCE_DIR="../src/chat-widget"
DEST_DIR="./src"

echo "📦 Copying chatbot source files..."

# Create directories
mkdir -p "$DEST_DIR/components"
mkdir -p "$DEST_DIR/hooks"
mkdir -p "$DEST_DIR/types"
mkdir -p "$DEST_DIR/utils"

# Copy main files
echo "  → Copying main files..."
cp "$SOURCE_DIR/ChatWidget.tsx" "$DEST_DIR/"
cp "$SOURCE_DIR/types/index.ts" "$DEST_DIR/types/"
cp "$SOURCE_DIR/types/socket.ts" "$DEST_DIR/types/" 2>/dev/null || echo "    ℹ socket.ts not found, skipping"

# Copy components
echo "  → Copying components..."
cp "$SOURCE_DIR/components/ChatWindow.tsx" "$DEST_DIR/components/"
cp "$SOURCE_DIR/components/InputArea.tsx" "$DEST_DIR/components/"
cp "$SOURCE_DIR/components/MessageList.tsx" "$DEST_DIR/components/"
cp "$SOURCE_DIR/components/MessageBubble.tsx" "$DEST_DIR/components/"
cp "$SOURCE_DIR/components/AudioPlayer.tsx" "$DEST_DIR/components/"
cp "$SOURCE_DIR/components/Gallery.tsx" "$DEST_DIR/components/"
cp "$SOURCE_DIR/components/Launcher.tsx" "$DEST_DIR/components/"
cp "$SOURCE_DIR/components/TypingIndicator.tsx" "$DEST_DIR/components/"
cp "$SOURCE_DIR/components/index.ts" "$DEST_DIR/components/" 2>/dev/null || echo "    ℹ index.ts not found, skipping"

# Copy hooks
echo "  → Copying hooks..."
cp "$SOURCE_DIR/hooks/useChatState.ts" "$DEST_DIR/hooks/"
cp "$SOURCE_DIR/hooks/useChatSocket.ts" "$DEST_DIR/hooks/"
cp "$SOURCE_DIR/hooks/useIsMobile.ts" "$DEST_DIR/hooks/"
cp "$SOURCE_DIR/hooks/useSEOMetadata.ts" "$DEST_DIR/hooks/" 2>/dev/null || echo "    ℹ useSEOMetadata.ts not found, skipping"

# Copy utils
echo "  → Copying utils..."
cp "$SOURCE_DIR/utils/theme.ts" "$DEST_DIR/utils/"
cp "$SOURCE_DIR/utils/deviceId.ts" "$DEST_DIR/utils/"

echo ""
echo "✅ Files copied successfully!"
echo ""
echo "⚠️  IMPORTANT: You need to manually adjust imports:"
echo "   - Change '@/lib/utils' to './utils/cn'"
echo "   - Change '@/utils/*' to './utils/*'"
echo "   - Remove next-intl dependencies and replace with static strings"
echo "   - Remove Next.js specific imports"
echo ""
echo "🔧 Run 'npm install' to install dependencies"
echo "🚀 Run 'npm run dev' to start development server"
echo "📦 Run 'npm run build' to build for production"
