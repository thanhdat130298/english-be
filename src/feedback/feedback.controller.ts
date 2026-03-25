import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/types/request-user';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 401, description: 'Missing or invalid token' })
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit feedback',
    description: 'Limit: max 5 feedback/day and max 20 feedback/user.',
  })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400, description: 'Feedback limit reached' })
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.create(user.userId, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List current user feedback' })
  @ApiResponse({ status: 200 })
  async listMine(@CurrentUser() user: RequestUser) {
    return this.feedbackService.listMine(user.userId);
  }
}
