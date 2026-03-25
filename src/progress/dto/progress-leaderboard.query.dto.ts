import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

export class ProgressLeaderboardQueryDto {
  @ApiPropertyOptional({
    example: '2026-03-23',
    description: 'UTC date in YYYY-MM-DD (defaults to today)',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date?: string;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Max leaderboard rows (1-100)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
