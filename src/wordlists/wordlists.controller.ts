import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { AddWordlistItemDto } from './dto/add-wordlist-item.dto';
import { CreateWordlistDto } from './dto/create-wordlist.dto';
import { UpdateWordlistDto } from './dto/update-wordlist.dto';
import { WordlistsService } from './wordlists.service';

@ApiTags('wordlists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 401, description: 'Missing or invalid token' })
@Controller('wordlists')
export class WordlistsController {
  constructor(private readonly wordlistsService: WordlistsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a wordlist (user-owned)' })
  @ApiResponse({ status: 201 })
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateWordlistDto,
  ) {
    return this.wordlistsService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List wordlists for the authenticated user' })
  @ApiResponse({ status: 200 })
  async list(@CurrentUser() user: RequestUser) {
    return this.wordlistsService.list(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a wordlist by id (must be owned by user)' })
  @ApiResponse({ status: 200 })
  async getById(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.wordlistsService.getById(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a wordlist by id (must be owned by user)' })
  @ApiResponse({ status: 200 })
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateWordlistDto,
  ) {
    return this.wordlistsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a wordlist by id (must be owned by user)' })
  @ApiResponse({ status: 200 })
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.wordlistsService.remove(user.userId, id);
  }

  @Get(':id/items')
  @ApiOperation({ summary: 'List vocabulary items in a wordlist' })
  @ApiResponse({ status: 200 })
  async listItems(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.wordlistsService.listItems(user.userId, id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add a vocabulary item to a wordlist (idempotent)' })
  @ApiResponse({ status: 201 })
  async addItem(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddWordlistItemDto,
  ) {
    return this.wordlistsService.addItem(user.userId, id, dto);
  }

  @Delete(':id/items/:vocabularyId')
  @ApiOperation({
    summary: 'Remove a vocabulary item from a wordlist (idempotent)',
  })
  @ApiResponse({ status: 200 })
  async removeItem(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('vocabularyId', new ParseUUIDPipe()) vocabularyId: string,
  ) {
    return this.wordlistsService.removeItem(user.userId, id, vocabularyId);
  }
}
