import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { GradeLevel } from '../../enums';

export class UpdateStudentProfileDto {
  @ApiPropertyOptional({
    description: 'Student full name',
    example: 'Alice Smith',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Student gender',
    example: 'female',
  })
  @IsString()
  @IsOptional()
  gender?: string | null;

  @ApiPropertyOptional({
    description: 'Student date of birth',
    example: '2010-06-20',
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: Date | null;

  @ApiPropertyOptional({
    description: 'School name',
    example: 'Washington Elementary School',
  })
  @IsString()
  @IsOptional()
  schoolName?: string | null;

  @ApiPropertyOptional({
    description: 'Grade level',
    enum: GradeLevel,
    enumName: 'GradeLevel',
  })
  @IsEnum(GradeLevel)
  @IsOptional()
  gradeLevel?: GradeLevel | null;

  // @ApiPropertyOptional({
  //   description: 'Diamond balance',
  //   example: 100,
  // })
  // @IsInt()
  // @Min(0)
  // @IsOptional()
  // diamondBalance?: number;

  // @ApiPropertyOptional({
  //   description: 'Total experience points',
  //   example: 500,
  // })
  // @IsInt()
  // @Min(0)
  // @IsOptional()
  // xpTotal?: number;

  // @ApiPropertyOptional({
  //   description: 'Current streak count',
  //   example: 5,
  // })
  // @IsInt()
  // @Min(0)
  // @IsOptional()
  // currentStreak?: number;
}
