import { Module } from '@nestjs/common';
import { LearningPathController } from './learning-path.controller';
import { LearningPathService } from './learning-path.service';
import { CourseModule } from '../courses/course.module';
import { LessonModule } from '../lessons/lesson.module';
import { LessonProgressModule } from '../lesson-progress/lesson-progress.module';
import { QuizAttemptModule } from '../quiz-attempts/quiz-attempt.module';
import { QuestionModule } from '../questions/question.module';

@Module({
  imports: [
    CourseModule,
    LessonModule,
    LessonProgressModule,
    QuizAttemptModule,
    QuestionModule,
  ],
  controllers: [LearningPathController],
  providers: [LearningPathService],
  exports: [LearningPathService],
})
export class LearningPathModule {}
