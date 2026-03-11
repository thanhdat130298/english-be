import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty({ example: '0cb6e6c6-4c2d-4c77-9c2b-2d5c0f4b2d4f' })
  userId!: string;

  @ApiProperty({ example: 'dat' })
  username!: string;
}
