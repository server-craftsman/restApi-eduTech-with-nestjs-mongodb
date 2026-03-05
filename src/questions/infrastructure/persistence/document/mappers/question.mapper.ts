import { Injectable } from '@nestjs/common';
import { Question } from '../../../../domain/question';
import { QuestionDocumentType } from '../schemas/question.schema';
import { QuestionType, Difficulty } from '../../../../../enums';

@Injectable()
export class QuestionMapper {
  toDomain(doc: QuestionDocumentType): Question {
    return {
      id: doc._id.toString(),
      lessonId: doc.lessonId ? doc.lessonId.toString() : undefined,
      quizId: doc.quizId ? doc.quizId.toString() : undefined,
      contentHtml: doc.contentHtml,
      type: (doc.type as QuestionType) || QuestionType.MultipleChoice,
      difficulty: (doc.difficulty as Difficulty) || Difficulty.Medium,
      options: doc.options,
      correctAnswer: doc.correctAnswer,
      explanation: doc.explanation,
      tags: doc.tags,
      points: doc.points ?? 10,
      isDeleted: doc.isDeleted ?? false,
      deletedAt: doc.deletedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toDomainArray(docs: QuestionDocumentType[]): Question[] {
    return docs.map((doc) => this.toDomain(doc));
  }
}
