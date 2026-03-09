import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { BaseService } from '../core/base/base.service';
import { ExamRepositoryAbstract } from './infrastructure/persistence/document/repositories/exam.repository.abstract';
import { ExamAttemptRepositoryAbstract } from './infrastructure/persistence/document/repositories/exam-attempt.repository.abstract';
import { QuestionRepositoryAbstract } from '../questions/infrastructure/persistence/document/repositories/question.repository.abstract';
import { CourseRepositoryAbstract } from '../courses/infrastructure/persistence/document/repositories/course.repository.abstract';
import { ChapterRepositoryAbstract } from '../chapters/infrastructure/persistence/document/repositories/chapter.repository.abstract';
import { Exam } from './domain/exam';
import { ExamAttempt, ExamQuestionAnswer } from './domain/exam-attempt';
import { Question } from '../questions/domain/question';
import { Difficulty, ExamScope, QuestionType } from '../enums';
import {
  CreateExamDto,
  UpdateExamDto,
  SubmitExamDto,
  QueryExamDto,
  StartExamResponseDto,
  QuestionForExamDto,
  ExamResultDto,
  ExamAnswerDetailDto,
  ExamAttemptSummaryDto,
} from './dto';

@Injectable()
export class ExamService extends BaseService {
  constructor(
    private readonly examRepository: ExamRepositoryAbstract,
    private readonly examAttemptRepository: ExamAttemptRepositoryAbstract,
    private readonly questionRepository: QuestionRepositoryAbstract,
    private readonly courseRepository: CourseRepositoryAbstract,
    private readonly chapterRepository: ChapterRepositoryAbstract,
  ) {
    super();
  }

  // ─────────────────────────────────────────────────────────────
  // EXAM CRUD (Teacher / Admin)
  // ─────────────────────────────────────────────────────────────

  /**
   * Create a new exam.
   *
   * Validates:
   * 1. At least one questionId provided
   * 2. All questionIds exist
   * 3. courseId references an existing, non-deleted Course
   * 4. When scope = 'chapter': chapterId is required and must belong to courseId
   *
   * @param dto    - Exam creation payload
   * @param userId - Teacher / Admin userId (from JWT)
   */
  async createExam(dto: CreateExamDto, userId: string): Promise<Exam> {
    if (!dto.questionIds.length) {
      throw new BadRequestException('An exam must have at least one question.');
    }

    // ── Validate courseId ─────────────────────────────────────────────────────
    const course = await this.courseRepository.findByIdNotDeleted(dto.courseId);
    if (!course) {
      throw new BadRequestException(
        `Course with id "${dto.courseId}" not found.`,
      );
    }

    // ── Validate chapterId when scope = 'chapter' ────────────────────────────
    if (dto.scope === ExamScope.Chapter) {
      if (!dto.chapterId) {
        throw new BadRequestException(
          'chapterId is required when scope is "chapter".',
        );
      }
      const chapter = await this.chapterRepository.findById(dto.chapterId);
      if (!chapter) {
        throw new BadRequestException(
          `Chapter with id "${dto.chapterId}" not found.`,
        );
      }
      if (chapter.courseId !== dto.courseId) {
        throw new BadRequestException(
          `Chapter "${dto.chapterId}" does not belong to course "${dto.courseId}".`,
        );
      }
    }

    // ── Verify all question IDs exist ───────────────────────────────────────
    const questions = await this.questionRepository.findByIds(dto.questionIds);
    if (questions.length !== dto.questionIds.length) {
      const foundIds = new Set(questions.map((q) => q.id));
      const missing = dto.questionIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `The following question IDs were not found: ${missing.join(', ')}`,
      );
    }

    return this.examRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      scope: dto.scope,
      courseId: dto.courseId,
      chapterId:
        dto.scope === ExamScope.Chapter ? (dto.chapterId ?? null) : null,
      questionIds: dto.questionIds,
      totalQuestions: dto.questionIds.length,
      timeLimitSeconds: dto.timeLimitSeconds,
      passingScore: dto.passingScore ?? 50,
      isPublished: dto.isPublished ?? false,
      createdBy: userId,
    });
  }

  /**
   * Update an existing exam.
   * @param id     - Exam ID
   * @param dto    - Partial update payload
   * @param userId - Teacher / Admin userId (used to check ownership if needed)
   */
  async updateExam(id: string, dto: UpdateExamDto): Promise<Exam> {
    const exam = await this.examRepository.findById(id);
    if (!exam) throw new NotFoundException(`Exam ${id} not found.`);

    const updateData: Partial<Exam> = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.timeLimitSeconds !== undefined)
      updateData.timeLimitSeconds = dto.timeLimitSeconds;
    if (dto.passingScore !== undefined)
      updateData.passingScore = dto.passingScore;
    if (dto.isPublished !== undefined) updateData.isPublished = dto.isPublished;

    // If questionIds are updated, validate them all
    if (dto.questionIds !== undefined) {
      if (!dto.questionIds.length) {
        throw new BadRequestException(
          'An exam must have at least one question.',
        );
      }
      const questions = await this.questionRepository.findByIds(
        dto.questionIds,
      );
      if (questions.length !== dto.questionIds.length) {
        const foundIds = new Set(questions.map((q) => q.id));
        const missing = dto.questionIds.filter((qid) => !foundIds.has(qid));
        throw new BadRequestException(
          `The following question IDs were not found: ${missing.join(', ')}`,
        );
      }
      updateData.questionIds = dto.questionIds;
      updateData.totalQuestions = dto.questionIds.length;
    }

    const updated = await this.examRepository.update(id, updateData);
    if (!updated) throw new NotFoundException(`Exam ${id} not found.`);
    return updated;
  }

  /**
   * Soft-delete an exam.
   */
  async deleteExam(id: string): Promise<void> {
    const exam = await this.examRepository.findById(id);
    if (!exam) throw new NotFoundException(`Exam ${id} not found.`);
    await this.examRepository.softDelete(id);
  }

  /**
   * Get a single exam by ID (full metadata, no question answers).
   */
  async getExamById(id: string): Promise<Exam> {
    const exam = await this.examRepository.findById(id);
    if (!exam) throw new NotFoundException(`Exam ${id} not found.`);
    return exam;
  }

  /**
   * List exams — paginated, filterable, sortable.
   */
  async listExams(
    query: QueryExamDto,
  ): Promise<{ items: Exam[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const [items, total] = await this.examRepository.findAllWithFilters(
      limit,
      offset,
      query.filters ?? undefined,
      query.sort ?? undefined,
    );

    return { items, total, page, limit };
  }

  // ─────────────────────────────────────────────────────────────
  // EXAM FLOW — Student actions
  // ─────────────────────────────────────────────────────────────

  /**
   * Start an exam: returns exam metadata and sanitised questions
   * (correctAnswer and explanation are deliberately omitted).
   *
   * @param examId - The exam to start
   */
  async startExam(examId: string): Promise<StartExamResponseDto> {
    const exam = await this.examRepository.findById(examId);
    if (!exam) throw new NotFoundException(`Exam ${examId} not found.`);
    if (!exam.isPublished)
      throw new ForbiddenException('This exam is not published yet.');

    // Fetch questions in the order defined by exam.questionIds
    const questions = await this.questionRepository.findByIds(exam.questionIds);

    // Re-order to match exam.questionIds order and strip sensitive fields
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const sanitised: QuestionForExamDto[] = exam.questionIds
      .map((qid) => {
        const q = questionMap.get(qid);
        if (!q) return null;
        return this.sanitiseQuestion(q);
      })
      .filter((q): q is QuestionForExamDto => q !== null);

    return {
      examId: exam.id,
      title: exam.title,
      description: exam.description,
      scope: exam.scope,
      courseId: exam.courseId,
      chapterId: exam.chapterId ?? null,
      timeLimitSeconds: exam.timeLimitSeconds,
      totalQuestions: sanitised.length,
      passingScore: exam.passingScore,
      questions: sanitised,
    };
  }

  /**
   * Submit exam answers — performs server-side grading immediately.
   *
   * @param examId  - Exam being submitted
   * @param dto     - Student answers + time spent
   * @param userId  - Student userId (from JWT)
   */
  async submitExam(
    examId: string,
    dto: SubmitExamDto,
    userId: string,
  ): Promise<ExamResultDto> {
    const exam = await this.examRepository.findById(examId);
    if (!exam) throw new NotFoundException(`Exam ${examId} not found.`);
    if (!exam.isPublished)
      throw new ForbiddenException('This exam is not published yet.');

    if (!dto.answers.length) {
      throw new BadRequestException('You must submit at least one answer.');
    }

    // Fetch all questions in a single query
    const questions = await this.questionRepository.findByIds(exam.questionIds);
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const now = new Date();
    let correctCount = 0;
    const gradedAnswers: ExamQuestionAnswer[] = [];
    const details: ExamAnswerDetailDto[] = [];

    for (const submitted of dto.answers) {
      const question = questionMap.get(submitted.questionId);
      if (!question) continue; // skip unknown question IDs silently

      const isCorrect = this.checkAnswer(question, submitted.selectedAnswer);
      if (isCorrect) correctCount++;

      gradedAnswers.push({
        questionId: submitted.questionId,
        selectedAnswer: submitted.selectedAnswer,
        isCorrect,
        timeSpentMs: submitted.timeSpentMs,
      });

      details.push({
        questionId: question.id,
        contentHtml: question.contentHtml,
        type: question.type,
        difficulty: question.difficulty,
        options: question.options,
        selectedAnswer: submitted.selectedAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        isCorrect,
        timeSpentMs: submitted.timeSpentMs,
        points: question.points ?? 10,
        pointsEarned: isCorrect ? (question.points ?? 10) : 0,
      });
    }

    const totalQuestions = exam.questionIds.length;
    const score =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;
    const passed = score >= exam.passingScore;

    // Persist the attempt
    const attempt = await this.examAttemptRepository.create({
      userId,
      examId: exam.id,
      answers: gradedAnswers,
      score,
      totalQuestions,
      correctAnswers: correctCount,
      totalTimeSpentMs: dto.totalTimeSpentMs,
      passed,
      status: 'graded',
      submittedAt: now,
      gradedAt: now,
      isDeleted: false,
    });

    return {
      attemptId: attempt.id,
      examId: exam.id,
      examTitle: exam.title,
      scope: exam.scope,
      courseId: exam.courseId,
      chapterId: exam.chapterId ?? null,
      userId,
      score,
      totalQuestions,
      correctAnswers: correctCount,
      passingScore: exam.passingScore,
      passed,
      totalTimeSpentMs: dto.totalTimeSpentMs,
      details,
      submittedAt: now,
    };
  }

  /**
   * Retrieve the detailed result for a specific attempt (Student or Admin).
   * If `requestingUserId` is provided, ownership is enforced.
   *
   * @param attemptId        - The attempt to retrieve
   * @param requestingUserId - If set, must match attempt.userId (student ownership)
   */
  async getAttemptResult(
    attemptId: string,
    requestingUserId?: string,
  ): Promise<ExamResultDto> {
    const attempt = await this.examAttemptRepository.findById(attemptId);
    if (!attempt)
      throw new NotFoundException(`Attempt ${attemptId} not found.`);

    if (requestingUserId && attempt.userId !== requestingUserId) {
      throw new ForbiddenException(
        'You do not have permission to view this result.',
      );
    }

    const exam = await this.examRepository.findById(attempt.examId);
    if (!exam) throw new NotFoundException(`Exam ${attempt.examId} not found.`);

    const questions = await this.questionRepository.findByIds(exam.questionIds);
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const details: ExamAnswerDetailDto[] = attempt.answers.map((a) => {
      const question = questionMap.get(a.questionId);
      return {
        questionId: a.questionId,
        contentHtml: question?.contentHtml ?? '',
        type: question?.type ?? QuestionType.MultipleChoice,
        difficulty: question?.difficulty ?? Difficulty.Medium,
        options: question?.options ?? [],
        selectedAnswer: a.selectedAnswer,
        correctAnswer: question?.correctAnswer ?? '',
        explanation: question?.explanation ?? '',
        isCorrect: a.isCorrect,
        timeSpentMs: a.timeSpentMs,
        points: question?.points ?? 10,
        pointsEarned: a.isCorrect ? (question?.points ?? 10) : 0,
      };
    });

    return {
      attemptId: attempt.id,
      examId: exam.id,
      examTitle: exam.title,
      scope: exam.scope,
      courseId: exam.courseId,
      chapterId: exam.chapterId ?? null,
      userId: attempt.userId,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      passingScore: exam.passingScore,
      passed: attempt.passed,
      totalTimeSpentMs: attempt.totalTimeSpentMs,
      details,
      submittedAt: attempt.submittedAt,
    };
  }

  /**
   * List all attempts a student has made for a specific exam.
   */
  async getMyAttemptsForExam(
    userId: string,
    examId: string,
  ): Promise<ExamAttemptSummaryDto[]> {
    const exam = await this.examRepository.findById(examId);
    if (!exam) throw new NotFoundException(`Exam ${examId} not found.`);

    const attempts = await this.examAttemptRepository.findByUserAndExam(
      userId,
      examId,
    );
    return attempts.map((a) => this.toSummaryDto(a, exam));
  }

  /**
   * List ALL attempts for an exam (Admin / Teacher view).
   */
  async getExamAttempts(examId: string): Promise<ExamAttemptSummaryDto[]> {
    const exam = await this.examRepository.findById(examId);
    if (!exam) throw new NotFoundException(`Exam ${examId} not found.`);

    const attempts = await this.examAttemptRepository.findByExamId(examId);
    return attempts.map((a) => this.toSummaryDto(a, exam));
  }

  // ─────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────

  /**
   * Strip correctAnswer and explanation from a Question for the exam session.
   */
  private sanitiseQuestion(q: Question): QuestionForExamDto {
    return {
      id: q.id,
      contentHtml: q.contentHtml,
      type: q.type,
      difficulty: q.difficulty,
      options: q.options,
      points: q.points,
    };
  }

  /**
   * Grade a single answer against the correct answer.
   * Mirrors the logic in QuizAttemptService.checkAnswer.
   */
  private checkAnswer(
    question: Question,
    selectedAnswer: string | string[],
  ): boolean {
    const selected = Array.isArray(selectedAnswer)
      ? selectedAnswer[0]
      : selectedAnswer;

    if (!selected) return false;

    const selectedTrimmed = selected.trim().toLowerCase();
    const correctTrimmed = question.correctAnswer.trim().toLowerCase();

    switch (question.type) {
      case QuestionType.FillInBlank:
        return selectedTrimmed === correctTrimmed;
      case QuestionType.MultipleChoice:
      case QuestionType.TrueFalse:
      default:
        return selectedTrimmed === correctTrimmed;
    }
  }

  /**
   * Convert an ExamAttempt domain object to a summary DTO.
   * Pass the related `exam` so context fields (scope, courseId, chapterId, title) are included.
   */
  private toSummaryDto(a: ExamAttempt, exam: Exam): ExamAttemptSummaryDto {
    return {
      attemptId: a.id,
      examId: a.examId,
      examTitle: exam.title,
      scope: exam.scope,
      courseId: exam.courseId,
      chapterId: exam.chapterId ?? null,
      userId: a.userId,
      score: a.score,
      totalQuestions: a.totalQuestions,
      correctAnswers: a.correctAnswers,
      passed: a.passed,
      totalTimeSpentMs: a.totalTimeSpentMs,
      status: a.status,
      submittedAt: a.submittedAt,
      createdAt: a.createdAt,
    };
  }
}
