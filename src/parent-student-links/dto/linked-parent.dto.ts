import { ApiProperty } from '@nestjs/swagger';

/** Parent profile data returned in student → my-parents endpoint */
export class LinkedParentDto {
  @ApiProperty({
    description: 'Parent-student link record ID',
    example: '507f1f77bcf86cd799439011',
  })
  linkId!: string;

  @ApiProperty({
    description: 'Parent profile ID',
    example: '507f1f77bcf86cd799439013',
  })
  parentProfileId!: string;

  @ApiProperty({ description: "Parent's full name", example: 'Nguyen Thi B' })
  fullName!: string;

  @ApiProperty({
    description: "Parent's phone number",
    example: '+84901234567',
  })
  phoneNumber!: string;

  @ApiProperty({
    description: 'Link creation date',
    example: '2025-01-01T00:00:00.000Z',
  })
  linkedAt!: Date;
}
