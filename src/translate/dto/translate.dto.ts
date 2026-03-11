import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class TranslateDto {
  @ApiProperty({
    example: 'take for granted',
    default: 'take for granted',
    description:
      'Text to translate: 1 word, phrase, or sentence (e.g. "recommend", "take for granted", or a full sentence).',
  })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  text!: string;

  @ApiProperty({
    example: 'VI',
    default: 'VI',
    description: 'Target language',
  })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{2}(-[A-Z]{2})?$/, {
    message: 'targetLang must be like EN or EN-US',
  })
  targetLang!: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description:
      'When true or omitted: also save a Vocabulary item for the current user. Set to false to only translate and cache (no Vocabulary row).',
  })
  @IsOptional()
  @IsBoolean()
  saveToVocabulary?: boolean;

  @ApiPropertyOptional({
    example: 'take for granted',
    description:
      'Optional. If omitted and saveToVocabulary=true, server will store `text` as the vocabulary word (must be <= 128 chars).',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(128)
  vocabularyWord?: string;

  @ApiPropertyOptional({
    example: 'I took electricity for granted until the blackout.',
    description: 'Optional example sentence to store in Vocabulary.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(512)
  vocabularyExample?: string;

  @ApiPropertyOptional({
    example: 'I took electricity for granted until the blackout.',
    description: 'Optional source text to store in Vocabulary.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(5000)
  vocabularySourceText?: string;
}
