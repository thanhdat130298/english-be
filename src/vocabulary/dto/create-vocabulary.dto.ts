import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVocabularyDto {
  @ApiProperty({
    example: 'take for granted',
    default: 'take for granted',
    description: 'Word or phrase',
  })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  word!: string;

  @ApiProperty({
    example: 'to accept something as normal without thinking about it',
    default: 'to accept something as normal without thinking about it',
    description: 'Meaning / note',
  })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  meaning!: string;

  @ApiPropertyOptional({
    example: 'I took electricity for granted until the blackout.',
    description: 'Optional example sentence',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(512)
  example?: string;

  @ApiPropertyOptional({
    example: 'I took electricity for granted until the blackout.',
    description: 'Optional source text (e.g., the translated sentence)',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(5000)
  sourceText?: string;
}
