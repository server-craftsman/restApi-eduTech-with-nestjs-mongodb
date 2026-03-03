# 👨‍👩‍👧 Parent Linking Flow — Student ↔ Parent Connection

> **Module:** `src/parent-student-links/`
> **Last Updated:** March 2026

---

## Overview

A 2-step handshake that establishes a verified relationship between a student and their parent. The student generates a short-lived link code and shares it out-of-band (e.g., verbally or via a chat app). The parent submits the code to connect. Once linked, parents can view their child's learning progress.

```
┌──────────────────────────────────────────────────────────────────────┐
│                      PARENT LINKING FLOW                             │
│         Student generates code → Parent connects → View progress     │
└──────────────────────────────────────────────────────────────────────┘

  Student (App)           Frontend              Backend (NestJS)           MongoDB
      │                       │                       │                       │
      │                       │                       │                       │
      │ ═════════════ STEP 1 — Student Generates Link Code ═════════════════ │
      │                       │                       │                       │
      │  Tap "Share with      │                       │                       │
      │  Parent" button       │                       │                       │
      │──────────────────────►│                       │                       │
      │                       │                       │                       │
      │                       │  POST /parent-student-links/generate-code     │
      │                       │  Authorization: Bearer <student_JWT>          │
      │                       │  (no body required)   │                       │
      │                       │──────────────────────►│                       │
      │                       │                       │                       │
      │                       │          ┌────────────┴──────────────────┐    │
      │                       │          │ JwtAuthGuard → CurrentUser    │    │
      │                       │          │ user.id = student's userId    │    │
      │                       │          └────────────┬──────────────────┘    │
      │                       │                       │                       │
      │                       │          ┌────────────┴──────────────────┐    │
      │                       │          │ ParentStudentLinkService       │    │
      │                       │          │ .generateLinkCode(userId)      │    │
      │                       │          │                               │    │
      │                       │          │ 1. studentProfileService       │    │
      │                       │          │    .getProfileByUserId()       │    │
      │                       │          │────────────────────────────────────►│
      │                       │          │◄────────────────────────────────────│
      │                       │          │    StudentProfile              │    │
      │                       │          │                               │    │
      │                       │          │ 2. Check existing unexpired   │    │
      │                       │          │    pending code               │    │
      │                       │          │    → reuse if valid           │    │
      │                       │          │                               │    │
      │                       │          │ 3. Generate 8-char code       │    │
      │                       │          │    [A-Z0-9]{8}                │    │
      │                       │          │    e.g. "A3BX7K2M"           │    │
      │                       │          │                               │    │
      │                       │          │ 4. linkCodeExpires =           │    │
      │                       │          │    now + 24 hours             │    │
      │                       │          │                               │    │
      │                       │          │ 5. repo.create({              │    │
      │                       │          │      studentId: profile.id,   │    │
      │                       │          │      parentId: '',            │    │
      │                       │          │      isVerified: false,       │    │
      │                       │          │      linkCode: "A3BX7K2M",   │    │
      │                       │          │      linkCodeExpires          │    │
      │                       │          │    })                         │    │
      │                       │          │────────────────────────────────────►│
      │                       │          └────────────┬──────────────────┘    │
      │                       │                       │                       │
      │                       │  HTTP 200 OK          │                       │
      │                       │  {                    │                       │
      │                       │    "linkCode": "A3BX7K2M",                   │
      │                       │    "expiresAt": "2026-03-05T10:30:00.000Z"   │
      │                       │  }                    │                       │
      │                       │◄──────────────────────│                       │
      │                       │                       │                       │
      │  Show code "A3BX7K2M" │                       │                       │
      │  on screen (24h timer)│                       │                       │
      │◄──────────────────────│                       │                       │
      │                       │                       │                       │
      │  Student shares code  │                       │                       │
      │  out-of-band (call,   │                       │                       │
      │  message, etc.)       │                       │                       │
      │                       │                       │                       │
      │ ════════════════ STEP 2 — Parent Connects by Code ════════════════ │
      │                       │                       │                       │
  Parent (App)               │                       │                       │
      │                       │                       │                       │
      │  Types code in app    │                       │                       │
      │──────────────────────►│                       │                       │
      │                       │                       │                       │
      │                       │  POST /parent-student-links/connect           │
      │                       │  Authorization: Bearer <parent_JWT>           │
      │                       │  { "code": "A3BX7K2M" }                      │
      │                       │──────────────────────►│                       │
      │                       │                       │                       │
      │                       │          ┌────────────┴──────────────────┐    │
      │                       │          │ ParentStudentLinkService       │    │
      │                       │          │ .connectByCode(userId, code)   │    │
      │                       │          │                               │    │
      │                       │          │ 1. parentProfileService        │    │
      │                       │          │    .getProfileByUserId()       │    │
      │                       │          │────────────────────────────────────►│
      │                       │          │◄────────────────────────────────────│
      │                       │          │    ParentProfile               │    │
      │                       │          │                               │    │
      │                       │          │ 2. repo.findByLinkCode(code)  │    │
      │                       │          │────────────────────────────────────►│
      │                       │          │◄────────────────────────────────────│
      │                       │          │    ParentStudentLink | null   │    │
      │                       │          │                               │    │
      │                       │          │ 3. Validate:                  │    │
      │                       │          │    • link found               │    │
      │                       │          │    • not already verified     │    │
      │                       │          │    • not expired              │    │
      │                       │          │    • no duplicate link        │    │
      │                       │          │                               │    │
      │                       │          │ 4. repo.update(link.id, {     │    │
      │                       │          │      parentId: profile.id,    │    │
      │                       │          │      isVerified: true,        │    │
      │                       │          │      linkCode: null,          │    │
      │                       │          │      linkCodeExpires: null    │    │
      │                       │          │    })                         │    │
      │                       │          │────────────────────────────────────►│
      │                       │          └────────────┬──────────────────┘    │
      │                       │                       │                       │
      │                       │  HTTP 200 OK          │                       │
      │                       │  { ParentStudentLink record }                 │
      │                       │◄──────────────────────│                       │
      │                       │                       │                       │
      │  "Connected!"         │                       │                       │
      │◄──────────────────────│                       │                       │
      │                       │                       │                       │
      │ ══════════════ STEP 3 — View Linked Profiles ════════════════════════ │
      │                       │                       │                       │
  Parent (App)               │                       │                       │
      │                       │                       │                       │
      │  Open "My Children"   │                       │                       │
      │──────────────────────►│                       │                       │
      │                       │                       │                       │
      │                       │  GET /parent-student-links/my-children        │
      │                       │  Authorization: Bearer <parent_JWT>           │
      │                       │──────────────────────►│                       │
      │                       │                       │                       │
      │                       │          ┌────────────┴──────────────────┐    │
      │                       │          │ .getMyChildren(parentUserId)   │    │
      │                       │          │                               │    │
      │                       │          │ 1. getProfileByUserId()        │    │
      │                       │          │ 2. findVerifiedByParentId()   │    │
      │                       │          │ 3. For each link:             │    │
      │                       │          │    getProfileById(studentId)  │    │
      │                       │          │    → enrich with profile data │    │
      │                       │          └────────────┬──────────────────┘    │
      │                       │                       │                       │
      │                       │  HTTP 200 OK          │                       │
      │                       │  [                    │                       │
      │                       │    {                  │                       │
      │                       │      "linkId": "...", │                       │
      │                       │      "studentProfileId": "...",               │
      │                       │      "fullName": "Nguyen Van A",              │
      │                       │      "gradeLevel": "Grade10",                 │
      │                       │      "schoolName": "THPT Nguyen Hue",         │
      │                       │      "xpTotal": 1240, │                       │
      │                       │      "currentStreak": 7,                      │
      │                       │      "linkedAt": "2026-03-04T..."             │
      │                       │    }                  │                       │
      │                       │  ]                    │                       │
      │                       │◄──────────────────────│                       │
      │                       │                       │                       │
      │  Progress dashboard   │                       │                       │
      │  for each child       │                       │                       │
      │◄──────────────────────│                       │                       │
```

---

## API Reference

### Step 1 — Generate Link Code (Student)

```
POST /parent-student-links/generate-code
Authorization: Bearer <student_jwt>
```

No request body required. The student identity is extracted from the JWT.

**Response:**
```json
{
  "success": true,
  "message": "Link code generated successfully",
  "data": {
    "linkCode": "A3BX7K2M",
    "expiresAt": "2026-03-05T10:30:00.000Z"
  }
}
```

> **Idempotent**: If an unexpired pending code already exists for the student, the same code is returned without creating a new record.

---

### Step 2 — Connect by Code (Parent)

```
POST /parent-student-links/connect
Authorization: Bearer <parent_jwt>
Content-Type: application/json
```

**Request body:**
```json
{ "code": "A3BX7K2M" }
```

**Validation rules:**
- `code` must be exactly 8 characters, uppercase letters and digits only (`[A-Z0-9]{8}`)

**Response (success):**
```json
{
  "success": true,
  "message": "Connected to student successfully",
  "data": { "id": "...", "parentId": "...", "studentId": "...", "isVerified": true, ... }
}
```

**Error cases:**
```json
{ "statusCode": 400, "message": "Invalid link code" }
{ "statusCode": 400, "message": "This link code has already been used" }
{ "statusCode": 400, "message": "Link code has expired" }
{ "statusCode": 400, "message": "You are already linked to this student" }
```

---

### View My Children (Parent)

```
GET /parent-student-links/my-children
Authorization: Bearer <parent_jwt>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "linkId": "507f1f77bcf86cd799439011",
      "studentProfileId": "507f1f77bcf86cd799439012",
      "fullName": "Nguyen Van A",
      "gradeLevel": "Grade10",
      "schoolName": "THPT Nguyen Hue",
      "xpTotal": 1240,
      "currentStreak": 7,
      "linkedAt": "2026-03-04T08:00:00.000Z"
    }
  ]
}
```

---

### View My Parents (Student)

```
GET /parent-student-links/my-parents
Authorization: Bearer <student_jwt>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "linkId": "507f1f77bcf86cd799439011",
      "parentProfileId": "507f1f77bcf86cd799439013",
      "fullName": "Nguyen Thi B",
      "phoneNumber": "+84901234567",
      "linkedAt": "2026-03-04T08:00:00.000Z"
    }
  ]
}
```

---

## Business Rules

| Rule | Detail |
|---|---|
| **Code format** | 8 characters, `[A-Z0-9]` only |
| **Code expiry** | 24 hours from generation |
| **Code reuse** | Generating again within the validity window returns the existing code |
| **Code consumption** | Code is set to `null` immediately after a successful connection |
| **One-time use** | A used code (`isVerified: true`) cannot be accepted again |
| **Duplicate guard** | A parent who is already verified for a student cannot connect again |
| **Profile required** | Both parent and student must have their respective profiles created before linking |
| **IDs in the link** | `parentId` and `studentId` are **profile IDs** (not `userId`) — references `parent_profiles._id` and `student_profiles._id` |

---

## Database Schema

### `parent_student_links` collection

```
_id              ObjectId      Auto-generated link record ID
parentId         ObjectId      References parent_profiles._id (empty until Step 2)
studentId        ObjectId      References student_profiles._id
isVerified       Boolean       false until parent connects (Step 2)
linkCode         String|null   8-char code, cleared after use
linkCodeExpires  Date|null     UTC expiry timestamp, cleared after use
createdAt        Date          Auto-set on creation
```

---

## Files Changed

| File | Change |
|---|---|
| `src/parent-student-links/domain/parent-student-link.ts` | Added `linkCode?` and `linkCodeExpires?` fields |
| `src/parent-student-links/infrastructure/.../schemas/parent-student-link.schema.ts` | Added 2 `@Prop` fields |
| `src/parent-student-links/infrastructure/.../mappers/parent-student-link.mapper.ts` | Map new fields in `toDomain()` |
| `src/parent-student-links/infrastructure/.../repositories/parent-student-link.repository.abstract.ts` | Added `findByLinkCode()` and `findPendingByStudentId()` |
| `src/parent-student-links/infrastructure/.../repositories/parent-student-link.repository.ts` | Implemented both new methods; `create()` persists link code fields |
| `src/parent-student-links/dto/generate-link-code-response.dto.ts` | **NEW** — `{ linkCode, expiresAt }` |
| `src/parent-student-links/dto/connect-by-code.dto.ts` | **NEW** — validated 8-char code body |
| `src/parent-student-links/dto/linked-student.dto.ts` | **NEW** — enriched child data for parent view |
| `src/parent-student-links/dto/linked-parent.dto.ts` | **NEW** — enriched parent data for student view |
| `src/parent-student-links/dto/index.ts` | Barrel-exported 4 new DTOs |
| `src/parent-student-links/parent-student-link.service.ts` | Added `generateLinkCode()`, `connectByCode()`, `getMyChildren()`, `getMyParents()`; injected `StudentProfileService` and `ParentProfileService` |
| `src/parent-student-links/parent-student-link.controller.ts` | Rewritten with `JwtAuthGuard`, `@CurrentUser`, Swagger decorators, 4 new endpoints |
| `src/parent-student-links/parent-student-link.module.ts` | Imported `StudentProfileModule` and `ParentProfileModule` |
