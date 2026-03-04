import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DocumentUserPersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { TeacherProfileModule } from '../teacher-profiles/teacher-profile.module';
import { ParentProfileModule } from '../parent-profiles/parent-profile.module';

@Module({
  imports: [
    DocumentUserPersistenceModule,
    TeacherProfileModule,
    ParentProfileModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
