# Reward Flow — Luồng Động Lực (Simple Reward System)

> **Version:** 1.0  
> **Ngày tạo:** 2026-03-09  
> **Mô tả:** Hệ thống tích điểm + huy hiệu (badge) đơn giản, **không** cần kho hàng hay đồng xu.  
> Học sinh tự động nhận điểm sau mỗi hành động học tập; khi tổng điểm vượt ngưỡng → tự động mở khóa huy hiệu.

---

## Actors

| Actor | Mô tả |
|---|---|
| **Student** | Học sinh đang học và làm quiz |
| **System** | Backend NestJS — tự động tích điểm và kiểm tra huy hiệu |
| **Admin** | Xem reward profile của bất kỳ học sinh nào |

---

## Bảng Huy Hiệu (Badge Catalog)

| Huy hiệu | Enum | Điểm tối thiểu | Mô tả |
|---|---|---:|---|
| Bước đầu tiên | `first_step` | 10 | Hoàn thành bài học đầu tiên |
| Chăm chỉ | `diligent` | 100 | Tích lũy 100 điểm thưởng |
| Ngôi sao mới nổi | `rising_star` | 500 | Tích lũy 500 điểm thưởng |
| **Học bá** | `scholar` | 1 000 | Tích lũy 1 000 điểm |
| Quán quân | `champion` | 3 000 | Tích lũy 3 000 điểm |
| **Khung Avatar Vàng** | `gold_avatar_frame` | 5 000 | Tích lũy 5 000 điểm |
| Huyền thoại | `legend` | 10 000 | Tích lũy 10 000 điểm |

---

## Bảng Sự Kiện Điểm

| Sự kiện | Điểm | Điều kiện |
|---|---:|---|
| Hoàn thành bài học | **+10** | Lần đầu `isCompleted` chuyển `false → true` |
| Điểm 100% thi thử (quiz) | **+50** | `score === 100` trong `QuizAttempt.submitAttempt()` |

---

## Luồng 1 — Hoàn Thành Bài Học (+10 điểm)

```
Student                     LessonProgressService      RewardService          StudentProfile DB
  |                                  |                       |                      |
  |-- PATCH /lesson-progress ──────→ |                       |                      |
  |   (isCompleted: true)            |                       |                      |
  |                                  | check existing.isCompleted                   |
  |                                  | if already true → skip reward                |
  |                                  | update progress → isCompleted=true           |
  |                                  |                       |                      |
  |                                  |-- [fire-and-forget] ─→|                      |
  |                                  |   awardLessonCompletion(userId)              |
  |←── 200 LessonProgress ──────────|                       |                      |
  |                                  |                       |-- $inc totalPoints +10|
  |                                  |                       |←─ new total           |
  |                                  |                       | computeNewBadges()    |
  |                                  |                       | if threshold crossed: |
  |                                  |                       |-- $addToSet badge ───→|
```

**Điểm quan trọng:**
- Chỉ award khi `isCompleted` thay đổi từ `false` → `true` (lần đầu tiên).
- Bước reward chạy **fire-and-forget**, lỗi không làm gián đoạn lesson progress.
- `$inc` + `$addToSet` là atomic MongoDB operations.

---

## Luồng 2 — Thi thử Điểm 100% (+50 điểm)

```
Student                   QuizAttemptService          RewardService          StudentProfile DB
  |                               |                        |                      |
  |-- POST /quiz-attempts ───────→|                        |                      |
  |   { lessonId, answers }       |                        |                      |
  |                               | grade all answers (server-side)               |
  |                               | score = round(correct/total × 100)            |
  |                               | create QuizAttempt → DB                       |
  |                               |                        |                      |
  |                               |-- [fire-and-forget] ──→|  (only if score=100) |
  |                               |   awardPerfectQuiz(userId)                    |
  |                               |                        |-- $inc totalPoints +50|
  |                               |                        | computeNewBadges()    |
  |                               |                        |-- $addToSet badge ───→|
  |←── 201 QuizAttemptDto ───────|                        |                      |
```

**Điểm quan trọng:**
- Điểm được tính hoàn toàn server-side; client không thể giả mạo.
- Reward award không chặn phản hồi quiz — luôn trả về `201` ngay lập tức.
- Không có giới hạn số lần đạt 100% nhận +50 điểm (mỗi lần nộp đạt điểm tuyệt đối đều được thưởng).

---

## Luồng 3 — Mở Khóa Huy Hiệu (Tự Động)

```
RewardService.awardPoints(userId, points):
  1. studentProfileService.incrementPoints(userId, points)
       └── MongoDB: $inc { totalPoints: +N }    [atomic]
       └── Returns updated profile (new totalPoints, current badges[])
  
  2. computeNewBadges(newTotal, existingBadges):
       └── BADGE_THRESHOLDS.filter(t => newTotal >= t.minPoints && !badges.includes(t.badge))
  
  3. For each newly earned badge:
       studentProfileService.addBadge(userId, badge)
         └── MongoDB: $addToSet { badges: badge }   [idempotent]
```

**Ví dụ:**
```
Trước:  totalPoints=990, badges=['first_step','diligent','rising_star']
Event:  +10 điểm (hoàn thành bài học)
Sau:    totalPoints=1000
Mới:    computeNewBadges(1000, [...]) → ['scholar']
Action: $addToSet badges = 'scholar'
Kết quả: badges=['first_step','diligent','rising_star','scholar'] ✅
```

---

## Luồng 4 — Xem Reward Profile

```
Student                    RewardController            RewardService         StudentProfileService
  |                               |                        |                       |
  |-- GET /rewards/my-rewards ──→ |                        |                       |
  |   (Bearer token)              |-- getMyRewards(userId)→|                       |
  |                               |                        |-- getProfileByUserId()→|
  |                               |                        |← { totalPoints, badges }|
  |                               |                        | find nextThreshold     |
  |←── 200 MyRewardsDto ─────────|                        |                       |
  |    {                          |                        |                       |
  |      totalPoints: 1250,       |                        |                       |
  |      badges: ['first_step',   |                        |                       |
  |               'diligent',     |                        |                       |
  |               'scholar'],     |                        |                       |
  |      nextBadge: {             |                        |                       |
  |        badge: 'champion',     |                        |                       |
  |        minPoints: 3000,       |                        |                       |
  |        label: 'Quán quân'    |                        |                       |
  |      },                       |                        |                       |
  |      pointsToNextBadge: 1750  |                        |                       |
  |    }                          |                        |                       |
```

---

## API Endpoints — Quick Reference

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/rewards/badges/catalog` | ❌ Public | Danh sách tất cả huy hiệu với điều kiện mở khóa |
| `GET` | `/rewards/my-rewards` | ✅ JWT | Xem điểm, huy hiệu, mục tiêu tiếp theo của bản thân |
| `GET` | `/rewards/admin/user/:userId` | ✅ Admin | Xem reward profile của bất kỳ học sinh |

---

## Cấu Trúc Dữ Liệu

### `MyRewardsDto` (response)

```json
{
  "totalPoints": 1250,
  "badges": ["first_step", "diligent", "rising_star", "scholar"],
  "nextBadge": {
    "badge": "champion",
    "label": "Quán quân",
    "description": "Tích lũy đủ 3 000 điểm thưởng",
    "minPoints": 3000
  },
  "pointsToNextBadge": 1750
}
```

### `BadgeCatalogItemDto` (response)

```json
{
  "badge": "scholar",
  "label": "Học bá",
  "description": "Tích lũy đủ 1 000 điểm thưởng",
  "minPoints": 1000
}
```

### Thay đổi trên `StudentProfile` (MongoDB collection `student_profiles`)

| Field | Type | Default | Mô tả |
|---|---|---|---|
| `totalPoints` | `Number` | `0` | Tổng điểm tích lũy |
| `badges` | `String[]` | `[]` | Mảng enum `BadgeType`, dùng `$addToSet` |

---

## Quy Tắc Nghiệp Vụ

1. **Điểm không bao giờ bị trừ** — Chỉ tăng theo sự kiện học tập.
2. **Huy hiệu không bao giờ bị thu hồi** — Dùng `$addToSet`, idempotent.
3. **Không kho hàng, không đổi quà** — Huy hiệu là phần thưởng hiển thị, không có giá trị đổi chác.
4. **Chỉ thưởng lần đầu hoàn thành bài học** — Kiểm tra `isCompleted` trước khi award.
5. **Thi thử 100% được thưởng mỗi lần** — Không giới hạn số lần nhận +50 cho quiz đạt tuyệt đối.
6. **Atomic operations** — `$inc` cho totalPoints, `$addToSet` cho badges, không bao giờ dùng `read → modify → write`.
7. **Fire-and-forget** — Lỗi reward không bao giờ làm gián đoạn luồng học tập chính.
8. **Badge tự động check** — Mỗi khi `awardPoints()` chạy, nó luôn kiểm tra toàn bộ bảng thresholds.

---

## Cấu Trúc Module Files

```
src/
├── enums/
│   └── badge.enum.ts                  # BadgeType enum (7 badges)
├── rewards/
│   ├── dto/
│   │   ├── my-rewards.dto.ts          # MyRewardsDto + BadgeCatalogItemDto
│   │   └── index.ts
│   ├── reward.service.ts              # Core logic: awardPoints, computeNewBadges, BADGE_THRESHOLDS
│   ├── reward.controller.ts           # 3 endpoints: catalog, my-rewards, admin view
│   ├── reward.module.ts               # imports StudentProfileModule; exports RewardService
│   └── index.ts
└── student-profiles/
    ├── domain/student-profile.ts      # + totalPoints: number, badges: BadgeType[]
    ├── infrastructure/persistence/document/
    │   ├── schemas/student-profile.schema.ts  # + @Prop totalPoints, badges
    │   ├── mappers/student-profile.mapper.ts  # + map totalPoints, badges
    │   └── repositories/
    │       ├── student-profile.repository.abstract.ts  # + incrementPoints, addBadge
    │       └── student-profile.repository.ts           # implement with $inc, $addToSet
    └── student-profile.service.ts     # + incrementPoints, addBadge methods
```

### Dependency Graph (không circular):

```
RewardModule
  └── imports StudentProfileModule

LessonProgressModule
  └── imports RewardModule  (→ StudentProfileModule)

QuizAttemptModule
  └── imports RewardModule  (→ StudentProfileModule)
  └── imports WrongAnswerModule
```

---

## Thêm Badge Mới (How to Extend)

Thêm badge mới trong 2 bước:

**Bước 1 — Thêm enum value:**
```typescript
// src/enums/badge.enum.ts
export enum BadgeType {
  // ...
  NewBadge = 'new_badge',  // ← thêm vào đây
}
```

**Bước 2 — Thêm threshold:**
```typescript
// src/rewards/reward.service.ts
export const BADGE_THRESHOLDS: BadgeThreshold[] = [
  // ...
  {
    badge: BadgeType.NewBadge,
    minPoints: 2_000,
    label: 'Tên hiển thị',
    description: 'Mô tả điều kiện mở khóa',
  },
];
```

Không cần thay đổi bất kỳ file nào khác — engine tự động kiểm tra khi award điểm.
