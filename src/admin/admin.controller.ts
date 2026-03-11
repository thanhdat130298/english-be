import { Delete, Controller, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 401, description: 'Missing or invalid token' })
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Delete('data')
  @ApiOperation({
    summary: 'Clear all data except users',
    description:
      'Deletes all rows from WordlistItem, Wordlist, Vocabulary, TranslationCache, DictionaryCache. User table is not modified.',
  })
  @ApiResponse({
    status: 200,
    description: 'Data cleared; returns counts per table.',
  })
  async clearDataExceptUsers() {
    return this.adminService.clearDataExceptUsers();
  }
}
