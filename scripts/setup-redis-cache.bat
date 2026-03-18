@echo off
REM EduTech Redis Cache & Rate Limiting - Quick Setup Script (Windows)
REM Usage: .\setup-redis-cache.bat

setlocal enabledelayedexpansion

echo.
echo ============================================
echo EduTech Redis Cache Setup
echo ============================================
echo.

REM Step 1: Check Node.js
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install from https://nodejs.org/
  pause
  exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION%
echo.

REM Step 2: Check npm
echo [2/6] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found.
  pause
  exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION%
echo.

REM Step 3: Install dependencies
echo [3/6] Installing Redis packages...
call npm install redis ioredis @nestjs/cache-manager cache-manager cache-manager-redis-store
if errorlevel 1 (
  echo [ERROR] Failed to install packages
  pause
  exit /b 1
)
echo [OK] Redis packages installed
echo.

REM Step 4: Create .env.development
echo [4/6] Checking environment configuration...
if not exist .env.development (
  echo Creating .env.development...
  (
    echo NODE_ENV=development
    echo PORT=3000
    echo APP_URL=http://localhost:3000
    echo.
    echo # Redis Configuration
    echo REDIS_HOST=localhost
    echo REDIS_PORT=6379
    echo REDIS_PASSWORD=
    echo REDIS_DB=0
    echo.
    echo # Cache Settings
    echo CACHE_ENABLED=true
    echo CACHE_STORE=redis
    echo CACHE_MAX_ITEMS=100
    echo.
    echo # Rate Limiting
    echo RATE_LIMIT_ENABLED=true
    echo RATE_LIMIT_WINDOW_MS=900000
    echo RATE_LIMIT_MAX_REQUESTS=1000
    echo.
    echo # Database
    echo MONGODB_URI=mongodb://127.0.0.1:27017/edutech
  ) > .env.development
  echo [OK] .env.development created
) else (
  echo [SKIP] .env.development already exists
)
echo.

REM Step 5: Build TypeScript
echo [5/6] Building TypeScript...
call npx tsc --noEmit
if errorlevel 1 (
  echo [ERROR] TypeScript compilation failed
  pause
  exit /b 1
)
echo [OK] TypeScript compilation successful
echo.

REM Step 6: Summary
echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo IMPORTANT: Start Redis before running app
echo.
echo Option A: Docker (Recommended)
echo   docker run -d -p 6379:6379 redis:latest
echo.
echo Option B: Install Redis locally
echo   https://github.com/microsoftarchive/redis/releases
echo.
echo Then start your app:
echo   npm run start:dev
echo.
echo Test cache working:
echo   curl http://localhost:3000/api/lessons
echo   (Check X-Cache header: MISS first, then HIT)
echo.
echo For Production (Upstash):
echo   1. Create account at https://console.upstash.com
echo   2. Create Redis database
echo   3. Copy Redis URL to .env.production
echo.
pause
