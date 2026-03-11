import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/types/request-user';
import { ProgressSummaryQueryDto } from './dto/progress-summary.query.dto';
import { ProgressService } from './progress.service';

@ApiTags('progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 401, description: 'Missing or invalid token' })
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('summary')
  @ApiOperation({
    summary:
      'Get basic learning progress stats (total vocab + daily added count)',
  })
  @ApiResponse({ status: 200 })
  async summary(
    @CurrentUser() user: RequestUser,
    @Query() query: ProgressSummaryQueryDto,
  ) {
    return this.progressService.getSummary(user.userId, query.date);
  }
}
