import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddWordlistItemDto {
  @ApiProperty({
    example: '0b9d4e77-07d6-4b1d-9bbf-61efc5cb57ef',
    description: 'Vocabulary ID to add to the wordlist',
  })
  @IsUUID()
  vocabularyId!: string;
}
