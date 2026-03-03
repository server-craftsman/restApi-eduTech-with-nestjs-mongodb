import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, GradeLevel } from '../../enums';

export class SignUpDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'Str0ngP@ss' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Johnson' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.Student,
    description: 'STUDENT (default) | PARENT | TEACHER',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    enum: GradeLevel,
    description: 'Required when role = STUDENT',
    example: GradeLevel.Grade10,
  })
  @IsOptional()
  @IsEnum(GradeLevel)
  gradeLevel?: GradeLevel;

  @ApiPropertyOptional({
    description: 'Phone number – required when role = PARENT',
    example: '+84912345678',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
