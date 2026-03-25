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
import { ProgressDashboardQueryDto } from './dto/progress-dashboard.query.dto';
import { ProgressLeaderboardQueryDto } from './dto/progress-leaderboard.query.dto';
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

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get progress dashboard data for the authenticated user',
  })
  @ApiResponse({ status: 200 })
  async dashboard(
    @CurrentUser() user: RequestUser,
    @Query() query: ProgressDashboardQueryDto,
  ) {
    return this.progressService.getDashboard(user.userId, query.from, query.to);
  }

  @Get('leaderboard')
  @ApiOperation({
    summary: 'Get global leaderboard ranked by total vocabulary count',
  })
  @ApiResponse({ status: 200 })
  async leaderboard(
    @CurrentUser() user: RequestUser,
    @Query() query: ProgressLeaderboardQueryDto,
  ) {
    return this.progressService.getLeaderboard(
      user.userId,
      query.date,
      query.limit,
    );
  }
}
