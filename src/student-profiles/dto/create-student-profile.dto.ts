import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { BaseCreateDto } from '../../core/dto';
import { GradeLevel } from '../../enums';

export class CreateStudentProfileDto extends BaseCreateDto {
  @ApiProperty({
    description: 'User ID this profile belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Student full name',
    example: 'Alice Johnson',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiPropertyOptional({
    description: 'Student gender',
    example: 'female',
  })
  @IsString()
  @IsOptional()
  gender?: string | null;

  @ApiPropertyOptional({
    description: 'Student date of birth',
    example: '2010-05-15',
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: Date | null;

  @ApiPropertyOptional({
    description: 'School name',
    example: 'Lincoln Elementary School',
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

  @ApiProperty({
    description: 'Diamond balance',
    example: 0,
  })
  @IsInt()
  @Min(0)
  diamondBalance!: number;

  @ApiProperty({
    description: 'Total experience points',
    example: 0,
  })
  @IsInt()
  @Min(0)
  xpTotal!: number;

  @ApiProperty({
    description: 'Current streak count',
    example: 0,
  })
  @IsInt()
  @Min(0)
  currentStreak!: number;
}
