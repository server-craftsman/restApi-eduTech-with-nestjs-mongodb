import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChapterModule } from '../chapters/chapter.module';
import { DocumentPersistenceModule as CourseDocumentPersistenceModule } from '../courses/infrastructure/persistence/document/document-persistence.module';
import {
  LessonDocument,
  LessonSchema,
} from './infrastructure/persistence/document/schemas/lesson.schema';
import { LessonRepository } from './infrastructure/persistence/document/repositories/lesson.repository';
import { LessonRepositoryAbstract } from './infrastructure/persistence/document/repositories/lesson.repository.abstract';
import { LessonMapper } from './infrastructure/persistence/document/mappers/lesson.mapper';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';

@Module({
  imports: [
    ChapterModule,
    CourseDocumentPersistenceModule,
    MongooseModule.forFeature([
      { name: LessonDocument.name, schema: LessonSchema },
    ]),
  ],
  controllers: [LessonController],
  providers: [
    LessonService,
    {
      provide: LessonRepositoryAbstract,
      useClass: LessonRepository,
    },
    LessonMapper,
  ],
  exports: [LessonService, LessonRepositoryAbstract],
})
export class LessonModule {}
