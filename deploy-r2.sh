#!/bin/bash
set -e

echo "🚀 Deploying Paseo Libre Chatbot Widget to Cloudflare R2..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VERSION=${1:-v1}
BUCKET="chatbot-cdn"
PREFIX="${VERSION}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Error: wrangler CLI not found${NC}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Error: Not logged in to Cloudflare${NC}"
    echo "Login with: wrangler login"
    exit 1
fi

# Build
echo -e "${YELLOW}📦 Building widget...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: dist/ directory not found${NC}"
    exit 1
fi

# Verify files exist
FILES=("chatbot.umd.js" "chatbot.es.js" "chatbot.css" "index.d.ts")
for file in "${FILES[@]}"; do
    if [ ! -f "dist/$file" ]; then
        echo -e "${RED}❌ Error: dist/$file not found${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Build successful${NC}"

# Upload files
echo -e "${YELLOW}⬆️  Uploading files to R2 (${PREFIX})...${NC}"

# chatbot.umd.js (for CDN)
echo "  → chatbot.umd.js"
wrangler r2 object put ${BUCKET}/${PREFIX}/chatbot.umd.js \
  --file dist/chatbot.umd.js \
  --content-type application/javascript \
  --cache-control "public, max-age=31536000, immutable"

# chatbot.es.js (for bundlers)
echo "  → chatbot.es.js"
wrangler r2 object put ${BUCKET}/${PREFIX}/chatbot.es.js \
  --file dist/chatbot.es.js \
  --content-type application/javascript \
  --cache-control "public, max-age=31536000, immutable"

# chatbot.css
echo "  → chatbot.css"
wrangler r2 object put ${BUCKET}/${PREFIX}/chatbot.css \
  --file dist/chatbot.css \
  --content-type text/css \
  --cache-control "public, max-age=31536000, immutable"

# index.d.ts (TypeScript definitions)
echo "  → index.d.ts"
wrangler r2 object put ${BUCKET}/${PREFIX}/index.d.ts \
  --file dist/index.d.ts \
  --content-type text/plain \
  --cache-control "public, max-age=31536000, immutable"

# Get file sizes
UMD_SIZE=$(wc -c < dist/chatbot.umd.js | tr -d ' ')
CSS_SIZE=$(wc -c < dist/chatbot.css | tr -d ' ')
TOTAL_SIZE=$((UMD_SIZE + CSS_SIZE))

# Convert to human readable
if [ $TOTAL_SIZE -gt 1048576 ]; then
    TOTAL_SIZE_HR=$(echo "scale=2; $TOTAL_SIZE / 1048576" | bc)"MB"
elif [ $TOTAL_SIZE -gt 1024 ]; then
    TOTAL_SIZE_HR=$(echo "scale=2; $TOTAL_SIZE / 1024" | bc)"KB"
else
    TOTAL_SIZE_HR="${TOTAL_SIZE}B"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📦 Files deployed:"
echo "  • chatbot.umd.js"
echo "  • chatbot.es.js"
echo "  • chatbot.css"
echo "  • index.d.ts"
echo ""
echo "📊 Total size: ${TOTAL_SIZE_HR}"
echo ""
echo "📍 URLs:"
echo "  • UMD: https://chatbot-cdn.r2.dev/${PREFIX}/chatbot.umd.js"
echo "  • ES:  https://chatbot-cdn.r2.dev/${PREFIX}/chatbot.es.js"
echo "  • CSS: https://chatbot-cdn.r2.dev/${PREFIX}/chatbot.css"
echo ""
echo -e "${YELLOW}💡 Custom domain:${NC}"
echo "  Configure custom domain in Cloudflare Dashboard:"
echo "  R2 → chatbot-cdn → Settings → Public buckets → Connect domain"
echo ""
echo "  Then use: https://cdn.paseolibre.com/${PREFIX}/chatbot.umd.js"
echo ""
echo -e "${GREEN}🎉 Done!${NC}"
