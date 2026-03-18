# Redis Cache & Rate Limiting - Installation & Setup Guide

## 📦 Step 1: Cài Đặt Dependencies

Chạy command này để cài đặt tất cả Redis packages:

```bash
npm install redis ioredis @nestjs/cache-manager cache-manager cache-manager-redis-store
```

**Packages được cài đặt:**
- `redis`: Official Redis client
- `ioredis`: Production-grade Redis client
- `@nestjs/cache-manager`: NestJS cache management
- `cache-manager`: Universal cache library
- `cache-manager-redis-store`: Redis store for cache-manager

## 🔧 Step 2: Environment Configuration

### Development (Local Redis)

Tạo hoặc cập nhật `.env.development`:

```env
NODE_ENV=development

# Local Redis
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
```

### Production (Upstash Redis)

Tạo hoặc cập nhật `.env.production`:

```env
NODE_ENV=production

# Upstash Redis (Single URL)
REDIS_URL=redis://:your_password@hostname.upstash.io:38395

# Cache Settings
CACHE_ENABLED=true
CACHE_STORE=redis
CACHE_MAX_ITEMS=100

# Rate Limiting
RATE_LIMIT_ENABLED=true
```

## 🚀 Step 3: Setup Upstash (Production)

### 1. Create Upstash Account

- Truy cập: https://console.upstash.com
- Sign up (free tier available)
- Confirm email

### 2. Create Redis Database

1. Click "Create Database"
2. Điền thông tin:
   - **Name**: `edutech-redis` (hoặc tùy chọn)
   - **Region**: Singapore hoặc Tokyo (gần VN)
   - **Eviction Policy**: `allkeys-lru`
3. Click "Create"

### 3. Copy Connection URL

1. Vào database vừa tạo
2. Nhấn "Copy" nút **Redis CLI URL**
3. Format: `redis://:password@hostname:port`
4. Paste vào **REDIS_URL** trong `.env.production`

### 4. Test Connection (Optional)

```bash
# Sử dụng redis-cli
redis-cli -u "redis://:password@hostname:port" ping
# Response: PONG
```

## 🐳 Step 4: Setup Local Redis (Development)

### Option A: Docker (Recommended)

```bash
# Pull & run Redis
docker run -d --name edutech-redis -p 6379:6379 redis:latest

# Verify
docker exec edutech-redis redis-cli ping
# Response: PONG
```

### Option B: Direct Installation

**Windows:**
1. Download từ: https://github.com/microsoftarchive/redis/releases
2. Install exe
3. Redis chạy automatically

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

### Verify Redis Running

```bash
redis-cli ping
# Response: PONG

redis-cli info
# Response: Redis server details
```

## ✅ Step 5: Verify Configuration

```bash
# Build application
npm run build

# Run TypeScript check
npx tsc --noEmit

# Start development server
npm run start:dev
```

Nếu không có errors, cấu hình thành công!

## 📊 Step 6: Monitor Cache

### Health Check Endpoint

```bash
# Thêm endpoint này vào admin controller
@Get('cache/health')
async cacheHealth() {
  return await this.cacheService.healthCheck();
}

# Test
curl http://localhost:3000/api/cache/health
# Response: true | false
```

### View Cache Statistics

```bash
@Get('cache/stats')
async getCacheStats() {
  return await this.cacheService.getStats();
}

# Test
curl http://localhost:3000/api/cache/stats
```

## 🎯 Usage Examples

### A. Auto Caching (GET endpoints)

Không cần code, tự động cache:

```bash
# First request - từ database
curl http://localhost:3000/api/lessons?page=1
# Headers: X-Cache: MISS

# Subsequent requests - từ cache
curl http://localhost:3000/api/lessons?page=1
# Headers: X-Cache: HIT
```

### B. Manual Cache Control

```typescript
import { CacheService } from '@core/cache';

constructor(private cache: CacheService) {}

async getData() {
  // Cache-aside pattern
  return this.cache.getOrFetch(
    'key',
    () => this.database.getData(),
    300, // TTL: 5 minutes
  );
}

async invalidateCache() {
  // Invalidate pattern
  await this.cache.invalidatePattern('lesson:');
}
```

### C. Rate Limiting

```typescript
import { RateLimitGuard, RateLimit } from '@core/cache';

@UseGuards(RateLimitGuard)
@RateLimit('UPLOAD') // 20 uploads/hour
@Post('upload')
async upload(@UploadedFile() file: Express.Multer.File) { }
```

## 🔐 Security Checklist

- [ ] REDIS_URL không committed (.gitignore)
- [ ] Password trong Upstash complex
- [ ] Eviction policy set (allkeys-lru)
- [ ] Rate limit configured per endpoint
- [ ] Cache không store sensitive data
- [ ] Upstash firewall rules configured

## 📈 Performance Monitoring

### Metrics to Track

```typescript
// Response time
Response Time: Before=200ms, After=50ms (75% improvement)

// Cache hit ratio (target: 70%+)
Cache Hit Rate: (HIT / (HIT + MISS)) * 100

// API throughput
Requests/min: Before=100, After=600 (6x increase)

// Database load
DB Connections: Before=50, After=15 (70% reduction)
```

## 🚨 Troubleshooting

### Error: ECONNREFUSED (port 6379)

```bash
# Check if Redis running
redis-cli ping

# If error, start Redis
redis-server

# Or with Docker
docker start edutech-redis
```

### Error: Invalid REDIS_URL

```
Valid: redis://:password@host:port
Invalid: redis://password@host:port (missing colon)
```

### Cache Not Working

1. Verify: `redis-cli ping` returns PONG
2. Check: REDIS_HOST/REDIS_URL in .env
3. Restart: `npm run start:dev`
4. Test: `curl http://localhost:3000/api/cache/health`

### Rate Limit Not Blocking

```bash
# Make 6 requests to auth endpoint
for i in {1..6}; do 
  curl -X POST http://localhost:3000/api/auth/login
done

# 6th request should return 429 Too Many Requests
```

## 📚 Next Steps

1. **Apply to Endpoints** - Thêm @RateLimit decorators
2. **Optimize TTLs** - Adjust per entity type
3. **Add Monitoring** - Track cache performance
4. **Setup Alerts** - When cache fails
5. **Load Testing** - Verify performance gains

## 💡 Tips for Best Performance

1. **Cache frequently accessed data** (lessons, courses, subjects)
2. **Short TTL for changing data** (quiz attempts, progress)
3. **Long TTL for static data** (course descriptions)
4. **Invalidate on create/update** - Keep cache fresh
5. **Monitor hit ratio** - Target 70%+ for optimal speed

## 📞 Support Resources

- **Upstash Docs**: https://upstash.com/docs
- **NestJS Cache**: https://docs.nestjs.com/techniques/caching
- **Redis Docs**: https://redis.io/docs
- **Community**: Stack Overflow + GitHub Issues

---

**Deployment Status:**
- [ ] Dependencies installed
- [ ] .env configured
- [ ] Upstash account created
- [ ] Upstash database created
- [ ] REDIS_URL obtained
- [ ] Health check passing
- [ ] Cache working (X-Cache headers)
- [ ] Rate limiting active
- [ ] Performance monitored
