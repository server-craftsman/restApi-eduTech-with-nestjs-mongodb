import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WrongAnswerRepositoryAbstract } from './infrastructure/persistence/document/repositories/wrong-answer.repository.abstract';
import { QuestionRepositoryAbstract } from '../questions/infrastructure/persistence/document/repositories/question.repository.abstract';
import { WrongAnswer } from './domain/wrong-answer';
import {
  PracticeSubmitDto,
  PracticeResultDto,
  PracticeResultItemDto,
  WrongAnswerWithQuestionDto,
  WrongAnswerStatsDto,
} from './dto';
import { Question } from '../questions/domain/question';
import { QuestionAnswer } from '../quiz-attempts/domain/quiz-attempt';
import { QuestionType } from '../enums';

@Injectable()
export class WrongAnswerService {
  constructor(
    private readonly wrongAnswerRepository: WrongAnswerRepositoryAbstract,
    private readonly questionRepository: QuestionRepositoryAbstract,
  ) {}

  // ══════════════════════════════════════════════════════════
  // Called by QuizAttemptService after every quiz submission
  // ══════════════════════════════════════════════════════════

  /**
   * Record wrong/correct answers from a graded quiz attempt.
   *
   * - Wrong answer  → upsert into wrong-answer bank (increment failCount)
   * - Correct answer → if previously in the bank, mark isMastered = true
   *
   * Runs in parallel for efficiency; errors are swallowed so a bank
   * write failure never breaks the quiz submission response.
   */
  async recordFromAttempt(
    userId: string,
    lessonId: string,
    gradedAnswers: QuestionAnswer[],
  ): Promise<void> {
    await Promise.all(
      gradedAnswers.map(async (answer) => {
        if (!answer.isCorrect) {
          await this.wrongAnswerRepository.upsertWrongAnswer(
            userId,
            answer.questionId,
            lessonId,
          );
        } else {
          // Correct in the regular quiz → auto-master it in the bank
          await this.wrongAnswerRepository.markMastered(
            userId,
            answer.questionId,
          );
        }
      }),
    );
  }

  // ══════════════════════════════════════════════════════════
  // Bank queries
  // ══════════════════════════════════════════════════════════

  /**
   * Get a user's full wrong-answer bank, enriched with Question objects.
   *
   * @param userId  - Student user ID (from JWT)
   * @param isMastered - undefined = all, false = unresolved only, true = mastered only
   */
  async getMyBank(
    userId: string,
    isMastered?: boolean,
  ): Promise<WrongAnswerWithQuestionDto[]> {
    const records = await this.wrongAnswerRepository.findByUserId(
      userId,
      isMastered,
    );
    return this.enrichWithQuestions(records);
  }

  /**
   * Get wrong answers for a specific lesson, enriched with Question objects.
   */
  async getBankByLesson(
    userId: string,
    lessonId: string,
    isMastered?: boolean,
  ): Promise<WrongAnswerWithQuestionDto[]> {
    const records = await this.wrongAnswerRepository.findByUserIdAndLessonId(
      userId,
      lessonId,
      isMastered,
    );
    return this.enrichWithQuestions(records);
  }

  /**
   * Aggregate stats for a user's bank.
   */
  async getStats(userId: string): Promise<WrongAnswerStatsDto> {
    const raw = await this.wrongAnswerRepository.getStats(userId);
    const masteryRate =
      raw.total > 0 ? Math.round((raw.mastered / raw.total) * 100) : 0;
    return { ...raw, masteryRate };
  }

  // ══════════════════════════════════════════════════════════
  // Practice session
  // ══════════════════════════════════════════════════════════

  /**
   * Grade a practice submission.
   *
   * For each answer:
   *  - Correct  → mark isMastered = true in the bank
   *  - Wrong    → increment failCount (upsert)
   *
   * Returns per-question results + session summary.
   */
  async submitPractice(
    userId: string,
    dto: PracticeSubmitDto,
  ): Promise<PracticeResultDto> {
    if (!dto.answers?.length) {
      throw new BadRequestException('At least one answer is required');
    }

    // Fetch each question by ID (sequential queries; acceptable for a small batch)
    const questions = await Promise.all(
      dto.answers.map((a) => this.questionRepository.findById(a.questionId)),
    );

    let correctCount = 0;
    let masteredCount = 0;
    let remainingWrong = 0;

    const results: PracticeResultItemDto[] = await Promise.all(
      dto.answers.map(async (answer, idx) => {
        const question = questions[idx];
        if (!question) {
          throw new NotFoundException(
            `Question ${answer.questionId} not found`,
          );
        }

        const isCorrect = this.checkAnswer(question, answer.selectedAnswer);

        if (isCorrect) {
          correctCount++;
          const mastered = await this.wrongAnswerRepository.markMastered(
            userId,
            answer.questionId,
          );
          if (mastered) masteredCount++;
        } else {
          remainingWrong++;
          await this.wrongAnswerRepository.upsertWrongAnswer(
            userId,
            answer.questionId,
            question.lessonId,
          );
        }

        return {
          questionId: answer.questionId,
          isCorrect,
          isMastered: isCorrect,
          correctAnswer: question.correctAnswer,
          selectedAnswer: answer.selectedAnswer,
          explanation: question.explanation,
        };
      }),
    );

    return {
      results,
      totalAnswered: dto.answers.length,
      correctCount,
      masteredCount,
      remainingWrong,
    };
  }

  // ══════════════════════════════════════════════════════════
  // Admin helpers
  // ══════════════════════════════════════════════════════════

  async getBankForUser(
    userId: string,
    isMastered?: boolean,
  ): Promise<WrongAnswerWithQuestionDto[]> {
    return this.getMyBank(userId, isMastered);
  }

  /**
   * Admin — soft-delete a wrong-answer record by its ID.
   */
  async softDeleteRecord(id: string): Promise<void> {
    await this.wrongAnswerRepository.softDelete(id);
  }

  // ══════════════════════════════════════════════════════════
  // Private helpers
  // ══════════════════════════════════════════════════════════

  /**
   * Enrich WrongAnswer records with their Question objects.
   * Questions that cannot be found are silently filtered out.
   */
  private async enrichWithQuestions(
    records: WrongAnswer[],
  ): Promise<WrongAnswerWithQuestionDto[]> {
    const questions = await Promise.all(
      records.map((r) => this.questionRepository.findById(r.questionId)),
    );

    const enriched: WrongAnswerWithQuestionDto[] = [];
    for (let i = 0; i < records.length; i++) {
      const question = questions[i];
      if (!question) continue; // skip orphaned records
      enriched.push({ ...records[i], question });
    }
    return enriched;
  }

  /**
   * Grade a single answer against the stored correct answer.
   * Matches the same logic used in QuizAttemptService.
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
}
