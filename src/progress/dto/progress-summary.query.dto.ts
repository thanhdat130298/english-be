import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class ProgressSummaryQueryDto {
  @ApiPropertyOptional({
    example: '2026-02-01',
    description: 'UTC date in YYYY-MM-DD (defaults to today)',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date?: string;
}
