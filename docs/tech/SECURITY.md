# Security Implementation Guide

This document describes the security measures implemented in the EduTech Backend API.

## 1. Parameter Security & Input Validation

### Sanitization Pipe (`src/core/pipes/sanitize-params.pipe.ts`)

All incoming request parameters are automatically sanitized to prevent:

- **NoSQL Injection**: Detects and blocks MongoDB operators like `$where`, `$ne`, `$gt`, etc.
- **XSS Attacks**: Removes or escapes HTML tags and quote characters
- **Null Byte Injection**: Strips null bytes from input strings
- **Template Injection**: Detects malicious patterns like `${...}` or `{$...}`

**How it works:**
```typescript
// ❌ BLOCKED - NoSQL injection attempt
GET /api/v1/users?filters={"roles":{"$ne":"ADMIN"}}

// ❌ BLOCKED - XSS attempt
POST /api/v1/lessons {"title":"<script>alert('xss')</script>"}

// ✅ ALLOWED - Safe parameters
GET /api/v1/users?filters={"email":"john@example.com"}
```

### Validation Pipe (Native NestJS)

Complementary to sanitization, all DTOs are validated with `class-validator`:
- **whitelist**: Removes unknown properties
- **forbidNonWhitelisted**: Throws error on unknown properties
- **transform**: Converts types as needed (string → number)

## 2. DDoS & Rate Limiting Protection

### Global Rate Limits

All endpoints are protected with rate limiting by default:

```
- General endpoints: 100 requests/minute per IP
- API endpoints: 50 requests/minute per IP
```

### Custom Limits (Per Endpoint)

High-risk endpoints use stricter limits:

```typescript
// Authentication endpoints: 5 attempts per 15 minutes
@Throttle({ default: { limit: 5, ttl: 900000 } })
@Post('auth/sign-in')
async signIn(@Body() dto: SignInDto) { ... }

// Payment endpoints: 10 per hour
@Throttle({ default: { limit: 10, ttl: 3600000 } })
@Post('payments/initiate')
async initiatePayment(@Body() dto: InitiatePaymentDto) { ... }

// Upload endpoints: 20 per hour
@Throttle({ default: { limit: 20, ttl: 3600000 } })
@Post('uploads')
async upload(@Body() file: Express.Multer.File) { ... }
```

### Rate Limit Headers

When rate limited, the response includes:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1234567890

{
  "statusCode": 429,
  "message": "Too many requests",
  "retryAfter": 45
}
```

## 3. Security Headers (Helmet)

All responses include security headers:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' https: data:
```

## 4. NoSQL Injection Prevention

The package `express-mongo-sanitize` automatically sanitizes request data:

```typescript
// Input with MongoDB operators
{
  "email": {"$ne": null},
  "username": {"$gt": ""}
}

// Automatically converted to
{
  "email": "$ne",
  "username": "$gt"
}
```

## 5. Payload Size Limits

Requests exceeding size limits are rejected:

```
- JSON body: 10MB max
- URL-encoded body: 10MB max
- Multipart uploads: Configured per endpoint
```

## 6. Swagger/OpenAPI Security

### Development Environment

- ✅ Swagger UI available at `/swagger`
- ✅ Full API documentation visible
- ✅ Try-it-out feature enabled

### Production Environment

- ⚠️ Swagger disabled by default
- 🔒 Requires API key or JWT to access (future enhancement)
- 📚 Documentation available via direct URL only

**Configuration in environment:**
```env
NODE_ENV=production  # Disables Swagger
NODE_ENV=development # Enables Swagger
```

## 7. CORS Configuration

Configurable per environment:

```env
CORS_ORIGIN=http://localhost:3000,https://app.example.com
```

**What's allowed:**
- Specified origins only
- Methods: GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS
- Headers: Content-Type, Accept, Authorization
- Credentials: Enabled

## 8. Error Handling & Information Disclosure

### Global Exception Filter

All errors are formatted consistently and sanitized:

```typescript
// Production (generic message)
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2025-03-10T10:30:00Z",
  "path": "/api/v1/users"
}

// Development (detailed message)
{
  "statusCode": 500,
  "message": "Database connection timeout",
  "error": "Error: ECONNREFUSED 127.0.0.1:27017",
  "timestamp": "2025-03-10T10:30:00Z",
  "path": "/api/v1/users"
}
```

## 9. Implementation Checklist

### For New Endpoints

- [x] Use `@UseGuards(JwtAuthGuard)` for protected endpoints
- [x] Add `@ApiBearerAuth()` for Swagger documentation
- [x] Create proper DTOs with validation decorators
- [x] Apply custom `@Throttle()` if rate limiting differs
- [x] Never log sensitive data (passwords, tokens, IDs)
- [x] Return consistent error responses

### Example Endpoint

```typescript
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentController {
  @Post('initiate')
  @Roles(UserRole.User)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Initiate payment' })
  @ApiResponse({ status: 201, type: PaymentInitiatedResponseDto })
  @ApiResponse({ status: 402, description: 'Payment required' })
  @ApiResponse({ status: 429, description: 'Rate limited' })
  async initiatePayment(
    @Body() dto: InitiatePaymentDto, // Auto-validated & sanitized
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<Response> {
    // Implementation
  }
}
```

## 10. Monitoring & Logging

### What Gets Logged

- ✅ HTTP method, path, status code, response time
- ✅ Failed authentication attempts
- ✅ Rate limit violations
- ✅ Validation errors with field details
- ✅ Database errors (connection, query issues)

### What Gets Hidden

- ❌ Request/response bodies (passwords, tokens)
- ❌ Authorization headers
- ❌ API keys or secrets
- ❌ System file paths
- ❌ Database credentials

## 11. Environment Variables for Security

```env
# CORS
CORS_ORIGIN=http://localhost:3000,https://app.example.com

# API Size Limits
MAX_JSON_PAYLOAD_SIZE=10mb
MAX_FORM_PAYLOAD_SIZE=10mb

# Rate Limiting (can override in code)
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100

# Environment
NODE_ENV=production  # or development
```

## 12. Future Enhancements

- [ ] API Key authentication for service-to-service communication
- [ ] IP whitelisting for admin endpoints
- [ ] Advanced CSRF protection
- [ ] Request signing for high-value operations
- [ ] Distributed rate limiting (Redis-based)
- [ ] Web Application Firewall (WAF) integration
- [ ] Anomaly detection for suspicious patterns

## References

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security)
- [Helmet.js Security Headers](https://helmetjs.github.io/)
