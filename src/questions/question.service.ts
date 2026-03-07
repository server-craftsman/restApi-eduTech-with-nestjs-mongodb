import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { QuestionRepositoryAbstract } from './infrastructure/persistence/document/repositories/question.repository.abstract';
import { Question } from './domain/question';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';
import { Difficulty, QuestionType } from '../enums';

/**
 * Service for managing questions
 * Handles question CRUD, filtering, and quiz operations
 */
@Injectable()
export class QuestionService {
  constructor(
    private readonly questionRepository: QuestionRepositoryAbstract,
  ) {}

  /**
   * Create a new question
   * @param dto - Question creation data
   * @returns Created question
   */
  async createQuestion(dto: CreateQuestionDto): Promise<Question> {
    if (dto.contentHtml.trim().length < 5) {
      throw new BadRequestException(
        'Content must be at least 5 characters long',
      );
    }

    this.validateQuestionData(dto.type, dto.options, dto.correctAnswer);

    const questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'> = {
      lessonId: dto.lessonId,
      contentHtml: dto.contentHtml.trim(),
      type: dto.type,
      difficulty: dto.difficulty,
      options: dto.options,
      correctAnswer: dto.correctAnswer,
      explanation: dto.explanation.trim(),
      tags: dto.tags,
      points: dto.points ?? 10,
      isDeleted: false,
      deletedAt: null,
    };

    return this.questionRepository.create(questionData);
  }

  /**
   * Get question by ID
   * @param id - Question ID
   * @returns Question or null
   */
  async getQuestionById(id: string): Promise<Question | null> {
    return this.questionRepository.findById(id);
  }

  /**
   * Get all non-deleted questions
   * @returns Array of questions
   */
  async getAllQuestions(): Promise<Question[]> {
    return this.questionRepository.findAll();
  }

  /**
   * Update question
   * @param id - Question ID
   * @param dto - Update data
   * @returns Updated question
   */
  async updateQuestion(id: string, dto: UpdateQuestionDto): Promise<Question> {
    const question = await this.questionRepository.findById(id);
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    // Validate constraints if updating answer-related fields
    if (dto.options !== undefined || dto.correctAnswer !== undefined) {
      const type = dto.type ?? question.type;
      const options = dto.options ?? question.options;
      const correctAnswer = dto.correctAnswer ?? question.correctAnswer;
      this.validateQuestionData(type, options, correctAnswer);
    }

    const updateData: Partial<Question> = {};
    if (dto.contentHtml !== undefined) updateData.contentHtml = dto.contentHtml;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.difficulty !== undefined) updateData.difficulty = dto.difficulty;
    if (dto.options !== undefined) updateData.options = dto.options;
    if (dto.correctAnswer !== undefined)
      updateData.correctAnswer = dto.correctAnswer;
    if (dto.explanation !== undefined) updateData.explanation = dto.explanation;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.points !== undefined) updateData.points = dto.points;

    const updated = await this.questionRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Failed to update question with ID ${id}`);
    }
    return updated;
  }

  /**
   * Soft-delete question
   * @param id - Question ID
   */
  async deleteQuestion(id: string): Promise<void> {
    const question = await this.questionRepository.findById(id);
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    await this.questionRepository.softDelete(id);
  }

  /**
   * Get questions by lesson
   * @param lessonId - Lesson ID
   * @returns Array of questions
   */
  async findByLessonId(lessonId: string): Promise<Question[]> {
    return this.questionRepository.findByLessonId(lessonId);
  }

  /**
   * Get questions by difficulty
   * @param difficulty - Difficulty level
   * @returns Array of questions
   */
  async findByDifficulty(difficulty: Difficulty): Promise<Question[]> {
    return this.questionRepository.findByDifficulty(difficulty);
  }

  /**
   * Get random questions
   * @param limit - Number of random questions to return
   * @returns Array of random questions
   */
  async getRandomQuestion(limit?: number): Promise<Question[]> {
    return this.questionRepository.getRandomQuestion(limit);
  }

  /**
   * Get questions by tag
   * @param tag - Tag to search for
   * @returns Array of questions with that tag
   */
  async findByTag(tag: string): Promise<Question[]> {
    return this.questionRepository.findByTag(tag);
  }

  /**
   * Get random questions by difficulty
   * @param difficulty - Difficulty level
   * @param limit - Number of questions to return
   * @returns Array of random questions
   */
  async getRandomByDifficulty(
    difficulty: Difficulty,
    limit: number = 5,
  ): Promise<Question[]> {
    const questions = await this.findByDifficulty(difficulty);
    return questions.sort(() => Math.random() - 0.5).slice(0, limit);
  }

  /**
   * Check if question exists
   * @param id - Question ID
   * @returns true if exists
   */
  async exists(id: string): Promise<boolean> {
    const question = await this.questionRepository.findById(id);
    return !!question;
  }

  /**
   * Validate question options and correct answer based on type
   */
  private validateQuestionData(
    type: QuestionType,
    options: string[],
    correctAnswer: string,
  ): void {
    switch (type) {
      case QuestionType.MultipleChoice:
        if (!options || options.length < 2) {
          throw new BadRequestException(
            'Multiple choice questions must have at least 2 options',
          );
        }
        if (!options.includes(correctAnswer)) {
          throw new BadRequestException(
            'Correct answer must be one of the provided options',
          );
        }
        break;

      case QuestionType.TrueFalse:
        if (
          !options ||
          options.length !== 2 ||
          !options.includes('True') ||
          !options.includes('False')
        ) {
          throw new BadRequestException(
            'True/False questions must have exactly ["True", "False"] options',
          );
        }
        if (correctAnswer !== 'True' && correctAnswer !== 'False') {
          throw new BadRequestException(
            'Correct answer must be "True" or "False"',
          );
        }
        break;

      case QuestionType.FillInBlank:
        // Fill-in-blank: options array can be empty; correctAnswer is the expected text
        if (!correctAnswer || correctAnswer.trim().length === 0) {
          throw new BadRequestException(
            'Fill-in-blank questions must have a non-empty correct answer',
          );
        }
        break;

      default:
        throw new BadRequestException(`Unknown question type: ${String(type)}`);
    }
  }
}
