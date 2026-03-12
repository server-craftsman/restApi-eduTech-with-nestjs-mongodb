import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QuizAttemptRepositoryAbstract } from './infrastructure/persistence/document/repositories/quiz-attempt.repository.abstract';
import { QuestionRepositoryAbstract } from '../questions/infrastructure/persistence/document/repositories/question.repository.abstract';
import { LessonService } from '../lessons/lesson.service';
import { QuestionService } from '../questions/question.service';
import { WrongAnswerService } from '../wrong-answers/wrong-answer.service';
import { RewardService } from '../rewards/reward.service';
import { UsersService } from '../users/users.service';
import { NotificationTriggersService } from '../notifications/services';
import { QuizAttempt, QuestionAnswer } from './domain/quiz-attempt';
import {
  CreateQuizAttemptDto,
  UpdateQuizAttemptDto,
  QuizAttemptDetailDto,
  QuizAttemptAnswerDetailDto,
} from './dto';
import { Question } from '../questions/domain/question';
import { QuestionType } from '../enums';

@Injectable()
export class QuizAttemptService {
  constructor(
    private readonly quizAttemptRepository: QuizAttemptRepositoryAbstract,
    private readonly questionRepository: QuestionRepositoryAbstract,
    private readonly lessonService: LessonService,
    private readonly questionService: QuestionService,
    private readonly wrongAnswerService: WrongAnswerService,
    private readonly rewardService: RewardService,
    private readonly usersService: UsersService,
    private readonly notificationTriggers: NotificationTriggersService,
  ) {}

  /**
   * Submit a quiz attempt — grades server-side.
   * userId comes from JWT (passed by controller), NOT from request body.
   * score, correctAnswers, totalQuestions, isCorrect are all computed here.
   */
  async submitAttempt(
    userId: string,
    dto: CreateQuizAttemptDto,
  ): Promise<QuizAttempt> {
    if (!dto.answers || dto.answers.length === 0) {
      throw new BadRequestException('At least one answer is required');
    }

    // Fetch all questions for this lesson
    const questions = await this.questionRepository.findByLessonId(
      dto.lessonId,
    );
    if (questions.length === 0) {
      throw new NotFoundException(
        `No questions found for lesson ${dto.lessonId}`,
      );
    }

    // Build a lookup map: questionId → Question
    const questionMap = new Map<string, Question>();
    for (const q of questions) {
      questionMap.set(q.id, q);
    }

    // Grade each answer server-side
    let correctCount = 0;
    const gradedAnswers: QuestionAnswer[] = dto.answers.map((ans) => {
      const question = questionMap.get(ans.questionId);
      if (!question) {
        // Question not found — treat as incorrect
        return {
          questionId: ans.questionId,
          selectedAnswer: ans.selectedAnswer,
          isCorrect: false,
          timeSpentMs: ans.timeSpentMs,
        };
      }

      const isCorrect = this.checkAnswer(question, ans.selectedAnswer);
      if (isCorrect) correctCount++;

      return {
        questionId: ans.questionId,
        selectedAnswer: ans.selectedAnswer,
        isCorrect,
        timeSpentMs: ans.timeSpentMs,
      };
    });

    const totalQuestions = questions.length;
    const score =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    const attemptData: Omit<QuizAttempt, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      lessonId: dto.lessonId,
      answers: gradedAnswers,
      score,
      totalQuestions,
      correctAnswers: correctCount,
      totalTimeSpentMs: dto.totalTimeSpentMs,
      status: 'graded',
      submittedAt: new Date(),
      gradedAt: new Date(),
      isDeleted: false,
      deletedAt: null,
    };

    const saved = await this.quizAttemptRepository.create(attemptData);

    // Push wrong/correct answers to the wrong-answer bank (fire-and-forget)
    void this.pushToWrongAnswerBank(userId, dto.lessonId, gradedAnswers);

    // Award +50 points for a perfect score (fire-and-forget)
    if (score === 100) {
      void this.tryAwardPerfectQuiz(userId);
    }

    // Push quiz result notification (fire-and-forget)
    void this.tryPushQuizResultNotification(
      userId,
      dto.lessonId,
      saved.id,
      correctCount,
      totalQuestions,
    );

    return saved;
  }

  /**
   * After saving the attempt, asynchronously push wrong answers to the bank.
   * Errors are silently caught so the main quiz flow is never blocked.
   */
  private async pushToWrongAnswerBank(
    userId: string,
    lessonId: string,
    gradedAnswers: QuestionAnswer[],
  ): Promise<void> {
    try {
      await this.wrongAnswerService.recordFromAttempt(
        userId,
        lessonId,
        gradedAnswers,
      );
    } catch {
      // Bank update failure must never break the quiz submission
    }
  }

  /**
   * Award +50 reward points for a perfect quiz score.
   * Fire-and-forget — errors never block quiz submission.
   */
  private async tryAwardPerfectQuiz(userId: string): Promise<void> {
    try {
      await this.rewardService.awardPerfectQuiz(userId);
    } catch {
      // Reward failure must never break the quiz submission
    }
  }

  /**
   * Push quiz result notification after attempt is graded.
   * Fire-and-forget — failures never block submission.
   */
  private async tryPushQuizResultNotification(
    userId: string,
    lessonId: string,
    attemptId: string,
    correctAnswers: number,
    totalQuestions: number,
  ): Promise<void> {
    try {
      const [user, lesson] = await Promise.all([
        this.usersService.findById(userId),
        this.lessonService.getLessonById(lessonId),
      ]);

      if (!user?.email) return;

      await this.notificationTriggers.onQuizResult(
        user.id,
        user.email,
        lesson?.title ?? 'Bài kiểm tra',
        correctAnswers,
        totalQuestions,
        attemptId,
        user.email.split('@')[0],
      );
    } catch {
      // Notification failure must never break the quiz submission
    }
  }

  /**
   * Get attempt by ID
   */
  async getAttemptById(id: string): Promise<QuizAttempt | null> {
    if (!id) {
      throw new BadRequestException('Attempt ID is required');
    }
    return this.quizAttemptRepository.findById(id);
  }

  /**
   * Get all attempts (non-deleted)
   */
  async getAllAttempts(): Promise<QuizAttempt[]> {
    return this.quizAttemptRepository.findAll();
  }

  /**
   * Get user's quiz attempts
   */
  async getUserAttempts(userId: string): Promise<QuizAttempt[]> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.quizAttemptRepository.findByUserId(userId.trim());
  }

  /**
   * Get quiz attempts for a specific lesson
   */
  async getLessonAttempts(lessonId: string): Promise<QuizAttempt[]> {
    if (!lessonId) {
      throw new BadRequestException('Lesson ID is required');
    }
    return this.quizAttemptRepository.findByLessonId(lessonId.trim());
  }

  /**
   * Update attempt (ADMIN only)
   * Used for re-grading or correcting scores
   */
  async updateAttempt(
    id: string,
    dto: UpdateQuizAttemptDto,
  ): Promise<QuizAttempt> {
    const attempt = await this.getAttemptById(id);
    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${id} not found`);
    }

    if (dto.score !== undefined && (dto.score < 0 || dto.score > 100)) {
      throw new BadRequestException('Score must be between 0 and 100');
    }

    if (
      dto.correctAnswers !== undefined &&
      (dto.correctAnswers < 0 || dto.correctAnswers > attempt.totalQuestions)
    ) {
      throw new BadRequestException(
        `Correct answers cannot exceed ${attempt.totalQuestions} total questions`,
      );
    }

    const updateData: Partial<QuizAttempt> = {};
    if (dto.score !== undefined) updateData.score = dto.score;
    if (dto.correctAnswers !== undefined)
      updateData.correctAnswers = dto.correctAnswers;
    if (dto.status) updateData.status = dto.status;
    if (dto.status === 'graded') {
      updateData.gradedAt = new Date();
    }

    return this.quizAttemptRepository.update(id, updateData);
  }

  /**
   * Soft-delete an attempt
   */
  async deleteAttempt(id: string): Promise<void> {
    const attempt = await this.getAttemptById(id);
    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${id} not found`);
    }
    return this.quizAttemptRepository.softDelete(id);
  }

  /**
   * Get best attempt by user for a lesson
   */
  async getBestAttempt(
    userId: string,
    lessonId: string,
  ): Promise<QuizAttempt | null> {
    if (!userId || !lessonId) {
      throw new BadRequestException('User ID and Lesson ID are required');
    }
    return this.quizAttemptRepository.findBestAttemptByUserAndLesson(
      userId.trim(),
      lessonId.trim(),
    );
  }

  /**
   * Get lesson quiz statistics (aggregate data)
   */
  async getLessonStatistics(lessonId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  }> {
    if (!lessonId) {
      throw new BadRequestException('Lesson ID is required');
    }

    const attempts = await this.quizAttemptRepository.findByLessonId(
      lessonId.trim(),
    );

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
      };
    }

    const scores = attempts.map((a) => a.score);
    const passCount = attempts.filter((a) => a.score >= 60).length;

    return {
      totalAttempts: attempts.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b) / scores.length),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passRate: Math.round((passCount / attempts.length) * 100),
    };
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string): Promise<{
    totalAttempts: number;
    completedAttempts: number;
    averageScore: number;
    bestScore: number;
    totalTimeSpentMs: number;
  }> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const attempts = await this.quizAttemptRepository.findByUserId(
      userId.trim(),
    );

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        completedAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        totalTimeSpentMs: 0,
      };
    }

    const completedAttempts = attempts.filter((a) => a.status === 'graded');
    const scores = completedAttempts.map((a) => a.score);
    const totalTime = attempts.reduce((sum, a) => sum + a.totalTimeSpentMs, 0);

    return {
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      averageScore:
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b) / scores.length)
          : 0,
      bestScore: scores.length > 0 ? Math.max(...scores) : 0,
      totalTimeSpentMs: totalTime,
    };
  }

  /**
   * Check if user can retry lesson quiz
   */
  async canRetry(
    userId: string,
    lessonId: string,
    maxAttempts: number = 3,
  ): Promise<boolean> {
    if (!userId || !lessonId) {
      throw new BadRequestException('User ID and Lesson ID are required');
    }

    const attempts = await this.quizAttemptRepository.findByUserAndLesson(
      userId.trim(),
      lessonId.trim(),
    );

    return attempts.length < maxAttempts;
  }

  /**
   * Get attempt count for user in a lesson
   */
  async getAttemptCount(userId: string, lessonId: string): Promise<number> {
    if (!userId || !lessonId) {
      throw new BadRequestException('User ID and Lesson ID are required');
    }

    const attempts = await this.quizAttemptRepository.findByUserAndLesson(
      userId.trim(),
      lessonId.trim(),
    );

    return attempts.length;
  }

  /**
   * Check if attempt exists
   */
  async exists(id: string): Promise<boolean> {
    if (!id) {
      throw new BadRequestException('Attempt ID is required');
    }
    const attempt = await this.quizAttemptRepository.findById(id);
    return !!attempt;
  }

  /**
   * Check a single answer against the question's correct answer
   */
  private checkAnswer(
    question: Question,
    selectedAnswer: string | string[],
  ): boolean {
    // Handle array of answers (take first for comparison)
    const selected = Array.isArray(selectedAnswer)
      ? selectedAnswer[0]
      : selectedAnswer;

    if (!selected) return false;

    const selectedTrimmed = selected.trim();
    const correctTrimmed = question.correctAnswer.trim();

    switch (question.type) {
      case QuestionType.FillInBlank:
        // Case-insensitive, trimmed comparison for fill-in-blank
        return selectedTrimmed.toLowerCase() === correctTrimmed.toLowerCase();

      case QuestionType.MultipleChoice:
      case QuestionType.TrueFalse:
      default:
        // For multiple choice and true/false: case-insensitive trimmed match
        // This handles both exact matches and minor whitespace/case differences
        return selectedTrimmed.toLowerCase() === correctTrimmed.toLowerCase();
    }
  }

  /**
   * Enrich a single attempt with lesson and question details
   */
  async enrichAttemptWithDetails(
    attempt: QuizAttempt,
  ): Promise<QuizAttemptDetailDto> {
    // Fetch lesson and questions in parallel
    const [lesson, questions] = await Promise.all([
      this.lessonService.findById(attempt.lessonId),
      this.questionService.findByLessonId(attempt.lessonId),
    ]);

    if (!lesson) {
      throw new NotFoundException(
        `Lesson ${attempt.lessonId} not found for attempt ${attempt.id}`,
      );
    }

    // Build question map for lookup
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Enrich answers with question details
    const enrichedAnswers: QuizAttemptAnswerDetailDto[] = attempt.answers.map(
      (answer) => {
        const question = questionMap.get(answer.questionId);
        if (!question) {
          throw new NotFoundException(
            `Question ${answer.questionId} not found for attempt ${attempt.id}`,
          );
        }

        return {
          ...answer,
          question,
        };
      },
    );

    return {
      ...attempt,
      lesson,
      answers: enrichedAnswers,
    };
  }

  /**
   * Enrich multiple attempts with lesson and question details
   */
  async enrichAttemptsWithDetails(
    attempts: QuizAttempt[],
  ): Promise<QuizAttemptDetailDto[]> {
    return Promise.all(
      attempts.map((attempt) => this.enrichAttemptWithDetails(attempt)),
    );
  }
}
