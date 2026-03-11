import { ApiProperty } from '@nestjs/swagger';
import { Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'dat',
    default: 'dat',
    description: 'Unique username (letters, numbers, underscores)',
  })
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username must contain only letters, numbers, and underscores',
  })
  username!: string;

  @ApiProperty({
    example: 'Password123!',
    default: 'Password123!',
    description: 'Password (will be bcrypt-hashed)',
  })
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
