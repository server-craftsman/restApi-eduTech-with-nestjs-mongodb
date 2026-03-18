# Redis Cache & Rate Limiting - Deployment Checklist

## ✅ Pre-Deployment

### Development Setup
- [ ] Redis packages installed (`npm install redis...`)
- [ ] `.env.development` configured with Redis settings
- [ ] Local Redis running (`redis-cli ping` returns PONG)
- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] App starts without errors (`npm run start:dev`)

### Testing
- [ ] GET endpoints return X-Cache headers
  ```bash
  curl -i http://localhost:3000/api/lessons
  # Check: X-Cache: MISS (1st), X-Cache: HIT (2nd)
  ```
- [ ] Rate limiting working on auth endpoints
  ```bash
  # Make 6 login attempts
  # 6th request returns 429 Too Many Requests
  ```
- [ ] Cache invalidation works
  ```bash
  # Create lesson, verify search cache cleared
  ```
- [ ] Health check endpoint works
  ```bash
  curl http://localhost:3000/api/admin/cache/health
  # Response: true
  ```

---

## 🚀 Production Deployment (Upstash)

### 1. Upstash Setup
- [ ] Account created at https://console.upstash.com
- [ ] Database created
  - [ ] Name: `edutech-redis`
  - [ ] Region: Singapore/Tokyo (optimal for VN)
  - [ ] Eviction Policy: `allkeys-lru`
- [ ] Connection URL copied
  ```
  Format: redis://:password@hostname:port
  ```

### 2. Environment Configuration
- [ ] `.env.production` created with:
  ```env
  REDIS_URL=redis://:password@hostname:port
  NODE_ENV=production
  CACHE_ENABLED=true
  RATE_LIMIT_ENABLED=true
  ```
- [ ] `.env.production` NOT committed to git
- [ ] `.env.production` added to production server via:
  - [ ] CI/CD secrets (GitHub, GitLab, etc.)
  - [ ] Environment variables in hosting platform
  - [ ] `.gitignore` includes `.env.production`

### 3. Build Verification
- [ ] Clean build passes
  ```bash
  rm -rf dist node_modules
  npm install
  npm run build
  npx tsc --noEmit
  ```
- [ ] No TypeScript errors
- [ ] No ESLint errors related to cache

### 4. Deployment
- [ ] Application deployed to production
- [ ] `REDIS_URL` environment variable set on server
- [ ] Application starts without Redis connection errors
- [ ] Health check endpoint responds
  ```bash
  curl https://api.yourdomain.com/api/admin/cache/health
  ```

---

## 🧪 Post-Deployment Validation

### Smoke Tests
- [ ] GET endpoints return X-Cache headers
  ```bash
  curl -i https://api.yourdomain.com/api/lessons
  # Check: X-Cache header present
  ```
- [ ] Cache headers include proper max-age
  ```bash
  curl -i https://api.yourdomain.com/api/courses
  # Check: Cache-Control: public, max-age=900
  ```
- [ ] Repeated requests show cache hits
  ```bash
  # First request: X-Cache: MISS
  # Second request: X-Cache: HIT
  ```

### Rate Limiting Tests
- [ ] Auth endpoints are rate limited
  ```bash
  # Make 6 rapid login attempts
  # 6th returns: 429 Too Many Requests
  ```
- [ ] Rate limit headers included
  ```bash
  curl -i https://api.yourdomain.com/api/auth/login
  # Check: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After
  ```
- [ ] Different endpoints have different limits
  - [ ] Auth: 5/15min
  - [ ] Upload: 20/hour
  - [ ] API: 60/min

### Performance Tests
- [ ] Response times are improved
  - [ ] GET endpoints: <100ms (vs. 200-300ms before)
  - [ ] With cache hit: <20ms
- [ ] Database connection pool not exhausted
  - [ ] Monitor: `DB_POOL_SIZE` setting
  - [ ] Max connections: <50 (reduced from 100+)

### Monitoring
- [ ] Upstash dashboard shows activity
  - [ ] Total commands: expected number
  - [ ] Memory usage: <50MB (free tier: 10GB)
- [ ] Application logs show cache operations
  ```
  [Cache HIT] lesson:123
  [Cache MISS] course:456
  [Rate limit exceeded] ip:192.168.1.1
  ```
- [ ] No connection errors in logs

---

## 📊 Monitoring & Maintenance

### Daily Checks
- [ ] Upstash console accessible
  - [ ] No connection errors
  - [ ] Memory usage normal (<50%)
- [ ] Application logs clean (no Redis errors)
- [ ] Cache hit ratio >70%
- [ ] Rate limit violations logged but acceptable

### Weekly Checks
- [ ] Cache memory usage trending (should be stable)
- [ ] No stuck connections (max connections <80%)
- [ ] Rate limit violations < 1% of traffic
- [ ] Performance metrics stable
- [ ] Upstash quotas sufficient (commands/day)

### Monthly Reviews
- [ ] Upstash billing within budget
- [ ] Cache TTLs optimized for usage patterns
- [ ] Rate limits adjusted if needed
- [ ] Consider tier upgrade if approaching limits
- [ ] Review slow queries that could benefit from caching

---

## 🔐 Security Checklist

- [ ] REDIS_URL contains strong password
  - [ ] Length: >20 characters
  - [ ] Mix: uppercase, lowercase, numbers, symbols
- [ ] REDIS_URL never exposed in logs
- [ ] `.env.production` not in version control
- [ ] CI/CD secrets properly configured
- [ ] Sensitive endpoints rate limited
  - [ ] `/auth/login` - 5/15min
  - [ ] `/auth/password-reset` - 3/hour
  - [ ] `/api/upload` - 20/hour
- [ ] Cache doesn't store sensitive data
  - [ ] User passwords ❌
  - [ ] Auth tokens ❌
  - [ ] Payment info ❌
  - [ ] Public data only ✅

---

## 🚨 Rollback Plan

If Redis cache causes issues:

### Quick Rollback
1. Disable Redis in environment:
   ```env
   CACHE_ENABLED=false
   RATE_LIMIT_ENABLED=false
   ```
2. Redeploy application
3. App falls back to database queries
4. Performance reduced but functional
5. Investigate issue without time pressure

### Troubleshooting Before Rollback
- [ ] Redis connection working
  ```bash
  redis-cli -u $REDIS_URL ping  # Should return PONG
  ```
- [ ] No memory exceeded errors in Upstash
- [ ] No command quota exceeded
- [ ] Application has correct REDIS_URL

---

## 📈 Success Metrics

### Expected Improvements (30 days after deployment)

**Response Time**
- [ ] GET endpoints: <100ms average (vs. 200-300ms)
- [ ] API throughput: +8-10x
- [ ] P99 latency: <500ms (vs. 1-2 seconds)

**System Performance**
- [ ] Database connections: -70%
- [ ] CPU usage: -40%
- [ ] Memory usage: -30%
- [ ] Cache hit ratio: >70%

**User Experience**
- [ ] Page load time: <1 second
- [ ] API response perceived as "instant"
- [ ] Zero rate limit complaints (if configured right)
- [ ] Search results: <50ms response

---

## 📞 Troubleshooting Escalation

### If GET endpoints not caching
1. Check Redis connection: `redis-cli ping`
2. Verify CACHE_ENABLED=true
3. Check Upstash memory not exceeded
4. Restart application
5. If persists: disable caching and investigate

### If Rate limiting too strict
1. Check RATE_LIMIT_MAX_REQUESTS values
2. Verify endpoint has correct @RateLimit type
3. Check if legitimate traffic is being blocked
4. Adjust limits if needed and redeploy

### If Upstash quota exceeded
1. Reduce cache TTL values
2. Implement cache warming strategy
3. Upgrade Upstash tier
4. Monitor command count daily

---

## 🎯 Post-Launch (Week 1-2)

- [ ] Monitor application logs for errors
- [ ] Check Upstash dashboard daily
- [ ] Validate response times improved
- [ ] Confirm rate limiting working
- [ ] Gather user feedback on performance
- [ ] Make TTL adjustments if needed
- [ ] Document any issues encountered

---

## 📋 Sign-Off

- **Deployment Date**: _______________
- **Deployed By**: _______________
- **Verification Date**: _______________
- **Verified By**: _______________
- **Status**: ☐ READY ☐ ISSUES ☐ ROLLBACK

**Notes**:
```
_________________________________
_________________________________
_________________________________
```

---

**Next Review Date**: _______________

**Success Criteria Met**: YES / NO

If NO, describe issues and rollback status.
