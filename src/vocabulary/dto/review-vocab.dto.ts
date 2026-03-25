import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum ReviewResult {
  HARD = 'HARD',
  MEDIUM = 'MEDIUM',
  EASY = 'EASY',
}

export class ReviewVocabDto {
  @ApiProperty({
    enum: ReviewResult,
    example: ReviewResult.MEDIUM,
    description:
      'HARD: +1 day; MEDIUM: +3 days, +1 correct; EASY: +5–7 days, +1 correct',
  })
  @IsEnum(ReviewResult)
  result!: ReviewResult;
}
