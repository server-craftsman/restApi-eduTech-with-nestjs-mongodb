# Free vs Pro - Learning Flow Limits Guide

> Cập nhật: 2026-03-20  
> Mục tiêu: mô tả **từng endpoint cụ thể trong quá trình học** và hành vi giới hạn của account Free (có/không bắn exception).

## 1) Endpoint theo luồng học tập

### A. Luồng học bài (Sequential Learning)

1. `GET /sequential-learning/curriculum/:courseId`  
   - Lấy cây chương/bài + trạng thái khóa/mở theo user.

2. `POST /sequential-learning/video/:lessonId/progress`  
   (alias cũ: `POST /sequential-learning/lessons/:lessonId/video-progress`, `POST /sequential-learning/track-video`)  
   - Ghi tiến độ xem video.
   - **Đây là endpoint có thể kích hoạt giới hạn Free 5 bài/ngày** (xem mục 2.1).

3. `POST /sequential-learning/video/:lessonId/complete`  
   (alias: `POST /sequential-learning/lessons/:lessonId/video-complete`, `POST /sequential-learning/lesson/:lessonId/complete`)  
   - Đánh dấu đã xem xong video.
   - Cũng đi qua service tiến độ bài học, nên có thể chạm giới hạn Free nếu là bài mới trong ngày.

4. `GET /sequential-learning/lesson/:lessonId/questions`  
   - Lấy câu hỏi quiz của lesson (không trả lời đúng).

5. `POST /sequential-learning/lesson/:lessonId/submit-quiz`  
   - Nộp quiz lesson, chấm điểm ngay.
   - **Có giới hạn Free theo ngày**: vượt hạn mức sẽ trả `402 Payment Required` (xem mục 2.3).

6. `GET /sequential-learning/lesson/:lessonId/status`  
   - Lấy trạng thái lesson (isLocked, videoWatched, quizCompleted, ...).

7. `GET /sequential-learning/lesson/:lessonId/quiz-access`  
   - Kiểm tra có được vào quiz chưa.

### B. Luồng thi thử (Exams)

1. `GET /exams/:id/start`  
   - Bắt đầu đề thi (lấy đề đã sanitize).

2. `POST /exams/:id/submit`  
   - Nộp bài thi + chấm điểm.
   - **Đây là endpoint có giới hạn Free 2 lần/ngày** (xem mục 2.2).

### C. Endpoint paywall / gói

1. `GET /payments/plans/compare`  
   - Trả benefits Free vs Pro + pricing + `isCurrentlyPro`.

2. `GET /pro-test`  
   - Endpoint test guard Pro.
   - Free account sẽ bị chặn `402 Payment Required` với `requiresUpgrade: true`.

### D. AI Assistant (feature khác theo gói)

1. `POST /ai-assistant/ask`
2. `POST /ai-assistant/chat`

- Account Free **không bị exception 402** ở 2 endpoint này.
- Thay vào đó hệ thống ép về chế độ `brief` (trả lời ngắn).
- Account Pro giữ được chế độ `detailed`.

---

## 2) Free account bị giới hạn như thế nào?

## 2.1 Giới hạn học quá 5 bài/ngày

- Rule: Free chỉ tối đa **5 bài học mới/ngày**.
- Điểm chặn thực thi tại `LessonProgressService.updateProgressByUserAndLesson(...)`.
- Cơ chế đếm: `countNewLessonsToday(userId)` (đếm bản ghi lesson-progress tạo trong ngày).
- Nghĩa là:
  - Vào **bài mới thứ 6** trong ngày => bị chặn.
  - Vào lại bài đã mở trước đó => không tính là bài mới.

### Response khi vượt giới hạn học

HTTP status: `402 Payment Required`

```json
{
  "statusCode": 402,
  "timestamp": "2026-03-20T05:41:33.000Z",
  "path": "/api/v1/sequential-learning/video/<lessonId>/progress",
  "method": "POST",
  "message": "Bạn đã truy cập 5 bài học hôm nay. Nâng cấp Pro để học không giới hạn.",
  "requiresUpgrade": true,
  "upgradeUrl": "/payments/plans/compare",
  "remaining": 0
}
```

## 2.2 Giới hạn thi thử quá 2 lần/ngày

- Rule: Free chỉ tối đa **2 lượt nộp thi/ngày**.
- Điểm chặn thực thi tại `ExamService.submitExam(...)`.
- Cơ chế đếm: `examAttemptRepository.countTodayByUser(userId)`.
- Nghĩa là:
  - Lượt submit thứ 3 trong ngày => bị chặn.

### Response khi vượt giới hạn thi

HTTP status: `402 Payment Required`

```json
{
  "statusCode": 402,
  "timestamp": "2026-03-20T05:41:33.000Z",
  "path": "/api/v1/exams/<examId>/submit",
  "method": "POST",
  "message": "Bạn đã hết lượt thi hôm nay (2 lần/ngày). Nâng cấp Pro để thi không giới hạn.",
  "requiresUpgrade": true,
  "upgradeUrl": "/payments/plans/compare",
  "remaining": 0
}
```

## 2.3 Trường hợp Pro đã hết hạn

Cả luồng học bài và thi thử đều có nhánh riêng cho Pro hết hạn:

- Trả `402 Payment Required`
- Có `requiresRenewal: true` (thay vì `requiresUpgrade`)
- Message hướng dẫn gia hạn.

Ví dụ:

```json
{
  "statusCode": 402,
  "message": "Gói Pro của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục học không giới hạn.",
  "requiresRenewal": true,
  "upgradeUrl": "/payments/plans/compare"
}
```

## 2.4 Giới hạn làm quiz lesson quá số lượt/ngày

- Rule: Free chỉ tối đa **5 lượt làm quiz lesson/ngày**.
- Điểm chặn thực thi tại `SequentialLearningService.submitQuizForLesson(...)`.
- Cơ chế đếm: `QuizAttemptService.countTodayAttemptsByUser(userId)`.

### Response khi vượt giới hạn quiz lesson

HTTP status: `402 Payment Required`

```json
{
   "statusCode": 402,
   "timestamp": "2026-03-20T05:41:33.000Z",
   "path": "/api/v1/sequential-learning/lesson/<lessonId>/submit-quiz",
   "method": "POST",
   "message": "Bạn đã hết lượt làm quiz hôm nay (5 lần/ngày). Nâng cấp Pro để học và luyện tập không giới hạn.",
   "requiresUpgrade": true,
   "upgradeUrl": "/payments/plans/compare",
   "remaining": 0
}
```

---

## 3) Một số feature Free khác (trạng thái hiện tại)

Dựa trên code hiện tại:

1. **AI trợ lý cơ bản / nâng cao**
   - Đã có phân tầng thực thi:
     - Free: ép `brief`
     - Pro: cho phép `detailed`
   - Không bắn 402 cho Free.

2. **Học không giới hạn / thi không giới hạn**
   - Đã có enforcement bằng exception 402 như mục 2.

3. **Quảng cáo / Tải offline / Thống kê chi tiết / Hỗ trợ ưu tiên**
   - Hiện có trong metadata so sánh gói (`/payments/plans/compare`).
   - Chưa thấy endpoint guard/exception riêng theo từng feature này trong luồng học ở thời điểm tài liệu này.

## 3.1 Mapping trực tiếp theo payload so sánh gói

| Benefit label (payload) | Endpoint liên quan để test | Cách giới hạn cho Free hiện tại |
| --- | --- | --- |
| Học không giới | `POST /sequential-learning/video/:lessonId/progress` | Có chặn 402 khi vượt 5 bài mới/ngày (`requiresUpgrade`) |
| Thi không giới | `POST /exams/:id/submit` | Có chặn 402 khi vượt 2 lần/ngày (`requiresUpgrade`) |
| Quiz luyện tập theo lesson | `POST /sequential-learning/lesson/:lessonId/submit-quiz` | Có chặn 402 khi vượt 5 lần/ngày (`requiresUpgrade`) |
| Trợ lý AI | `POST /ai-assistant/ask`, `POST /ai-assistant/chat` | Không 402; Free bị ép `brief`, Pro dùng `detailed` |
| Quảng cáo | (chưa có endpoint enforcement riêng) | Hiện mới thể hiện ở metadata gói |
| Tải offline | (chưa có endpoint enforcement riêng) | Hiện mới thể hiện ở metadata gói |
| Thống kê chi | (chưa có endpoint enforcement riêng) | Hiện mới thể hiện ở metadata gói |
| Hỗ trợ ưu | (chưa có endpoint enforcement riêng) | Hiện mới thể hiện ở metadata gói |

---

## 4) Checklist test nhanh (QA)

1. Đăng nhập bằng account Free, lấy JWT.
2. Gọi `GET /payments/plans/compare` để xác nhận `isCurrentlyPro=false`.
3. Vào lesson mới liên tiếp qua endpoint video progress đến bài thứ 6 trong ngày.
   - Kỳ vọng: `402`, `requiresUpgrade=true`, `remaining=0`.
4. Submit exam lần 3 trong ngày tại `POST /exams/:id/submit`.
   - Kỳ vọng: `402`, `requiresUpgrade=true`, `remaining=0`.
5. Gọi `POST /ai-assistant/ask` với `explanationLevel=detailed` bằng account Free.
   - Kỳ vọng: vẫn thành công nhưng hệ thống xử lý theo chế độ brief.
6. Test account Pro ở các endpoint trên.
   - Kỳ vọng: không bị chặn bởi các limit Free.
