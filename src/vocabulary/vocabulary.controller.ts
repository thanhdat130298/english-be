import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/types/request-user';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { ListVocabularyQueryDto } from './dto/list-vocabulary.query.dto';
import { ReviewVocabDto } from './dto/review-vocab.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { VocabularyService } from './vocabulary.service';

@ApiTags('vocab')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 401, description: 'Missing or invalid token' })
/**
 * With global prefix `api`: `/api/vocab` and `/api/vocabulary` (same handlers).
 */
@Controller(['vocab', 'vocabulary'])
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get('review-queue')
  @ApiOperation({
    summary: 'Review queue (all active items)',
    description:
      'All non-archived items, ordered by createdAt desc, max 20.',
  })
  @ApiResponse({ status: 200 })
  async reviewQueue(@CurrentUser() user: RequestUser) {
    return this.vocabularyService.getReviewQueue(user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'List vocabulary (learning)',
    description:
      'Paginated list with optional filters. Each item includes isNew, isDue, isMastered (derived) and dictionary when cached.',
  })
  @ApiResponse({
    status: 200,
    description:
      '{ items, total, page, pageSize } with derived fields on each item',
  })
  async list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListVocabularyQueryDto,
  ) {
    return this.vocabularyService.list(user.userId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create vocabulary',
    description:
      'Initial learning: reviewCount=0, correctCount=0, nextReviewAt=now+1d. Duplicate word (same user, case-insensitive) returns existing.',
  })
  @ApiResponse({ status: 201 })
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateVocabularyDto,
  ) {
    return this.vocabularyService.create(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vocabulary by id' })
  @ApiResponse({ status: 200 })
  async getById(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.vocabularyService.getById(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update word/phrase fields (not review state)' })
  @ApiResponse({ status: 200 })
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateVocabularyDto,
  ) {
    return this.vocabularyService.update(user.userId, id, dto);
  }

  @Patch(':id/review')
  @ApiOperation({
    summary: 'Submit review result',
    description:
      'HARD: +1 day; MEDIUM: +3 days, +1 correct; EASY: +5–7 days, +1 correct',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Archived or invalid body' })
  async review(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReviewVocabDto,
  ) {
    return this.vocabularyService.review(user.userId, id, dto.result);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive vocabulary (soft hide)' })
  @ApiResponse({ status: 200 })
  async archive(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.vocabularyService.archive(user.userId, id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete (archives — same as PATCH archive)',
    description: 'Does not permanently delete; sets isArchived=true.',
  })
  @ApiResponse({ status: 200 })
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.vocabularyService.remove(user.userId, id);
  }
}
