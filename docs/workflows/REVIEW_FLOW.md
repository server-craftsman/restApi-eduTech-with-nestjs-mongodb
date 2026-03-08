# Review Flow — Luồng Ôn Tập (Kho Câu Sai)

> **Version:** 1.0  
> **Ngày tạo:** 2026-03-08  
> **Mô tả:** Luồng cho phép học sinh xem lại và luyện tập lại những câu hỏi trả lời sai, không dùng thuật toán lặp lại ngắt quãng (spaced repetition) — thay vào đó dùng logic đơn giản: **làm lại cho đến khi đúng**.

---

## Actors

| Actor | Mô tả |
|---|---|
| **Student** | Học sinh đang học và làm quiz |
| **System** | Backend NestJS — tự động ghi nhận, chấm điểm, cập nhật bank |
| **Admin** | Xem bank của bất kỳ học sinh nào, xóa record |

---

## Bước 1 — Ghi nhận câu sai (tự động)

```
Student                       System
  |                             |
  |-- POST /quiz-attempts ----→ |  (nộp bài quiz thường)
  |                             |
  |                             |  1. Fetch questions từ DB
  |                             |  2. Chấm từng câu (server-side)
  |                             |  3. Lưu QuizAttempt vào DB
  |                             |  4. [fire-and-forget] pushToWrongAnswerBank()
  |                             |       - câu SAI  → upsert WrongAnswer
  |                             |                    (failCount++, lastFailedAt=now)
  |                             |       - câu ĐÚNG → markMastered() nếu trước đó sai
  |                             |
  |←-- 201 QuizAttemptDto ---- |
```

**Điểm quan trọng:**
- Bước 4 chạy **bất đồng bộ (fire-and-forget)**; lỗi của bước này không ảnh hưởng phản hồi quiz.
- Mỗi cặp `(userId, questionId)` chỉ có **một** record trong bank (upsert, có compound unique index).
- Nếu học sinh sau đó làm đúng câu đó trong bài quiz khác → `isMastered = true` tự động.

---

## Bước 2 — Xem "Kho câu sai"

### 2a. Xem toàn bộ bank

```
Student                           System
  |                                 |
  |-- GET /wrong-answers/my-bank →  |
  |    ?isMastered=false            |  (chỉ lấy câu chưa thuộc)
  |                                 |
  |                                 |  1. findByUserId(userId, isMastered=false)
  |                                 |  2. Enrich từng record với Question object
  |                                 |
  |←-- 200 WrongAnswerWithQuestion[]|
  |    [ { id, questionId, failCount,|
  |        lastFailedAt, isMastered, |
  |        question: { contentHtml, |
  |          options, ... } } ]      |
```

### 2b. Lọc theo bài học cụ thể

```
GET /wrong-answers/my-bank/lesson/:lessonId?isMastered=false
```

### 2c. Xem thống kê

```
GET /wrong-answers/my-bank/stats
→ { total: 20, mastered: 8, remaining: 12, masteryRate: 40 }
```

---

## Bước 3 — Luyện tập (làm lại)

```
Student                           System
  |                                 |
  |  (Xem bank, chọn câu để luyện)  |
  |                                 |
  |-- POST /wrong-answers/practice→ |
  |   {                             |
  |     answers: [                  |
  |       { questionId, selectedAnswer },
  |       { questionId, selectedAnswer }
  |     ]                           |
  |   }                             |
  |                                 |
  |                                 |  1. Fetch mỗi câu hỏi theo questionId
  |                                 |  2. Chấm từng câu server-side
  |                                 |  3. Câu ĐÚNG  → markMastered(userId, questionId)
  |                                 |     Câu SAI   → upsertWrongAnswer(failCount++)
  |                                 |
  |←-- 201 PracticeResultDto ------ |
  |    {                            |
  |      results: [                 |
  |        { questionId, isCorrect, |
  |          isMastered,            |
  |          correctAnswer,         |
  |          selectedAnswer,        |
  |          explanation }          |
  |      ],                         |
  |      totalAnswered: 5,          |
  |      correctCount: 3,           |
  |      masteredCount: 2,          |
  |      remainingWrong: 2          |
  |    }                            |
```

**Vòng lặp làm lại:**
```
Lần 1: failCount=1, isMastered=false
Lần 2: failCount=2, isMastered=false
...
Lần N: trả lời đúng → isMastered=true, masteredAt=now
```

---

## Luồng tổng quan (Sequence Diagram dạng text)

```
Student       QuizAttemptController   QuizAttemptService    WrongAnswerService   WrongAnswerRepository
  |                   |                       |                     |                     |
  |-- POST /quiz ----→|                       |                     |                     |
  |                   |-- submitAttempt() ---→|                     |                     |
  |                   |                       |-- grade answers      |                     |
  |                   |                       |-- create attempt ----→ DB                 |
  |                   |                       |-- pushToWrongAnswerBank() [async]          |
  |                   |                       |                     |-- recordFromAttempt()|
  |                   |                       |                     |  wrong → upsert ----→|
  |                   |                       |                     |  right → markMastered|
  |                   |←-- QuizAttemptDto ----| (trả ngay, không đợi bank update)         |
  |←-- 201 ← ← ← ← ← |                       |                     |                     |
  |                   |                       |                     |                     |
  |-- GET /wrong-answers/my-bank?isMastered=false                   |                     |
  |                   WrongAnswerController   WrongAnswerService                          |
  |                          |-- getMyBank() →|                                           |
  |                          |               |-- findByUserId(false) -------------------→|
  |                          |               |← WrongAnswer[]                             |
  |                          |               |-- enrichWithQuestions() (fetch each Q)    |
  |←-- 200 WrongAnswerWithQuestion[]         |                                           |
  |                                          |                                           |
  |-- POST /wrong-answers/practice           |                                           |
  |   { answers: [...] }   -- submitPractice()|                                          |
  |                          |               |-- grade each answer                        |
  |                          |               |   correct → markMastered() ─────────────→|
  |                          |               |   wrong   → upsertWrongAnswer() ─────────→|
  |←-- 201 PracticeResultDto |               |                                           |
```

---

## API Endpoints — Quick Reference

| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| `GET` | `/wrong-answers/my-bank` | Student/Teacher/Admin | Xem toàn bộ bank (có filter isMastered) |
| `GET` | `/wrong-answers/my-bank/stats` | Student/Teacher/Admin | Thống kê bank |
| `GET` | `/wrong-answers/my-bank/lesson/:lessonId` | Student/Teacher/Admin | Bank theo bài học |
| `POST` | `/wrong-answers/practice` | Student/Teacher/Admin | Nộp bài luyện tập |
| `GET` | `/wrong-answers/admin/user/:userId` | Admin | Xem bank của học sinh bất kỳ |
| `GET` | `/wrong-answers/admin/user/:userId/stats` | Admin | Thống kê của học sinh bất kỳ |
| `DELETE` | `/wrong-answers/admin/:id` | Admin | Xóa 1 record khỏi bank |

---

## Cấu trúc dữ liệu — WrongAnswer

```json
{
  "id": "507f1f77bcf86cd799439001",
  "userId": "507f1f77bcf86cd799439011",
  "questionId": "507f1f77bcf86cd799439022",
  "lessonId": "507f1f77bcf86cd799439014",
  "failCount": 3,
  "lastFailedAt": "2026-03-08T10:00:00Z",
  "isMastered": false,
  "masteredAt": null,
  "isDeleted": false,
  "createdAt": "2026-03-01T08:00:00Z",
  "updatedAt": "2026-03-08T10:00:00Z"
}
```

### Index MongoDB

```
{ userId: 1, questionId: 1 }  → unique (1 record / câu / học sinh)
{ userId: 1, isMastered: 1 }  → lọc bank nhanh
{ userId: 1, lessonId: 1, isMastered: 1 } → lọc theo bài học
```

---

## Quy tắc nghiệp vụ

1. **Upsert, không duplicate** — Mỗi cặp `(userId, questionId)` chỉ tồn tại **1 record duy nhất** nhờ compound unique index.
2. **Tự động cập nhật từ quiz thường** — Học sinh không cần làm gì; bank cập nhật sau mỗi lần nộp quiz.
3. **Re-mastered khi làm đúng** — Nếu câu đã mastered nhưng sau đó làm sai lại trong quiz → `isMastered = false`, `failCount` tiếp tục tăng.
4. **Không xóa khi mastered** — Record vẫn lưu với `isMastered = true`; học sinh có thể xem lại lịch sử.
5. **Lỗi bank update không chặn quiz** — `pushToWrongAnswerBank` chạy fire-and-forget với try/catch.
6. **Soft-delete** — Admin có thể soft-delete record; không bao giờ hard-delete.

---

## Module Files

```
src/wrong-answers/
├── domain/
│   └── wrong-answer.ts                          # Domain interface
├── dto/
│   ├── wrong-answer.dto.ts                      # WrongAnswerDto + WrongAnswerWithQuestionDto
│   ├── practice-submit.dto.ts                   # PracticeAnswerDto + PracticeSubmitDto
│   ├── practice-result.dto.ts                   # PracticeResultItemDto + PracticeResultDto
│   ├── wrong-answer-stats.dto.ts                # WrongAnswerStatsDto
│   └── index.ts
├── infrastructure/persistence/document/
│   ├── schemas/wrong-answer.schema.ts           # Mongoose schema + compound indexes
│   ├── mappers/wrong-answer.mapper.ts
│   └── repositories/
│       ├── wrong-answer.repository.abstract.ts
│       └── wrong-answer.repository.ts           # upsert + markMastered logic
├── wrong-answer.service.ts                      # Business logic + enrichment
├── wrong-answer.controller.ts                   # REST API
├── wrong-answer.module.ts
└── index.ts
```
