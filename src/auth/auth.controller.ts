import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { MeResponseDto } from './dto/me.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { RequestUser } from './types/request-user';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user from JWT' })
  @ApiResponse({ status: 200, type: MeResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  me(@CurrentUser() user: RequestUser): MeResponseDto {
    return { userId: user.userId, username: user.username };
  }

  @Post('register')
  @ApiOperation({
    summary:
      'Register a new user (username/password) and return a JWT access token',
  })
  @ApiResponse({ status: 201, description: 'Registered successfully' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with username/password and return a JWT access token',
  })
  @ApiResponse({ status: 201, description: 'Logged in successfully' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Patch('password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid token or wrong password' })
  async updatePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdatePasswordDto,
  ): Promise<{ updated: true }> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return await this.authService.updatePassword(user.userId, dto);
  }

  @Patch('reset-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Reset current user password to default Password1234%',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async resetPassword(
    @CurrentUser() user: RequestUser,
  ): Promise<{ updated: true }> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return await this.authService.resetPasswordToDefault(user.userId);
  }
}
