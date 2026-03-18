#!/bin/bash

# EduTech Redis Cache & Rate Limiting - Quick Setup Script
# Usage: ./setup-redis-cache.sh

set -e

echo "🚀 EduTech Redis Cache & Rate Limiting Setup"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Node.js
echo -e "${BLUE}Step 1: Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not installed. Please install from https://nodejs.org/"
  exit 1
fi
echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"
echo ""

# Step 2: Check npm
echo -e "${BLUE}Step 2: Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
  echo "❌ npm not installed."
  exit 1
fi
echo -e "${GREEN}✓ npm version: $(npm --version)${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${BLUE}Step 3: Installing Redis packages...${NC}"
npm install redis ioredis @nestjs/cache-manager cache-manager cache-manager-redis-store
echo -e "${GREEN}✓ Redis packages installed${NC}"
echo ""

# Step 4: Create .env.development if not exists
echo -e "${BLUE}Step 4: Checking environment configuration...${NC}"
if [ ! -f .env.development ]; then
  echo "Creating .env.development..."
  cat > .env.development << 'EOF'
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cache Settings
CACHE_ENABLED=true
CACHE_STORE=redis
CACHE_MAX_ITEMS=100

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Other configs (keep existing)
MONGODB_URI=mongodb://127.0.0.1:27017/edutech
EOF
  echo -e "${GREEN}✓ .env.development created${NC}"
else
  echo -e "${YELLOW}⚠ .env.development already exists, skipping...${NC}"
fi
echo ""

# Step 5: Check Redis
echo -e "${BLUE}Step 5: Checking Redis connection...${NC}"
if command -v redis-cli &> /dev/null; then
  if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running locally${NC}"
    REDIS_STATUS="local"
  else
    echo -e "${YELLOW}⚠ Redis not running. Starting with Docker...${NC}"
    if command -v docker &> /dev/null; then
      docker run -d --name edutech-redis -p 6379:6379 redis:latest
      sleep 2
      echo -e "${GREEN}✓ Redis started with Docker${NC}"
      REDIS_STATUS="docker"
    else
      echo -e "${YELLOW}⚠ Docker not found. Please install Redis manually.${NC}"
      REDIS_STATUS="manual"
    fi
  fi
else
  echo -e "${YELLOW}⚠ redis-cli not found. Install Redis or use Docker.${NC}"
  REDIS_STATUS="manual"
fi
echo ""

# Step 6: Build TypeScript
echo -e "${BLUE}Step 6: Building TypeScript...${NC}"
npx tsc --noEmit
echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
echo ""

# Step 7: Summary
echo -e "${GREEN}=============================================="
echo "✅ Setup Complete!"
echo "============================================="${NC}
echo ""
echo "📝 Next Steps:"
echo "1. Start your application:"
echo "   ${BLUE}npm run start:dev${NC}"
echo ""
echo "2. For Production (Upstash):"
echo "   - Create .env.production with REDIS_URL from Upstash"
echo "   - See docs/REDIS_CACHE_SETUP.md for details"
echo ""
echo "3. Test Cache:"
echo "   - Make GET request: curl http://localhost:3000/api/lessons"
echo "   - Check X-Cache header (MISS, then HIT)"
echo ""
echo "4. Monitor:"
echo "   - Cache health: curl http://localhost:3000/api/admin/cache/health"
echo "   - Cache stats: curl http://localhost:3000/api/admin/cache/stats"
echo ""
echo "📚 Documentation:"
echo "   - Setup Guide: docs/REDIS_CACHE_SETUP.md"
echo "   - Installation: docs/INSTALLATION_GUIDE.md"
echo "   - Examples: docs/CACHE_EXAMPLE.md"
echo ""
echo "🚀 Happy caching!"
