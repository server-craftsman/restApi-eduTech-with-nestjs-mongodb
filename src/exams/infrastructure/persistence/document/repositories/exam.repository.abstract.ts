import { Exam } from '../../../../domain/exam';
import { FilterExamDto, SortExamDto } from '../../../../dto/query-exam.dto';

export abstract class ExamRepositoryAbstract {
  abstract findById(id: string): Promise<Exam | null>;
  abstract findAllWithFilters(
    limit: number,
    offset: number,
    filters?: FilterExamDto,
    sort?: SortExamDto[],
  ): Promise<[Exam[], number]>;
  abstract create(data: Partial<Exam>): Promise<Exam>;
  abstract update(id: string, data: Partial<Exam>): Promise<Exam | null>;
  abstract softDelete(id: string): Promise<void>;
}
