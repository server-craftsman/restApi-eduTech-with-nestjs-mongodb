# Luồng Thi Thử (Exam Flow) — API Workflow

## 1. Tổng quan

"Luồng Thi Thử" cho phép học sinh làm đề thi với giới hạn thời gian, nộp bài, và xem kết quả chi tiết (câu đúng / sai, đáp án đúng, giải thích) ngay lập tức.

```
Teacher/Admin                  Student                  Backend
     │                           │                         │
     │── POST /exams ────────────┼────────────────────────▶│
     │   (tạo đề thi)           │                    validate questions
     │◀── 201 {exam} ───────────┼─────────────────────────│
     │                           │                         │
     │                           │── GET /exams ──────────▶│  (list published)
     │                           │◀── 200 [{exam...}] ────│
     │                           │                         │
     │          ┌── STEP 1 ──────┼─────────────────────────┤
     │          │ GET /exams/:id/start                     │
     │          │                │────────────────────────▶│
     │          │                │                    fetch questions
     │          │                │                    strip correctAnswer
     │          │                │◀── 200 StartExamResponse │
     │          │          [timer starts]                  │
     │          └────────────────┼─────────────────────────┤
     │                           │                         │
     │          ┌── STEP 2 ──────┼─────────────────────────┤
     │          │ POST /exams/:id/submit                   │
     │          │                │── {answers[], time} ───▶│
     │          │                │                    grade each answer
     │          │                │                    compute score
     │          │                │                    persist ExamAttempt
     │          │                │◀── 201 ExamResultDto ──│
     │          └────────────────┼─────────────────────────┤
     │                           │                         │
     │          ┌── STEP 3 ──────┼─────────────────────────┤
     │          │ GET /exams/attempts/:attemptId/result    │
     │          │                │────────────────────────▶│
     │          │                │◀── 200 ExamResultDto ──│
     │          └────────────────┼─────────────────────────┤
```

---

## 2. Đối tượng sử dụng

| Role      | Quyền hạn                                                                 |
|-----------|---------------------------------------------------------------------------|
| `ADMIN`   | Tạo, cập nhật, xóa mềm đề thi; xem tất cả bài nộp của mọi học sinh      |
| `TEACHER` | Tạo, cập nhật đề thi; xem tất cả bài nộp của học sinh                    |
| `STUDENT` | Xem đề thi đã publish; bắt đầu thi; nộp bài; xem kết quả bài của mình   |

---

## 3. Cấu trúc dữ liệu

### Exam (Đề thi)

```typescript
interface Exam {
  id: string;
  title: string;                // Tên đề thi
  description?: string | null;  // Mô tả / hướng dẫn
  questionIds: string[];         // Danh sách câu hỏi (theo thứ tự)
  totalQuestions: number;        // = questionIds.length
  timeLimitSeconds: number;      // Giới hạn thời gian (giây) → Frontend đếm ngược
  passingScore: number;          // Điểm đạt (0–100, mặc định 50)
  isPublished: boolean;          // Chỉ published mới hiện cho Student
  createdBy: string;             // userId của Teacher/Admin tạo đề
  createdAt: Date;
  updatedAt: Date;
}
```

### ExamAttempt (Bài thi)

```typescript
interface ExamAttempt {
  id: string;
  userId: string;           // Học sinh nộp bài
  examId: string;
  answers: ExamQuestionAnswer[];
  score: number;            // Phần trăm 0–100
  totalQuestions: number;
  correctAnswers: number;
  totalTimeSpentMs: number; // Thời gian thực tế học sinh làm (ms)
  passed: boolean;          // score >= passingScore
  status: 'submitted' | 'graded';
  submittedAt: Date;
  gradedAt: Date | null;
}
```

---

## 4. Các endpoint

### 4.1 Quản lý đề thi (Teacher / Admin)

#### `POST /exams` — Tạo đề thi

- **Auth**: JWT | Role: `TEACHER`, `ADMIN`
- **Body**:
  ```json
  {
    "title": "Đề thi thử Toán – Chương 3",
    "description": "Hãy đọc kỹ trước khi chọn đáp án.",
    "questionIds": ["<id1>", "<id2>", "..."],
    "timeLimitSeconds": 1800,
    "passingScore": 60,
    "isPublished": false
  }
  ```
- **Response** `201`: `ExamDto`
- **Validation**: Tất cả `questionIds` phải tồn tại trong DB; ít nhất 1 câu hỏi.

---

#### `GET /exams` — Danh sách đề thi

- **Auth**: JWT | Role: `STUDENT`, `TEACHER`, `ADMIN`
- **Query params** (optional):
  ```
  page=1&limit=10
  filters={"isPublished":true,"title":"Toán"}
  sort=[{"orderBy":"createdAt","order":"desc"}]
  ```
- **Lưu ý**: Student tự động bị filter `isPublished=true` — không thể xem đề chưa publish.
- **Response** `200`: Paginated `ExamDto[]`

---

#### `GET /exams/:id` — Xem chi tiết đề thi

- **Auth**: JWT | Role: `STUDENT`, `TEACHER`, `ADMIN`
- **Response** `200`: `ExamDto` (metadata, không có câu hỏi / đáp án)

---

#### `PUT /exams/:id` — Cập nhật đề thi

- **Auth**: JWT | Role: `TEACHER`, `ADMIN`
- **Body**: Partial `UpdateExamDto` (chỉ field cần đổi)
- **Response** `200`: `ExamDto`

---

#### `DELETE /exams/:id` — Xóa mềm đề thi

- **Auth**: JWT | Role: `ADMIN`
- **Response** `200`: `{ message: "Exam deleted successfully" }`

---

### 4.2 Luồng thi (Student)

#### `GET /exams/:id/start` — **Bước 1** — Bắt đầu thi

- **Auth**: JWT | Role: `STUDENT`, `TEACHER`, `ADMIN`
- **Mô tả**: Trả về metadata + danh sách câu hỏi **đã được làm sạch** (không có `correctAnswer`, không có `explanation`). Frontend dùng `timeLimitSeconds` để khởi động đồng hồ đếm ngược.
- **Response** `200`:
  ```json
  {
    "examId": "...",
    "title": "Đề thi thử Toán – Chương 3",
    "description": "Hãy đọc kỹ trước khi chọn đáp án.",
    "timeLimitSeconds": 1800,
    "totalQuestions": 10,
    "passingScore": 60,
    "questions": [
      {
        "id": "<questionId>",
        "contentHtml": "<p>Phương trình bậc hai là...</p>",
        "type": "MULTIPLE_CHOICE",
        "difficulty": "MEDIUM",
        "options": ["A. x² + 2x = 0", "B. 3x + 1 = 0", "C. √x = 2", "D. x³ = 0"],
        "points": 10
      }
    ]
  }
  ```
- **Lỗi**: `403` nếu đề chưa publish; `404` nếu không tìm thấy đề.

---

#### `POST /exams/:id/submit` — **Bước 2** — Nộp bài và chấm điểm

- **Auth**: JWT | Role: `STUDENT`, `TEACHER`, `ADMIN`
- **Body**:
  ```json
  {
    "answers": [
      {
        "questionId": "<id>",
        "selectedAnswer": "A. x² + 2x = 0",
        "timeSpentMs": 45000
      }
    ],
    "totalTimeSpentMs": 900000
  }
  ```
- **Xử lý backend**:
  1. Lấy đề thi + toàn bộ câu hỏi từ DB
  2. Với mỗi câu trả lời: gọi `checkAnswer()` (case-insensitive, trim)
  3. Tính `score = (correctCount / totalQuestions) × 100` (làm tròn)
  4. Xác định `passed = score >= passingScore`
  5. Lưu `ExamAttempt` vào MongoDB
  6. Trả về kết quả đầy đủ ngay lập tức
- **Response** `201`:
  ```json
  {
    "attemptId": "...",
    "examId": "...",
    "examTitle": "Đề thi thử Toán – Chương 3",
    "userId": "...",
    "score": 80,
    "totalQuestions": 10,
    "correctAnswers": 8,
    "passingScore": 60,
    "passed": true,
    "totalTimeSpentMs": 900000,
    "submittedAt": "2025-01-15T10:30:00Z",
    "details": [
      {
        "questionId": "<id>",
        "contentHtml": "<p>Phương trình bậc hai là...</p>",
        "type": "MULTIPLE_CHOICE",
        "difficulty": "MEDIUM",
        "options": ["A. x² + 2x = 0", "B. 3x + 1 = 0", "C. √x = 2", "D. x³ = 0"],
        "selectedAnswer": "A. x² + 2x = 0",
        "correctAnswer": "A. x² + 2x = 0",
        "explanation": "Phương trình bậc hai là phương trình có dạng ax² + bx + c = 0 với a ≠ 0...",
        "isCorrect": true,
        "timeSpentMs": 45000,
        "points": 10,
        "pointsEarned": 10
      }
    ]
  }
  ```

---

#### `GET /exams/:id/my-attempts` — Lịch sử bài thi của học sinh

- **Auth**: JWT | Role: `STUDENT`, `TEACHER`, `ADMIN`
- **Mô tả**: Danh sách tất cả bài nộp của học sinh hiện tại cho đề thi `:id`.
- **Response** `200`: `ExamAttemptSummaryDto[]` (sắp xếp theo thời gian gần nhất)
  ```json
  [
    {
      "attemptId": "...",
      "examId": "...",
      "userId": "...",
      "score": 80,
      "totalQuestions": 10,
      "correctAnswers": 8,
      "passed": true,
      "totalTimeSpentMs": 900000,
      "status": "graded",
      "submittedAt": "2025-01-15T10:30:00Z",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
  ```

---

#### `GET /exams/attempts/:attemptId/result` — **Bước 3** — Xem kết quả chi tiết

- **Auth**: JWT | Role: `STUDENT`, `TEACHER`, `ADMIN`
- **Mô tả**: Xem kết quả đầy đủ của một lần thi (có đáp án đúng + giải thích từng câu).
  - **Student**: chỉ xem được bài của mình (`passed` ownership check).
  - **Teacher / Admin**: xem được bài của bất kỳ học sinh nào.
- **Response** `200`: `ExamResultDto` (cấu trúc giống response của `/submit`)
- **Lỗi**: `403` nếu Student cố xem bài của người khác; `404` nếu không tìm thấy.

---

#### `GET /exams/:id/attempts` — Admin/Teacher xem tất cả bài nộp

- **Auth**: JWT | Role: `TEACHER`, `ADMIN`
- **Mô tả**: Xem danh sách tất cả bài nộp của mọi học sinh cho đề thi `:id`.
- **Response** `200`: `ExamAttemptSummaryDto[]`

---

## 5. Quy tắc chấm điểm

```
score = Math.round((correctAnswers / totalQuestions) × 100)
passed = score >= exam.passingScore
```

Cơ chế so sánh đáp án (`checkAnswer`):

| Loại câu hỏi    | Logic so sánh                              |
|-----------------|-------------------------------------------|
| `MULTIPLE_CHOICE` | So sánh text, case-insensitive, trim     |
| `TRUE_FALSE`     | So sánh text, case-insensitive, trim     |
| `FILL_IN_BLANK`  | So sánh text, case-insensitive, trim     |

---

## 6. Quy tắc bảo mật

| Quy tắc | Mô tả |
|---------|-------|
| `userId` không trong body | `userId` luôn lấy từ JWT token (`@CurrentUser()`) |
| `correctAnswer` ẩn ở bước 1 | `GET /exams/:id/start` không trả về `correctAnswer` hay `explanation` |
| Student chỉ xem bài của mình | `GET /attempts/:id/result` kiểm tra ownership khi role = `STUDENT` |
| Student chỉ thấy published exam | `GET /exams` tự động thêm `isPublished=true` filter |
| Không có hard-delete | Xóa = soft-delete (`isDeleted=true`, `deletedAt=now()`) |

---

## 7. Cấu trúc file

```
src/exams/
├── domain/
│   ├── exam.ts                              # Exam interface
│   └── exam-attempt.ts                      # ExamAttempt + ExamQuestionAnswer interfaces
├── dto/
│   ├── create-exam.dto.ts                   # POST /exams body
│   ├── update-exam.dto.ts                   # PUT /exams/:id body
│   ├── exam.dto.ts                          # Exam API response
│   ├── start-exam-response.dto.ts           # GET /exams/:id/start response
│   │                                         # + QuestionForExamDto (sanitised question)
│   ├── submit-exam.dto.ts                   # POST /exams/:id/submit body
│   ├── exam-result.dto.ts                   # Submit + Result response
│   │                                         # + ExamAttemptSummaryDto
│   ├── query-exam.dto.ts                    # FilterExamDto + SortExamDto + QueryExamDto
│   └── index.ts                             # Barrel exports
├── infrastructure/persistence/document/
│   ├── schemas/
│   │   ├── exam.schema.ts                   # ExamDocument (Mongoose)
│   │   └── exam-attempt.schema.ts           # ExamAttemptDocument (Mongoose)
│   ├── mappers/
│   │   ├── exam.mapper.ts                   # ExamMapper (Document ↔ Domain)
│   │   └── exam-attempt.mapper.ts           # ExamAttemptMapper
│   ├── repositories/
│   │   ├── exam.repository.abstract.ts      # ExamRepositoryAbstract
│   │   └── exam-attempt.repository.abstract.ts
│   ├── exam.repository.ts                   # ExamRepository (Mongoose impl)
│   ├── exam-attempt.repository.ts           # ExamAttemptRepository (Mongoose impl)
│   └── document-persistence.module.ts       # Wires schemas/mappers/repos
├── exam.service.ts                          # Business logic
├── exam.controller.ts                       # HTTP endpoints
├── exam.module.ts                           # NestJS module
└── index.ts                                 # Barrel export
```

---

## 8. Ví dụ sử dụng đầy đủ (curl)

```bash
# 1. Tạo đề thi (Teacher)
curl -X POST http://localhost:3000/exams \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Đề thi thử Toán – Chương 3",
    "questionIds": ["<q1>","<q2>","<q3>"],
    "timeLimitSeconds": 1800,
    "passingScore": 60,
    "isPublished": true
  }'

# 2. Học sinh bắt đầu thi (lấy câu hỏi không có đáp án)
curl -X GET http://localhost:3000/exams/<examId>/start \
  -H "Authorization: Bearer <student_token>"

# 3. Học sinh nộp bài
curl -X POST http://localhost:3000/exams/<examId>/submit \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"questionId":"<q1>","selectedAnswer":"A. x² + 2x = 0","timeSpentMs":30000},
      {"questionId":"<q2>","selectedAnswer":"True","timeSpentMs":15000},
      {"questionId":"<q3>","selectedAnswer":"Paris","timeSpentMs":10000}
    ],
    "totalTimeSpentMs": 55000
  }'

# 4. Xem lại kết quả bất kỳ lúc nào
curl -X GET http://localhost:3000/exams/attempts/<attemptId>/result \
  -H "Authorization: Bearer <student_token>"

# 5. Xem lịch sử tất cả bài thi của mình
curl -X GET http://localhost:3000/exams/<examId>/my-attempts \
  -H "Authorization: Bearer <student_token>"
```

---

*Tạo ngày: 2025 | Version: 1.0.0*
