# Parent-Student Linking Workflow

**Module:** `src/parent-student-links/`  
**Version:** 1.0 — March 2026

---

## Overview

The Parent Linking Flow lets a student connect their EduTech account to a parent so the parent can:
- View the student's progress at any time
- Receive automated weekly progress report emails
- Trigger an on-demand progress report

---

## Step-by-Step Flow

### Step 1 — Student generates a link code

**Who:** Authenticated Student  
**Endpoints:**

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/parent-student-links/generate-code` | Returns `{ linkCode, expiresAt }` |
| `GET`  | `/parent-student-links/generate-code/share-text` | Returns code + pre-composed Vietnamese Zalo/SMS message |
| `POST` | `/parent-student-links/generate-code/send` | **NEW** — Sends code via SMS or Zalo directly |

**Behaviour:**
- Generates an 8-character uppercase alphanumeric code (e.g. `A3BX7KQZ`).
- Code is valid for **24 hours**.
- If an unexpired pending code already exists for the student, the same code is returned without creating a new record.
- A `parent_student_links` document is created with `isVerified: false`, `parentId: null`.

**Database state after Step 1:**
```
{ parentId: null, studentId: <profileId>, isVerified: false, linkCode: "A3BX7KQZ", linkCodeExpires: <+24h> }
```

---

### Step 1.5 — **NEW**: Student sends code via SMS or Zalo

**Who:** Authenticated Student  
**Endpoint:** `POST /parent-student-links/generate-code/send`

**Request body:**
```json
{
  "phoneNumber": "+84901234567",
  "channel": "sms"
}
```

Or use Zalo:
```json
{
  "phoneNumber": "+84901234567",
  "channel": "zalo"
}
```

**Behaviour:**
- Takes the generated link code + pre-composed Vietnamese message
- Sends via SMS provider (e.g., Vonage/Nexmo) or Zalo OA API
- Message format:
  ```
  📚 Mã kết nối EduTech của [student name]: *A3BX7KQZ*
  Bạn vui lòng mở ứng dụng EduTech → Phụ huynh → Nhập mã kết nối.
  ⏳ Mã hết hạn vào: [date time].
  ```
- Returns `{ success: true, messageId: "..." }` on success
- Parent automatically receives the code without manual copy-paste

**Configuration (.env):**
```
# SMS Provider (Vonage/Nexmo or similar)
SMS_API_KEY=your_api_key
SMS_API_URL=https://api.vonage.com/sms/json
SMS_FROM_NUMBER=EduTech

# Zalo OA
ZALO_ACCESS_TOKEN=your_zalo_oa_token
```

---

### Step 2 — Parent enters the code to connect

**Who:** Authenticated Parent  
**Endpoint:** `POST /parent-student-links/connect`

**Request body:**
```json
{ "code": "A3BX7KQZ" }
```

**Behaviour:**
1. Looks up the link record by `linkCode`.
2. Validates:
   - Code exists → `400 Invalid link code`
   - Code not yet used (`isVerified: false`) → `400 Already used`
   - Code not expired → `400 Expired`
   - No existing verified link between this parent and student → `400 Already linked`
3. Updates the record:
   - Sets `parentId` to the parent's profile ID.
   - Sets `isVerified: true`.
   - Clears `linkCode` and `linkCodeExpires` (consumed, single-use).

**Database state after Step 2:**
```
{ parentId: <parentProfileId>, studentId: <studentProfileId>, isVerified: true, linkCode: null, linkCodeExpires: null }
```

---

### Step 3 — Viewing the linked accounts

| Method | URL | Who | Description |
|--------|-----|-----|-------------|
| `GET` | `/parent-student-links/my-children` | Parent | Lists all verified students with XP, streak, grade |
| `GET` | `/parent-student-links/my-parents` | Student | Lists all verified parents with name, phone |

---

### Step 4 — Progress Reports (Automated + On-demand)

#### 4a — Automated weekly report (Cron)

- Schedule: **every Monday at 08:00** (`CronExpression.EVERY_WEEK`)
- Iterates **all** verified links in the database.
- For each link, generates `StudentProgressReportDto` (last 7 days).
- Sends a rich Vietnamese HTML email to the parent.
- Stamps `lastReportSentAt` on the link document.

#### 4b — Parent views progress in-app

**Endpoint:** `GET /parent-student-links/my-children/:linkId/progress?period=weekly`

| Query param | Values | Default |
|-------------|--------|---------|
| `period` | `weekly` \| `monthly` | `weekly` |

**Returns:** `StudentProgressReportDto` — aggregated stats for last 7 or 30 days.

**Stats aggregated:**
- `lessonsStarted` / `lessonsCompleted` (from `LessonProgress` records updated in period)
- `totalWatchMinutes` (sum of `lastWatchedSec / 60`)
- `quizzesAttempted` / `avgQuizScore` (from `QuizAttempt.completedAt` in period)
- `xpEarnedThisPeriod` (estimate: 10 XP × completedLessons + 5 XP × correctAnswers)
- `quizAttempts[]` — up to 20 most-recent with `completedAt`, `score`, `correctAnswers/totalQuestions`
- `highlightText` — auto-generated Vietnamese summary sentence

#### 4c — On-demand report email

**Endpoint:** `POST /parent-student-links/send-report`

```json
{ "linkId": "<id>", "period": "weekly" }
```

Triggers an immediate email to the parent (same email as the cron job).

---

### Step 5 — Revoking a link

Either party can delete the connection at any time.

| Method | URL | Who |
|--------|-----|-----|
| `DELETE` | `/parent-student-links/my-children/:linkId` | Student removes a parent |
| `DELETE` | `/parent-student-links/my-parents/:linkId` | Parent removes a child |

The service validates that the requesting user is actually a party to the link before deleting.

---

## Data Model

### `ParentStudentLink` domain interface

```typescript
interface ParentStudentLink {
  id: string;
  parentId: string | null;      // null while pending (Step 1 complete, Step 2 not yet done)
  studentId: string;            // student_profiles._id
  isVerified: boolean;          // true only after Step 2
  linkCode?: string | null;     // consumed and cleared after Step 2
  linkCodeExpires?: Date | null;
  lastReportSentAt?: Date | null;
  createdAt: Date;
}
```

### Key design decisions

| Decision | Reason |
|----------|--------|
| `parentId` is nullable | The link document is created in Step 1 (student side) before the parent has connected. Making it required caused a Mongoose validation error. |
| `linkCode` is cleared after use | Prevents replay attacks — each code is single-use. |
| `lastReportSentAt` tracked per-link | Allows future throttling (e.g. skip if report was sent < 6 days ago). |
| XP estimate in report | `LessonProgress` doesn't store XP earned per period; estimate = 10 × completed lessons + 5 × correct quiz answers. |

---

## Module Dependencies

```
ParentStudentLinkModule
  ├── StudentProfileModule     (resolve studentId → userId → stats)
  ├── ParentProfileModule      (resolve parentId → name, userId)
  ├── UsersModule              (resolve userId → email for report)
  ├── LessonProgressModule     (LessonProgressService.findByUserId)
  ├── QuizAttemptModule        (QuizAttemptService.findByUserId)
  ├── MailModule               (MailService.sendProgressReportEmail)
  ├── SmsService               (NEW — sends SMS via provider API)
  └── ZaloService              (NEW — sends Zalo messages)
```

`ScheduleModule.forRoot()` is registered globally in `AppModule`.

---

## API Reference (all endpoints)

| Method | URL | Auth | Body / Query | Description |
|--------|-----|------|--------------|-------------|
| `POST` | `/parent-student-links/generate-code` | JWT | — | Generate link code |
| `GET` | `/parent-student-links/generate-code/share-text` | JWT | — | Code + Zalo share text |
| `POST` | `/parent-student-links/generate-code/send` | JWT | `{ phoneNumber, channel }` | **NEW** — Send code via SMS/Zalo |
| `POST` | `/parent-student-links/connect` | JWT | `{ code }` | Parent connects by code |
| `GET` | `/parent-student-links/my-children` | JWT | — | Parent: list children |
| `GET` | `/parent-student-links/my-parents` | JWT | — | Student: list parents |
| `GET` | `/parent-student-links/my-children/:linkId/progress` | JWT | `?period=weekly\|monthly` | Parent: view child progress |
| `POST` | `/parent-student-links/send-report` | JWT | `{ linkId, period? }` | Trigger report email now |
| `DELETE` | `/parent-student-links/my-children/:linkId` | JWT | — | Student revokes a parent |
| `DELETE` | `/parent-student-links/my-parents/:linkId` | JWT | — | Parent revokes a child |
| `GET` | `/parent-student-links` | — | — | Admin: list all links |
| `POST` | `/parent-student-links` | — | `CreateParentStudentLinkDto` | Admin: create link |
| `PUT` | `/parent-student-links/:id` | — | `UpdateParentStudentLinkDto` | Admin: update link |
| `PUT` | `/parent-student-links/:id/verify` | — | — | Admin: verify link |
| `DELETE` | `/parent-student-links/:id` | — | — | Admin: delete link |
