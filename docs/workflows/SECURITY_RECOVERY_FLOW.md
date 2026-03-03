# 🔐 Security & Recovery Flow — Password Reset via OTP

> **Module:** `src/auth/`
> **Last Updated:** March 2026

---

## Overview

A 4-step security flow that lets a user securely reset their password without exposing sensitive data. The design prevents **user enumeration**, consumes credentials immediately after use, and **revokes every active session** on all devices after a successful reset.

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SECURITY & RECOVERY FLOW                          │
│          Forgot Password → OTP → Reset Token → New Password          │
└──────────────────────────────────────────────────────────────────────┘

  Client                   Frontend                Backend (NestJS)           MongoDB
    │                          │                         │                       │
    │  Forgot password?        │                         │                       │
    │─────────────────────────►│                         │                       │
    │                          │                         │                       │
    │ ══════════════════════════ STEP 1 — Request OTP ══════════════════════════ │
    │                          │                         │                       │
    │                          │  POST /auth/password/forgot                     │
    │                          │  { "email": "user@example.com" }                │
    │                          │────────────────────────►│                       │
    │                          │                         │                       │
    │                          │           ┌─────────────┴─────────────────┐     │
    │                          │           │ AuthController.forgotPassword  │     │
    │                          │           │ ForgotPasswordDto validation   │     │
    │                          │           │ (@IsEmail)                     │     │
    │                          │           └─────────────┬─────────────────┘     │
    │                          │                         │                       │
    │                          │           ┌─────────────┴─────────────────┐     │
    │                          │           │ AuthService.forgotPassword()   │     │
    │                          │           │                               │     │
    │                          │           │ 1. usersService.findByEmail()  │     │
    │                          │           │──────────────────────────────────►  │
    │                          │           │◄──────────────────────────────────  │
    │                          │           │    User | null                │     │
    │                          │           │                               │     │
    │                          │           │ 2. if (!user) → silently OK   │     │
    │                          │           │    (anti-enumeration)         │     │
    │                          │           │                               │     │
    │                          │           │ 3. otp = randomInt(100000,    │     │
    │                          │           │         999999).toString()    │     │
    │                          │           │                               │     │
    │                          │           │ 4. expires = now + 10 min     │     │
    │                          │           │                               │     │
    │                          │           │ 5. usersService.update(id, {  │     │
    │                          │           │      passwordResetOtp: otp,   │     │
    │                          │           │      passwordResetExpires:    │     │
    │                          │           │        expires                │     │
    │                          │           │    })                         │     │
    │                          │           │──────────────────────────────────►  │
    │                          │           │                               │     │
    │                          │           │ 6. emailVerificationService   │     │
    │                          │           │    .sendPasswordResetOtp()    │     │
    │                          │           │    (nodemailer → SMTP)        │     │
    │                          │           └─────────────┬─────────────────┘     │
    │                          │                         │                       │
    │                          │  HTTP 200 OK            │                       │
    │                          │  { "message": "If this email is registered,    │
    │                          │     you will receive a reset code shortly." }  │
    │                          │◄────────────────────────│                       │
    │                          │                         │                       │
    │  Show "Check your email" │                         │                       │
    │◄─────────────────────────│                         │                       │
    │                          │                         │                       │
    │ ════════════════════════ STEP 2 — Verify OTP ════════════════════════════ │
    │                          │                         │                       │
    │  User types 6-digit OTP  │                         │                       │
    │─────────────────────────►│                         │                       │
    │                          │                         │                       │
    │                          │  POST /auth/password/verify-otp                 │
    │                          │  {                      │                       │
    │                          │    "email": "user@example.com",                 │
    │                          │    "otp":   "482931"    │                       │
    │                          │  }                      │                       │
    │                          │────────────────────────►│                       │
    │                          │                         │                       │
    │                          │           ┌─────────────┴─────────────────┐     │
    │                          │           │ AuthService.verifyOtp()        │     │
    │                          │           │                               │     │
    │                          │           │ 1. usersService.findByEmail()  │     │
    │                          │           │──────────────────────────────────►  │
    │                          │           │◄──────────────────────────────────  │
    │                          │           │                               │     │
    │                          │           │ 2. Validate OTP matches        │     │
    │                          │           │    and not expired             │     │
    │                          │           │    → 400 if invalid/expired    │     │
    │                          │           │                               │     │
    │                          │           │ 3. resetToken =                │     │
    │                          │           │    crypto.randomBytes(32)      │     │
    │                          │           │         .toString('hex')       │     │
    │                          │           │                               │     │
    │                          │           │ 4. usersService.update(id, {   │     │
    │                          │           │      passwordResetOtp: null,   │     │
    │                          │           │      passwordResetToken:       │     │
    │                          │           │        resetToken,             │     │
    │                          │           │      passwordResetExpires:     │     │
    │                          │           │        now + 60 min            │     │
    │                          │           │    })                          │     │
    │                          │           │──────────────────────────────────►  │
    │                          │           └─────────────┬─────────────────┘     │
    │                          │                         │                       │
    │                          │  HTTP 200 OK            │                       │
    │                          │  {                      │                       │
    │                          │    "message": "OTP verified. Use the reset     │
    │                          │               token to set your new password.",│
    │                          │    "data": {            │                       │
    │                          │      "resetToken": "a3f9...c72b"  (64-char hex)│
    │                          │    }                    │                       │
    │                          │  }                      │                       │
    │                          │◄────────────────────────│                       │
    │                          │                         │                       │
    │ ══════════════════ STEP 3+4 — Reset Password + Re-sync ════════════════ │
    │                          │                         │                       │
    │  New password input form │                         │                       │
    │─────────────────────────►│                         │                       │
    │                          │                         │                       │
    │                          │  POST /auth/password/reset                      │
    │                          │  {                      │                       │
    │                          │    "resetToken":  "a3f9...c72b",               │
    │                          │    "newPassword": "NewPass123!"                 │
    │                          │  }                      │                       │
    │                          │────────────────────────►│                       │
    │                          │                         │                       │
    │                          │           ┌─────────────┴─────────────────┐     │
    │                          │           │ AuthService.resetPassword()    │     │
    │                          │           │                               │     │
    │                          │           │ 1. findByPasswordResetToken()  │     │
    │                          │           │──────────────────────────────────►  │
    │                          │           │◄──────────────────────────────────  │
    │                          │           │                               │     │
    │                          │           │ 2. Validate token not expired  │     │
    │                          │           │    → 400 if expired            │     │
    │                          │           │                               │     │
    │                          │           │ 3. bcrypt.hash(newPassword)    │     │
    │                          │           │                               │     │
    │                          │           │ 4. usersService.update(id, {   │     │
    │                          │           │      passwordHash: hash,       │     │
    │                          │           │      passwordResetToken: null, │     │
    │                          │           │      passwordResetExpires: null│     │
    │                          │           │    })                          │     │
    │                          │           │──────────────────────────────────►  │
    │                          │           │                               │     │
    │                          │           │ 5. sessionService              │     │
    │                          │           │    .deleteSessionsByUserId()   │     │
    │                          │           │    ← STEP 4: Re-sync           │     │
    │                          │           │    All devices signed out      │     │
    │                          │           │──────────────────────────────────►  │
    │                          │           │    db.sessions.deleteMany({    │     │
    │                          │           │      userId                    │     │
    │                          │           │    })                          │     │
    │                          │           └─────────────┬─────────────────┘     │
    │                          │                         │                       │
    │                          │  HTTP 200 OK            │                       │
    │                          │  { "message": "Password reset successful.      │
    │                          │     Please sign in with your new password." }  │
    │                          │◄────────────────────────│                       │
    │                          │                         │                       │
    │  Redirect to login page  │                         │                       │
    │◄─────────────────────────│                         │                       │
```

---

## API Reference

### Step 1 — Request OTP

```
POST /auth/password/forgot
Content-Type: application/json
```

**Request body:**
```json
{ "email": "student@example.com" }
```

**Response (always identical — anti-enumeration):**
```json
{
  "success": true,
  "message": "If this email is registered, you will receive a reset code shortly.",
  "data": {}
}
```

---

### Step 2 — Verify OTP

```
POST /auth/password/verify-otp
Content-Type: application/json
```

**Request body:**
```json
{
  "email": "student@example.com",
  "otp":   "482931"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "OTP verified. Use the reset token to set your new password.",
  "data": {
    "resetToken": "a3f9d2c1e8b047f6a1d3c2e9f0b4a7d5c6e8f1a2b3c4d5e6f7a8b9c0d1e2f3a4"
  }
}
```

**Response (invalid / expired OTP):**
```json
{ "statusCode": 400, "message": "Invalid or expired OTP" }
```

---

### Step 3 — Reset Password + Revoke Sessions

```
POST /auth/password/reset
Content-Type: application/json
```

**Request body:**
```json
{
  "resetToken":  "a3f9d2c1e8b047f6a1d3c2e9f0b4a7d5c6e8f1a2b3c4d5e6f7a8b9c0d1e2f3a4",
  "newPassword": "NewSecurePass123!"
}
```

**Password rules** (`@Matches` regex: must contain uppercase, lowercase, and a digit):
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit

**Response (success):**
```json
{
  "success": true,
  "message": "Password reset successful. Please sign in with your new password.",
  "data": {}
}
```

**Response (invalid / expired token):**
```json
{ "statusCode": 400, "message": "Invalid or expired reset token" }
```

---

## Security Properties

| Property | Detail |
|---|---|
| **Anti-enumeration** | Step 1 always returns HTTP 200 regardless of whether the email exists |
| **OTP entropy** | `crypto.randomInt(100000, 999999)` — cryptographically random, 6 digits |
| **OTP expiry** | 10 minutes from generation |
| **OTP consumption** | OTP is cleared from DB immediately after successful verification |
| **Reset token** | `crypto.randomBytes(32).toString('hex')` — 64-char hex, 1 million × harder than OTP |
| **Reset token expiry** | 60 minutes from OTP verification |
| **Session revocation** | ALL sessions for the user are deleted on successful password reset (Step 4 re-sync) |
| **No plain-text storage** | OTP stored as plain string (short-lived); password stored as bcrypt hash |

---

## Error Reference

| Code | Scenario | Endpoint |
|---|---|---|
| `400` | `@IsEmail` fails on malformed address | `/forgot` |
| `400` | OTP is incorrect | `/verify-otp` |
| `400` | OTP has expired (> 10 min) | `/verify-otp` |
| `400` | OTP length is not exactly 6 digits | `/verify-otp` |
| `400` | Reset token not found in DB | `/reset` |
| `400` | Reset token has expired (> 60 min) | `/reset` |
| `400` | New password fails complexity rules | `/reset` |

---

## Files Changed

| File | Change |
|---|---|
| `src/users/domain/user.ts` | Added `passwordResetOtp?`, `passwordResetToken?`, `passwordResetExpires?` |
| `src/users/infrastructure/.../schemas/user.schema.ts` | Added 3 `@Prop` fields |
| `src/users/infrastructure/.../mappers/user.mapper.ts` | Map new fields in `toDomain()` / `toDocument()` |
| `src/users/infrastructure/.../repositories/user.repository.abstract.ts` | Added `findByPasswordResetToken()` abstract |
| `src/users/infrastructure/.../repositories/user.repository.ts` | Implemented `findByPasswordResetToken()` |
| `src/users/users.service.ts` | Added `findByPasswordResetToken()` |
| `src/auth/dto/forgot-password.dto.ts` | **NEW** — `ForgotPasswordDto { email }` |
| `src/auth/dto/verify-otp.dto.ts` | **NEW** — `VerifyOtpDto { email, otp }` |
| `src/auth/dto/reset-password.dto.ts` | **NEW** — `ResetPasswordDto { resetToken, newPassword }` |
| `src/auth/dto/index.ts` | Barrel-exported 3 new DTOs |
| `src/auth/services/email-verification.service.ts` | Added `sendPasswordResetOtp()` |
| `src/auth/auth.service.ts` | Added `forgotPassword()`, `verifyOtp()`, `resetPassword()` |
| `src/auth/auth.controller.ts` | Added 3 new `POST /auth/password/*` endpoints |
