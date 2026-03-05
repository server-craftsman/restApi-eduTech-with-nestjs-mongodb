import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QuizAttemptRepositoryAbstract } from './infrastructure/persistence/document/repositories/quiz-attempt.repository.abstract';
import { QuizAttempt } from './domain/quiz-attempt';
import { CreateQuizAttemptDto, UpdateQuizAttemptDto } from './dto';

@Injectable()
export class QuizAttemptService {
  constructor(
    private readonly quizAttemptRepository: QuizAttemptRepositoryAbstract,
  ) {}

  /**
   * Submit a quiz attempt
   * Records student's quiz submission with answers and score
   */
  async submitAttempt(dto: CreateQuizAttemptDto): Promise<QuizAttempt> {
    if (!dto.quizId || !dto.userId) {
      throw new BadRequestException('Quiz ID and User ID are required');
    }

    if (!dto.answers || dto.answers.length === 0) {
      throw new BadRequestException('At least one answer is required');
    }

    if (dto.score < 0 || dto.score > 100) {
      throw new BadRequestException('Score must be between 0 and 100');
    }

    if (dto.correctAnswers < 0 || dto.correctAnswers > dto.totalQuestions) {
      throw new BadRequestException(
        'Correct answers cannot exceed total questions',
      );
    }

    const attemptData = {
      userId: dto.userId.trim(),
      quizId: dto.quizId.trim(),
      lessonId: dto.lessonId ? dto.lessonId.trim() : undefined,
      answers: dto.answers,
      score: dto.score,
      totalQuestions: dto.totalQuestions,
      correctAnswers: dto.correctAnswers,
      totalTimeSpentMs: dto.totalTimeSpentMs,
      status: 'graded' as const,
      submittedAt: new Date(),
      isDeleted: false,
      deletedAt: null,
    };

    return this.quizAttemptRepository.create(attemptData);
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
   * Get quiz attempts for a specific quiz
   */
  async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    if (!quizId) {
      throw new BadRequestException('Quiz ID is required');
    }
    return this.quizAttemptRepository.findByQuizId(quizId.trim());
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
   * Calculate score for quiz attempt
   * Compares submitted answers with correct answers
   */
  calculateScore(answers: Array<{ isCorrect: boolean }>): number {
    if (!answers || answers.length === 0) {
      return 0;
    }
    const correctCount = answers.filter((a) => a.isCorrect).length;
    return Math.round((correctCount / answers.length) * 100);
  }

  /**
   * Get best attempt by user for a quiz
   */
  async getBestAttempt(
    userId: string,
    quizId: string,
  ): Promise<QuizAttempt | null> {
    if (!userId || !quizId) {
      throw new BadRequestException('User ID and Quiz ID are required');
    }
    const attempts = await this.quizAttemptRepository.findByUserAndQuiz(
      userId.trim(),
      quizId.trim(),
    );

    if (!attempts || attempts.length === 0) {
      return null;
    }

    // Sort by score descending and return highest scoring attempt
    return attempts.reduce((best, current) =>
      current.score > best.score ? current : best,
    );
  }

  /**
   * Get quiz statistics (aggregate data)
   */
  async getQuizStatistics(quizId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  }> {
    if (!quizId) {
      throw new BadRequestException('Quiz ID is required');
    }

    const attempts = await this.quizAttemptRepository.findByQuizId(
      quizId.trim(),
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
   * Check if user can retry quiz
   */
  async canRetry(
    userId: string,
    quizId: string,
    maxAttempts: number = 3,
  ): Promise<boolean> {
    if (!userId || !quizId) {
      throw new BadRequestException('User ID and Quiz ID are required');
    }

    const attempts = await this.quizAttemptRepository.findByUserAndQuiz(
      userId.trim(),
      quizId.trim(),
    );

    return attempts.length < maxAttempts;
  }

  /**
   * Get attempt count for user in a quiz
   */
  async getAttemptCount(userId: string, quizId: string): Promise<number> {
    if (!userId || !quizId) {
      throw new BadRequestException('User ID and Quiz ID are required');
    }

    const attempts = await this.quizAttemptRepository.findByUserAndQuiz(
      userId.trim(),
      quizId.trim(),
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
   * Legacy method for backward compatibility
   */
  async recordAttempt(
    data: Omit<QuizAttempt, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<QuizAttempt> {
    return this.quizAttemptRepository.create(data);
  }

  /**
   * Legacy method for backward compatibility
   */
  async findByUserAndQuestion(
    userId: string,
    questionId: string,
  ): Promise<QuizAttempt[]> {
    if (!userId || !questionId) {
      throw new BadRequestException('User ID and Question ID are required');
    }
    return this.quizAttemptRepository.findByUserAndQuestion(
      userId.trim(),
      questionId.trim(),
    );
  }
}
