import { Module } from '@nestjs/common';
import { SequentialLearningController } from './sequential-learning.controller';
import { SequentialLearningService } from './sequential-learning.service';
import { LessonProgressModule } from '../lesson-progress/lesson-progress.module';
import { QuizAttemptModule } from '../quiz-attempts/quiz-attempt.module';
import { LessonModule } from '../lessons/lesson.module';
import { QuestionModule } from '../questions/question.module';
import { ChapterModule } from '../chapters/chapter.module';

@Module({
  imports: [
    LessonProgressModule,
    QuizAttemptModule,
    LessonModule,
    QuestionModule,
    ChapterModule,
  ],
  controllers: [SequentialLearningController],
  providers: [SequentialLearningService],
  exports: [SequentialLearningService],
})
export class SequentialLearningModule {}
