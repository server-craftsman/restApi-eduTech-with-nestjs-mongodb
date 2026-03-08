import { Controller } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { LessonProgressService } from './lesson-progress.service';
// import { CreateLessonProgressDto, UpdateLessonProgressDto } from './dto';

@ApiExcludeController()
@Controller('lesson-progress')
export class LessonProgressController {
  constructor(private readonly lessonProgressService: LessonProgressService) {}
  // ... rest of the code
}
