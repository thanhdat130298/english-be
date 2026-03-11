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
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { VocabularyService } from './vocabulary.service';

@ApiTags('vocabulary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 401, description: 'Missing or invalid token' })
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a vocabulary item (user-owned)' })
  @ApiResponse({ status: 201 })
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateVocabularyDto,
  ) {
    return this.vocabularyService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List vocabulary items for the authenticated user' })
  @ApiResponse({ status: 200 })
  async list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListVocabularyQueryDto,
  ) {
    return this.vocabularyService.list(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a vocabulary item by id (must be owned by user)',
  })
  @ApiResponse({ status: 200 })
  async getById(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.vocabularyService.getById(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a vocabulary item by id (must be owned by user)',
  })
  @ApiResponse({ status: 200 })
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateVocabularyDto,
  ) {
    return this.vocabularyService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a vocabulary item by id (must be owned by user)',
  })
  @ApiResponse({ status: 200 })
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.vocabularyService.remove(user.userId, id);
  }
}
