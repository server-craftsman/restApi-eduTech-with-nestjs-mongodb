# 🔍 Smart Search Flow & AI Assistant — API Workflow

> **Module:** `src/search/` + `src/ai-assistant/`  
> **Last Updated:** March 2026

---

## Tổng Quan

```
┌─────────────────────────────────────────────────────────────────┐
│                     SMART SEARCH FLOW                           │
│              (Luồng Hỗ Trợ Bài Tập — No OCR/Vision)           │
└─────────────────────────────────────────────────────────────────┘

  Học sinh                  Frontend                  Backend (NestJS)              MongoDB
     │                         │                             │                         │
     │  Gặp khó với bài tập    │                             │                         │
     │──────────────────────►  │                             │                         │
     │                         │                             │                         │
     │  [Bước 1] Nhập từ khóa  │                             │                         │
     │  vào thanh tìm kiếm     │                             │                         │
     │  "Hàm số"               │                             │                         │
     │──────────────────────►  │                             │                         │
     │                         │                             │                         │
     │                         │  GET /search?keyword=Hàm số │                         │
     │                         │  &type=all&page=1&limit=10  │                         │
     │                         │  Authorization: Bearer JWT  │                         │
     │                         │────────────────────────────►│                         │
     │                         │                             │                         │
     │                         │                 ┌───────────┴──────────────┐          │
     │                         │                 │ JwtAuthGuard.canActivate │          │
     │                         │                 │ Verify JWT token         │          │
     │                         │                 └───────────┬──────────────┘          │
     │                         │                             │                         │
     │                         │                 ┌───────────┴──────────────┐          │
     │                         │                 │ SearchController.search() │          │
     │                         │                 │ SearchQueryDto validation │          │
     │                         │                 └───────────┬──────────────┘          │
     │                         │                             │                         │
     │                         │                 ┌───────────┴──────────────┐          │
     │                         │                 │ SearchService.search()   │          │
     │                         │                 │ - type = 'all'           │          │
     │                         │                 │ - keyword = 'Hàm số'     │          │
     │                         │                 └─────┬──────────┬─────────┘          │
     │                         │                       │          │                     │
     │                         │         ┌─────────────┘          └──────────────────┐  │
     │                         │         │                                           │  │
     │                         │  LessonRepo.searchByKeyword()        MaterialRepo.searchByKeyword()
     │                         │         │                                           │  │
     │                         │         │ db.lessons.find({                         │  │
     │                         │         │   $or: [                        db.materials.find({
     │                         │         │     {title: /Hàm số/i},           title: /Hàm số/i
     │                         │         │     {description: /Hàm số/i},    })
     │                         │         │     {contentMd: /Hàm số/i}       │          │
     │                         │         │   ]                               │          │
     │                         │         │ }).skip(0).limit(10)              │          │
     │                         │         │──────────────────────────────────────────►  │
     │                         │         │◄─────────────────────────────────────────── │
     │                         │         │   [Lesson[], count]   [Material[], count]   │
     │                         │         └─────────────┐          └──────────────────┘  │
     │                         │                       │                                │
     │                         │                 ┌─────┴─────────────────────┐          │
     │                         │                 │ Map domain → DTO          │          │
     │                         │                 │ Build SearchResultDto     │          │
     │                         │                 └─────────────┬─────────────┘          │
     │                         │                               │                        │
     │                         │  HTTP 200 OK                  │                        │
     │                         │  {                            │                        │
     │                         │    keyword: "Hàm số",         │                        │
     │                         │    lessons: [...],            │                        │
     │                         │    materials: [...],          │                        │
     │                         │    totalLessons: 5,           │                        │
     │                         │    totalMaterials: 3,         │                        │
     │                         │    total: 8,                  │                        │
     │                         │    page: 1, limit: 10         │                        │
     │                         │  }                            │                        │
     │                         │◄──────────────────────────────┘                        │
     │                         │                                                        │
     │  [Bước 2] Hiển thị      │                                                        │
     │  danh sách Video/Lý thuyết                                                       │
     │◄──────────────────────  │                                                        │
```

---

## AI Assistant Flow

```
  Học sinh                  Frontend                  Backend (NestJS)         OpenAI API
     │                         │                             │                      │
     │  Copy đề bài paste vào  │                             │                      │
     │  ô nhập liệu (textarea) │                             │                      │
     │──────────────────────►  │                             │                      │
     │                         │                             │                      │
     │                         │  POST /ai-assistant/ask     │                      │
     │                         │  {                          │                      │
     │                         │    "question": "Cho hàm    │                      │
     │                         │      số f(x) = x²-3x+2..." │                      │
     │                         │    "subject": "Toán lớp 10" │                      │
     │                         │    "explanationLevel":      │                      │
     │                         │       "detailed"            │                      │
     │                         │  }                          │                      │
     │                         │────────────────────────────►│                      │
     │                         │                             │                      │
     │                         │             ┌───────────────┴──────────────────┐   │
     │                         │             │ JwtAuthGuard.canActivate          │   │
     │                         │             │ AiAssistantController.askQuestion │   │
     │                         │             │ AskQuestionDto validation         │   │
     │                         │             └───────────────┬──────────────────┘   │
     │                         │                             │                      │
     │                         │             ┌───────────────┴──────────────────┐   │
     │                         │             │ AiAssistantService.askQuestion() │   │
     │                         │             │                                  │   │
     │                         │             │ systemPrompt = "Bạn là gia sư AI │   │
     │                         │             │   Môn học: Toán lớp 10.          │   │
     │                         │             │   Giải thích từng bước..."       │   │
     │                         │             │                                  │   │
     │                         │             │ fetch(openai_url, {              │   │
     │                         │             │   model: "gpt-4o-mini",          │   │
     │                         │             │   messages: [system, user],      │   │
     │                         │             │   temperature: 0.3,              │   │
     │                         │             │   max_tokens: 2000               │   │
     │                         │             │ })                               │   │
     │                         │             └───────────────┬──────────────────┘   │
     │                         │                             │                      │
     │                         │                             │  POST /v1/chat/completions
     │                         │                             │  Authorization: Bearer OPENAI_KEY
     │                         │                             │─────────────────────►│
     │                         │                             │                      │
     │                         │                             │◄─────────────────────│
     │                         │                             │  {                   │
     │                         │                             │    choices: [{       │
     │                         │                             │      message: {      │
     │                         │                             │        content: "**Bước 1:** Tính đạo hàm..."
     │                         │                             │      }               │
     │                         │                             │    }],               │
     │                         │                             │    usage: {          │
     │                         │                             │      total_tokens:420│
     │                         │                             │    },                │
     │                         │                             │    model: "gpt-4o-mini"
     │                         │                             │  }                   │
     │                         │                             │                      │
     │                         │  HTTP 200 OK                │                      │
     │                         │  {                          │                      │
     │                         │    question: "Cho hàm số...",                      │
     │                         │    solution: "## Giải\n\n**Bước 1:**...",          │
     │                         │    subject: "Toán lớp 10", │                      │
     │                         │    tokensUsed: 420,         │                      │
     │                         │    model: "gpt-4o-mini",    │                      │
     │                         │    processingTimeMs: 1350   │                      │
     │                         │  }                          │                      │
     │                         │◄────────────────────────────│                      │
     │                         │                             │                      │
     │  Hiển thị lời giải      │                             │                      │
     │  (Render Markdown)      │                             │                      │
     │◄──────────────────────  │                             │                      │
```

---

## API Endpoints

### 1. Smart Search

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **URL** | `/search` |
| **Auth** | JWT Bearer Token required |
| **Guard** | `JwtAuthGuard` |

#### Query Parameters

| Param | Type | Required | Default | Mô tả |
|-------|------|----------|---------|-------|
| `keyword` | string | ✅ | — | Từ khóa tìm kiếm (1–200 ký tự) |
| `type` | `all` \| `lessons` \| `materials` | ❌ | `all` | Loại tài liệu cần tìm |
| `page` | number | ❌ | `1` | Trang hiện tại |
| `limit` | number | ❌ | `10` | Số kết quả mỗi trang (tối đa 50) |

#### Ví dụ Request

```http
GET /search?keyword=Hàm số&type=all&page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response Body

```json
{
  "success": true,
  "message": "Tìm thấy 8 kết quả cho \"Hàm số\"",
  "data": {
    "keyword": "Hàm số",
    "lessons": [
      {
        "id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "chapterId": "64f1a2b3c4d5e6f7a8b9c0d2",
        "title": "Hàm số bậc hai và đồ thị",
        "description": "Nghiên cứu hàm số f(x) = ax² + bx + c...",
        "videoUrl": "https://res.cloudinary.com/.../video.mp4",
        "durationSeconds": 1800,
        "contentMd": "## Hàm số bậc hai\n...",
        "isPreview": false,
        "orderIndex": 3,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "materials": [
      {
        "id": "64f1a2b3c4d5e6f7a8b9c0d3",
        "lessonId": "64f1a2b3c4d5e6f7a8b9c0d1",
        "title": "Tóm tắt lý thuyết Hàm số bậc hai",
        "fileUrl": "https://res.cloudinary.com/.../summary.pdf",
        "type": "pdf",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "totalLessons": 5,
    "totalMaterials": 3,
    "total": 8,
    "page": 1,
    "limit": 10
  }
}
```

---

### 2. AI Assistant — Ask Question

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **URL** | `/ai-assistant/ask` |
| **Auth** | JWT Bearer Token required |
| **Guard** | `JwtAuthGuard` |
| **External** | OpenAI Chat Completions API (`gpt-4o-mini`) |

#### Request Body

```json
{
  "question": "Cho hàm số f(x) = x² - 3x + 2. Tìm các khoảng đơn điệu của hàm số và xác định cực trị nếu có.",
  "subject": "Toán học lớp 10",
  "explanationLevel": "detailed"
}
```

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `question` | string | ✅ | Nội dung đề bài (10–5000 ký tự) |
| `subject` | string | ❌ | Môn học (để AI hiểu ngữ cảnh) |
| `explanationLevel` | `brief` \| `detailed` | ❌ | Mức độ giải thích (mặc định: `detailed`) |

#### Response Body

```json
{
  "success": true,
  "message": "AI đã trả lời câu hỏi trong 1350ms",
  "data": {
    "question": "Cho hàm số f(x) = x² - 3x + 2...",
    "solution": "## Giải\n\n**Bước 1: Tính đạo hàm**\n\nf'(x) = 2x - 3\n\n**Bước 2: Giải f'(x) = 0**\n\n2x - 3 = 0 → x = 3/2\n\n**Bước 3: Bảng biến thiên**\n\n...",
    "subject": "Toán học lớp 10",
    "tokensUsed": 420,
    "model": "gpt-4o-mini",
    "processingTimeMs": 1350
  }
}
```

---

## Database Search Logic

### Lessons Collection — searchByKeyword

```javascript
// MongoDB query được thực thi
db.lessons.find({
  $or: [
    { title: { $regex: "Hàm số", $options: "i" } },
    { description: { $regex: "Hàm số", $options: "i" } },
    { contentMd: { $regex: "Hàm số", $options: "i" } }
  ]
})
.skip((page - 1) * limit)
.limit(limit)
.sort({ orderIndex: 1 })
```

### Materials Collection — searchByKeyword

```javascript
// MongoDB query được thực thi
db.materials.find({
  title: { $regex: "Hàm số", $options: "i" }
})
.skip((page - 1) * limit)
.limit(limit)
```

---

## Environment Variables

Thêm vào file `.env`:

```env
# OpenAI AI Assistant
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini        # hoặc gpt-4o, gpt-3.5-turbo
OPENAI_MAX_TOKENS=2000          # Giới hạn token response (tối đa 4096 với gpt-4o-mini)
```

> **Lưu ý**: `OPENAI_API_KEY` là **tuỳ chọn** trong môi trường `development`.  
> Nếu không có key, endpoint `/ai-assistant/ask` sẽ trả về `400 Bad Request` với thông báo rõ ràng.

---

## Module Structure

```
src/
├── search/                          ← Smart Search Module
│   ├── dto/
│   │   ├── search-query.dto.ts      ← SearchQueryDto (keyword, type, page, limit)
│   │   ├── search-result.dto.ts     ← SearchResultDto, LessonSearchResultDto, MaterialSearchResultDto
│   │   └── index.ts
│   ├── search.service.ts            ← Gọi lessonRepo + materialRepo, build DTO
│   ├── search.controller.ts         ← GET /search
│   ├── search.module.ts             ← imports LessonModule, MaterialModule
│   └── index.ts
│
├── ai-assistant/                    ← AI Assistant Module
│   ├── dto/
│   │   ├── ask-question.dto.ts      ← AskQuestionDto (question, subject, explanationLevel)
│   │   ├── ai-response.dto.ts       ← AiResponseDto (solution, tokensUsed, model, ms)
│   │   └── index.ts
│   ├── interfaces/
│   │   ├── openai.interface.ts      ← OpenAiChatResponse, OpenAiMessage, ...
│   │   └── index.ts
│   ├── ai-assistant.service.ts      ← Gọi OpenAI API qua native fetch()
│   ├── ai-assistant.controller.ts   ← POST /ai-assistant/ask
│   ├── ai-assistant.module.ts       ← imports ConfigModule
│   └── index.ts
│
├── lessons/
│   └── infrastructure/persistence/document/repositories/
│       ├── lesson.repository.abstract.ts   ← +searchByKeyword(keyword, page, limit)
│       └── lesson.repository.ts            ← Implements regex search trên title, description, contentMd
│
└── materials/
    └── infrastructure/persistence/document/repositories/
        ├── material.repository.abstract.ts ← +searchByKeyword(keyword, page, limit)
        └── material.repository.ts          ← Implements regex search trên title
```

---

## Error Handling

| Trường hợp | HTTP Status | Message |
|------------|-------------|---------|
| Thiếu `keyword` | `400` | Từ khóa không được để trống |
| `keyword` > 200 ký tự | `400` | Từ khóa không được vượt quá 200 ký tự |
| Chưa đăng nhập | `401` | Unauthorized |
| `question` < 10 ký tự | `400` | Câu hỏi phải có ít nhất 10 ký tự |
| `question` > 5000 ký tự | `400` | Câu hỏi không được vượt quá 5000 ký tự |
| `OPENAI_API_KEY` chưa cấu hình | `400` | OpenAI API key chưa được cấu hình... |
| Lỗi kết nối OpenAI | `400` | Không thể kết nối tới dịch vụ AI. Vui lòng thử lại sau. |
| OpenAI API trả lỗi | `400` | Lỗi từ dịch vụ AI: {message} |

---

## Luồng Tổng Thể — Combined Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SMART SEARCH + AI ASSISTANT                       │
│                     Luồng Hỗ Trợ Bài Tập                            │
└──────────────────────────────────────────────────────────────────────┘

  Học sinh gặp bài khó
          │
          ▼
  [Bước 1] Tìm kiếm tài liệu
  ┌────────────────────────────────────────────────────┐
  │  GET /search?keyword=<từ_khóa>&type=all           │
  │                                                    │
  │  Kết quả:                                          │
  │  ✅ Danh sách Video bài giảng liên quan            │
  │  ✅ Danh sách Tài liệu lý thuyết (PDF, DOCX...)   │
  └────────────────────────────────────────────────────┘
          │
          │  [Nếu tìm được tài liệu phù hợp]
          ▼
  Xem Video / Đọc tài liệu → Hiểu bài ✅
          │
          │  [Nếu vẫn chưa hiểu]
          ▼
  [Bước 2] Hỏi AI Gia Sư
  ┌────────────────────────────────────────────────────┐
  │  POST /ai-assistant/ask                            │
  │  {                                                 │
  │    "question": "<copy_paste_đề_bài>",             │
  │    "subject": "<môn_học>",                         │
  │    "explanationLevel": "detailed"                  │
  │  }                                                 │
  │                                                    │
  │  Kết quả:                                          │
  │  ✅ Lời giải từng bước (Markdown)                 │
  │  ✅ Giải thích bằng tiếng Việt                    │
  │  ✅ Công thức + Ví dụ minh họa                    │
  └────────────────────────────────────────────────────┘
          │
          ▼
  Học sinh hiểu bài ✅
```
