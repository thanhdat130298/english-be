import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({
    example: 'App rất hữu ích, mong có thêm dark mode.',
    description: 'Feedback content from user',
    maxLength: 2000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;
}
