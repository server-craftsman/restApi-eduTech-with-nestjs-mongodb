import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChapterDocument,
  ChapterSchema,
} from './infrastructure/persistence/document/schemas/chapter.schema';
import { ChapterRepository } from './infrastructure/persistence/document/repositories/chapter.repository';
import { ChapterRepositoryAbstract } from './infrastructure/persistence/document/repositories/chapter.repository.abstract';
import { ChapterMapper } from './infrastructure/persistence/document/mappers/chapter.mapper';
import { ChapterService } from './chapter.service';
import { ChapterController } from './chapter.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChapterDocument.name, schema: ChapterSchema },
    ]),
  ],
  controllers: [ChapterController],
  providers: [
    ChapterService,
    ChapterMapper,
    {
      provide: ChapterRepositoryAbstract,
      useClass: ChapterRepository,
    },
  ],
  exports: [ChapterService, ChapterRepositoryAbstract],
})
export class ChapterModule {}
