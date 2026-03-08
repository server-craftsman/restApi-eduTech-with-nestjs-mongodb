import { Question } from '../../../../domain/question';
import { Difficulty } from '../../../../../enums';

export abstract class QuestionRepositoryAbstract {
  abstract findById(id: string): Promise<Question | null>;
  abstract findByIds(ids: string[]): Promise<Question[]>;
  abstract findAll(): Promise<Question[]>;
  abstract create(
    data: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Question>;
  abstract update(
    id: string,
    data: Partial<Question>,
  ): Promise<Question | null>;
  abstract softDelete(id: string): Promise<void>;
  abstract findByLessonId(lessonId: string): Promise<Question[]>;
  abstract findByDifficulty(difficulty: Difficulty): Promise<Question[]>;
  abstract findByTag(tag: string): Promise<Question[]>;
  abstract getRandomQuestion(limit?: number): Promise<Question[]>;
}
