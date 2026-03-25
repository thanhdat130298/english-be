import { ApiProperty } from '@nestjs/swagger';
import { MaxLength, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'Password123!',
    description: 'Current password',
  })
  @MinLength(8)
  @MaxLength(72)
  currentPassword!: string;

  @ApiProperty({
    example: 'NewPassword456!',
    description: 'New password',
  })
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}
