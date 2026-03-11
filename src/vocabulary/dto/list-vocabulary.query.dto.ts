import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListVocabularyQueryDto {
  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Pagination offset',
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    example: 50,
    default: 50,
    description: 'Page size (max 100)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
