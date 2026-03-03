# EduTech Learning Platform - API Workflow Documentation

This document provides a comprehensive guide to the implemented learning features and their API workflows.

## 📚 Overview

The EduTech backend now supports a complete personalized learning experience with:

- **Grade-based content filtering** (Grade 10, 11, 12)
- **Sequential learning paths** with unlock mechanisms
- **Video progress tracking** with real-time updates
- **Quiz system** with immediate feedback
- **Dashboard** with comprehensive progress analytics

## 🔐 Authentication & Registration

### Student Registration with Grade Selection

```http
POST /auth/signup
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "Student",
  "gradeLevel": "Grade10"  // Required: Grade10, Grade11, or Grade12
}
```

**Response:**

```json
{
  "user": {
    "id": "user_id_here",
    "email": "student@example.com",
    "role": "Student",
    "studentProfile": {
      "gradeLevel": "Grade10",
      "currentStreak": 0,
      "diamondBalance": 0,
      "xpTotal": 0
    }
  },
  "message": "Registration successful. Please check your email to verify your account."
}
```

### Login

```http
POST /auth/signin
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123"
}
```

## 📊 Dashboard & Progress Overview

### Get User Dashboard

```http
GET /dashboard
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "learningPath": [
    {
      "id": "math_course_id",
      "title": "Mathematics Grade 10",
      "type": "subject",
      "status": "in-progress",
      "progress": 45,
      "children": [
        {
          "id": "chapter_1_id",
          "title": "Algebra Basics",
          "type": "chapter",
          "status": "completed",
          "progress": 100,
          "children": [
            {
              "id": "lesson_1_id",
              "title": "Introduction to Variables",
              "type": "lesson",
              "status": "completed",
              "progress": 100,
              "prerequisiteCompleted": true,
              "videoUrl": "https://youtube.com/watch?v=...",
              "quizId": "quiz_1_id"
            },
            {
              "id": "lesson_2_id",
              "title": "Linear Equations",
              "type": "lesson",
              "status": "locked",
              "progress": 0,
              "prerequisiteCompleted": false
            }
          ]
        }
      ]
    }
  ],
  "progressSummary": {
    "totalLessons": 24,
    "completedLessons": 8,
    "progressPercent": 33,
    "totalXP": 800
  },
  "userInfo": {
    "email": "student@example.com",
    "gradeLevel": "Grade10",
    "currentStreak": 5,
    "diamondBalance": 150
  }
}
```

### Get Learning Statistics

```http
GET /dashboard/stats
Authorization: Bearer <jwt_token>
```

## 🗺️ Learning Path API

### Get Personalized Learning Path

```http
GET /learning-path
Authorization: Bearer <jwt_token>
```

Returns a hierarchical tree structure filtered by user's grade level:

- **Subject Level**: Mathematics, Physics, Chemistry, etc.
- **Chapter Level**: Organized topics within each subject
- **Lesson Level**: Individual lessons with unlock status

### Check Lesson Unlock Status

```http
POST /learning-path/unlock-lesson/{lessonId}
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Bài học đã được mở khóa",
  "nextLessonId": "lesson_2_id"
}
```

**Error Response (Locked):**

```json
{
  "success": false,
  "message": "Bạn cần xem xong video bài trước để mở khóa bài này"
}
```

## 📹 Sequential Learning Workflow

### 1. Video Progress Tracking

Track real-time video watching progress:

```http
POST /sequential-learning/track-video
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "lessonId": "lesson_1_id",
  "currentTime": 180,     // seconds
  "duration": 300,        // total duration in seconds
  "completed": false      // true when video is fully watched
}
```

**Implementation Notes:**

- Call this endpoint every 10-30 seconds while video is playing
- Set `completed: true` when user reaches 90%+ of video duration
- Progress is automatically calculated as `(currentTime / duration) * 100`

### 2. Quiz Access Control

Check if quiz is unlocked after video completion:

```http
GET /sequential-learning/quiz-access/{lessonId}
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "canAccess": true
}
```

### 3. Quiz Submission & Instant Feedback

Submit quiz answers for immediate grading:

```http
POST /sequential-learning/submit-quiz
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "lessonId": "lesson_1_id",
  "answers": [
    {
      "questionId": "q1_id",
      "selectedAnswer": "B"
    },
    {
      "questionId": "q2_id",
      "selectedAnswer": "A"
    },
    // ... up to 10 questions
  ]
}
```

**Response:**

```json
{
  "score": 85,
  "totalQuestions": 10,
  "correctAnswers": 8,
  "passed": true, // true if score >= 80%
  "details": [
    {
      "questionId": "q1_id",
      "correct": false,
      "selectedAnswer": "B",
      "correctAnswer": "A"
    },
    {
      "questionId": "q2_id",
      "correct": true,
      "selectedAnswer": "A",
      "correctAnswer": "A"
    }
    // ... for all questions
  ]
}
```

### 4. Get Comprehensive Lesson Status

```http
GET /sequential-learning/lesson-status/{lessonId}
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "videoWatched": true,
  "quizCompleted": true,
  "quizScore": 85,
  "canAccessQuiz": true,
  "isCompleted": true
}
```

## 🏆 Unlock Mechanism Rules

### Lesson Progression Logic

1. **First Lesson**: Always unlocked
2. **Subsequent Lessons**: Unlocked only when previous lesson meets both conditions:
   - ✅ Video watched to completion (`videoWatched: true`)
   - ✅ Quiz passed with score ≥ 80% (`quizScore >= 80`)

### Example Workflow:

```
Lesson 1: [UNLOCKED] → Watch Video → Take Quiz (Score: 85%) → ✅ COMPLETED
    ↓
Lesson 2: [UNLOCKED] → Watch Video → Take Quiz (Score: 75%) → ❌ NOT COMPLETED
    ↓
Lesson 3: [LOCKED] ← Cannot access until Lesson 2 quiz score ≥ 80%
```

## 📱 Frontend Integration Guide

### Recommended Learning Flow

1. **Load Dashboard**: Show progress overview and available subjects
2. **Select Subject/Chapter**: Navigate to specific learning path
3. **Check Lesson Status**: Verify if lesson is unlocked
4. **Video Learning**:
   - Play video with progress tracking every 15-30 seconds
   - Mark as completed when user reaches 90%+ of duration
5. **Quiz Access**:
   - Enable quiz button only after video completion
   - Show lock icon with tooltip if quiz is not accessible
6. **Quiz Taking**:
   - Present 10 questions sequentially or all at once
   - Submit all answers together for immediate results
7. **Progress Update**:
   - Show score immediately with correct/incorrect breakdown
   - Update lesson status and unlock next lesson if passed
   - Refresh learning path to show newly unlocked content

### Real-time Updates

For optimal UX, implement these real-time features:

- **Progress bars** updating as video plays
- **Instant quiz feedback** with color-coded results
- **Unlock animations** when new lessons become available
- **Achievement notifications** for milestones (streaks, perfect scores, etc.)

### Error Handling

Common scenarios to handle gracefully:

- **Video not completed**: Show friendly message about watching video first
- **Low quiz score**: Encourage retaking with "You got 75% - try for 80% to unlock next lesson!"
- **Network issues**: Cache progress locally and sync when connection restored
- **Session timeout**: Redirect to login with return URL to current lesson

## 🔧 Technical Implementation Notes

### Database Schema Updates

New fields added to support sequential learning:

- **Courses**: `gradeLevel` enum field for content filtering
- **Lessons**: `quizId` optional field linking to quiz
- **LessonProgress**: Extended with video/quiz tracking fields
- **QuizAttempts**: Restructured for comprehensive attempt logging

### Performance Considerations

- **Lazy Loading**: Load learning path progressively (subjects → chapters → lessons)
- **Caching**: Cache lesson progress data to reduce API calls
- **Batch Updates**: Group video progress updates to avoid excessive requests
- **Optimistic Updates**: Update UI immediately, sync with server in background

### Security & Validation

- **JWT Authentication**: All endpoints require valid user session
- **Rate Limiting**: Prevent excessive video tracking requests
- **Input Validation**: Strict validation on quiz answers and progress data
- **Grade Level Enforcement**: Server-side filtering ensures users only see appropriate content

## 🚀 Next Steps & Extensions

### Planned Features

- **Offline Mode**: Download lessons for offline viewing
- **Adaptive Learning**: Adjust difficulty based on performance
- **Social Features**: Study groups and peer comparisons
- **Gamification**: Badges, leaderboards, and achievement systems
- **Analytics**: Detailed learning analytics for educators

### API Versioning

Current implementation uses `/v1/` prefix implicitly. Future versions will maintain backward compatibility with proper API versioning strategy.

---

_This documentation covers the core learning workflow APIs. For detailed endpoint schemas, refer to the Swagger documentation at `/api/docs`._
