import { Module } from '@nestjs/common';
import { LessonModule } from '../lessons/lesson.module';
import { MaterialModule } from '../materials/material.module';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [
    LessonModule, // provides LessonRepositoryAbstract
    MaterialModule, // provides MaterialRepositoryAbstract
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
