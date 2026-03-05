import { Injectable } from '@nestjs/common';
import { LessonProgressService } from '../lesson-progress/lesson-progress.service';
import { QuizAttemptService } from '../quiz-attempts/quiz-attempt.service';
import { LessonService } from '../lessons/lesson.service';

export interface VideoTrackingDto {
  lessonId: string;
  currentTime: number;
  duration: number;
  completed: boolean;
}

export interface QuizSubmissionDto {
  lessonId: string;
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
  }>;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  details: Array<{
    questionId: string;
    correct: boolean;
    selectedAnswer: string;
    correctAnswer: string;
  }>;
}

@Injectable()
export class SequentialLearningService {
  constructor(
    private readonly lessonProgressService: LessonProgressService,
    private readonly quizAttemptService: QuizAttemptService,
    private readonly lessonService: LessonService,
  ) {}

  async trackVideoProgress(
    userId: string,
    trackingData: VideoTrackingDto,
  ): Promise<void> {
    const { lessonId, currentTime, duration, completed } = trackingData;

    // Cập nhật progress của lesson
    const progressPercent = Math.round((currentTime / duration) * 100);

    await this.lessonProgressService.updateProgressByUserAndLesson(
      userId,
      lessonId,
      {
        progressPercent: Math.max(progressPercent, 0),
        videoWatched: completed,
        lastWatchedAt: new Date(),
        videoCurrentTime: currentTime,
        videoDuration: duration,
      },
    );
  }

  async canAccessQuiz(userId: string, lessonId: string): Promise<boolean> {
    const progress = await this.lessonProgressService.findByUserAndLesson(
      userId,
      lessonId,
    );
    return progress?.videoWatched || false;
  }

  async submitQuiz(
    userId: string,
    quizData: QuizSubmissionDto,
  ): Promise<QuizResult> {
    const { lessonId, answers } = quizData;

    // Kiểm tra xem đã xem video chưa
    const canAccess = await this.canAccessQuiz(userId, lessonId);
    if (!canAccess) {
      throw new Error('Bạn cần xem xong video trước khi làm bài tập');
    }

    // Lấy lesson để có quiz info
    const lesson = await this.lessonService.findById(lessonId);
    if (!lesson?.quizId) {
      throw new Error('Bài học này không có bài tập');
    }

    // Chấm điểm quiz
    const result = this.gradeQuiz(lesson.quizId, answers);

    // Lưu kết quả - submit the entire quiz attempt at once
    await this.quizAttemptService.submitAttempt({
      userId,
      quizId: lesson.quizId,
      lessonId,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        isCorrect:
          result.details.find((d) => d.questionId === a.questionId)?.correct ||
          false,
        timeSpentMs: 0,
      })),
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      totalTimeSpentMs: 0,
    });

    // Cập nhật lesson progress nếu đạt điểm
    if (result.passed) {
      await this.lessonProgressService.updateProgressByUserAndLesson(
        userId,
        lessonId,
        {
          quizCompleted: true,
          quizScore: result.score,
          progressPercent: 100, // Hoàn thành 100% khi pass quiz
        },
      );
    }

    return result;
  }

  private gradeQuiz(
    quizId: string,
    answers: Array<{ questionId: string; selectedAnswer: string }>,
  ): QuizResult {
    // TODO: Implement actual quiz grading logic
    // Tạm thời mock data để test
    const totalQuestions = answers.length;
    let correctAnswers = 0;
    const details: Array<{
      questionId: string;
      correct: boolean;
      selectedAnswer: string;
      correctAnswer: string;
    }> = [];

    for (const answer of answers) {
      // Mock logic: giả sử đáp án đúng là 'A' cho tất cả câu
      const correct = answer.selectedAnswer === 'A';
      if (correct) correctAnswers++;

      details.push({
        questionId: answer.questionId,
        correct,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: 'A', // Mock correct answer
      });
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= 80;

    return {
      score,
      totalQuestions,
      correctAnswers,
      passed,
      details,
    };
  }

  async getLessonStatus(
    userId: string,
    lessonId: string,
  ): Promise<{
    videoWatched: boolean;
    quizCompleted: boolean;
    quizScore?: number;
    canAccessQuiz: boolean;
    isCompleted: boolean;
  }> {
    const progress = await this.lessonProgressService.findByUserAndLesson(
      userId,
      lessonId,
    );

    return {
      videoWatched: progress?.videoWatched || false,
      quizCompleted: progress?.quizCompleted || false,
      quizScore: progress?.quizScore,
      canAccessQuiz: progress?.videoWatched || false,
      isCompleted: progress?.progressPercent === 100,
    };
  }
}
