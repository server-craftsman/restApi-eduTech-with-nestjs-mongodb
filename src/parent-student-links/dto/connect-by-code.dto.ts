import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

/** Payload a parent submits to connect to a student using the link code */
export class ConnectByCodeDto {
  @ApiProperty({
    description:
      '8-character uppercase alphanumeric link code shared by the student',
    example: 'A3BX7K2M',
  })
  @IsString()
  @Length(8, 8, { message: 'Link code must be exactly 8 characters' })
  @Matches(/^[A-Z0-9]{8}$/, {
    message: 'Link code must consist of uppercase letters and digits only',
  })
  code!: string;
}
