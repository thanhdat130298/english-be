import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/types/request-user';
import { TranslateDto } from './dto/translate.dto';
import { TranslateService } from './translate.service';

@ApiTags('translate')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Post()
  @ApiOperation({
    summary:
      'Translate 1 word, phrase, or sentence via DeepL; optional save to Vocabulary',
    description:
      'Supports a single word, phrase, or full sentence. Results are cached. Set saveToVocabulary=true to also create a Vocabulary item (word defaults to text if vocabularyWord omitted).',
  })
  @ApiResponse({
    status: 201,
    description:
      'Translated successfully (cached or new); may include vocabulary.id if saveToVocabulary=true',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid token',
  })
  async translate(@CurrentUser() user: RequestUser, @Body() dto: TranslateDto) {
    return this.translateService.translate(user.userId, dto);
  }
}
