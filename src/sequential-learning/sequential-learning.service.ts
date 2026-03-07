import { Injectable, BadRequestException } from '@nestjs/common';
import { LessonProgressService } from '../lesson-progress/lesson-progress.service';
import { QuizAttemptService } from '../quiz-attempts/quiz-attempt.service';
import { LessonService } from '../lessons/lesson.service';
import { QuestionService } from '../questions/question.service';

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
    private readonly questionService: QuestionService,
  ) {}

  /**
   * Track video watching progress for a lesson
   */
  async trackVideoProgress(
    userId: string,
    trackingData: VideoTrackingDto,
  ): Promise<void> {
    const { lessonId, currentTime, duration, completed } = trackingData;

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

  /**
   * Check if user has watched the video and can access the quiz
   */
  async canAccessQuiz(userId: string, lessonId: string): Promise<boolean> {
    const progress = await this.lessonProgressService.findByUserAndLesson(
      userId,
      lessonId,
    );
    return progress?.videoWatched || false;
  }

  /**
   * Submit quiz answers for a lesson.
   * Grading is handled server-side by QuizAttemptService.
   */
  async submitQuiz(
    userId: string,
    quizData: QuizSubmissionDto,
  ): Promise<QuizResult> {
    const { lessonId, answers } = quizData;

    // Check if user has watched the video first
    const canAccess = await this.canAccessQuiz(userId, lessonId);
    if (!canAccess) {
      throw new BadRequestException(
        'You must watch the video before taking the quiz',
      );
    }

    // Verify the lesson exists
    const lesson = await this.lessonService.findById(lessonId);
    if (!lesson) {
      throw new BadRequestException('Lesson not found');
    }

    // Verify the lesson has questions
    const questions = await this.questionService.findByLessonId(lessonId);
    if (!questions || questions.length === 0) {
      throw new BadRequestException('This lesson has no quiz questions');
    }

    // Submit the attempt — QuizAttemptService handles server-side grading
    const attempt = await this.quizAttemptService.submitAttempt(userId, {
      lessonId,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
      })),
      totalTimeSpentMs: 0,
    });

    // Build a QuizResult from the graded attempt
    const passed = attempt.score >= 80;

    // Build detail mappings from the graded attempt answers
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const details = attempt.answers.map((a) => {
      const question = questionMap.get(a.questionId);
      const selected = Array.isArray(a.selectedAnswer)
        ? a.selectedAnswer.join(', ')
        : a.selectedAnswer;
      return {
        questionId: a.questionId,
        correct: a.isCorrect,
        selectedAnswer: selected,
        correctAnswer: question?.correctAnswer ?? '',
      };
    });

    // Update lesson progress if the quiz is passed
    if (passed) {
      await this.lessonProgressService.updateProgressByUserAndLesson(
        userId,
        lessonId,
        {
          quizCompleted: true,
          quizScore: attempt.score,
          progressPercent: 100,
        },
      );
    }

    return {
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      passed,
      details,
    };
  }

  /**
   * Get comprehensive lesson status including video and quiz progress
   */
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
