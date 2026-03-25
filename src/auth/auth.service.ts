import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

type AuthTokenResponse = {
  accessToken: string;
};

const DEFAULT_RESET_PASSWORD = 'Password1234%';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private signAccessToken(payload: {
    userId: string;
    username: string;
  }): string {
    return this.jwtService.sign({
      sub: payload.userId,
      username: payload.username,
    });
  }

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const username = dto.username.trim();

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          username,
          passwordHash,
        },
      });

      return {
        accessToken: this.signAccessToken({
          userId: user.id,
          username: user.username,
        }),
      };
    } catch (err: unknown) {
      // Prisma unique constraint violation
      const code = (err as { code?: unknown } | null)?.code;
      if (code === 'P2002') {
        throw new ConflictException('username already exists');
      }
      throw err;
    }
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const username = dto.username.trim();

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('invalid credentials');
    }

    return {
      accessToken: this.signAccessToken({
        userId: user.id,
        username: user.username,
      }),
    };
  }

  async updatePassword(
    userId: string,
    dto: UpdatePasswordDto,
  ): Promise<{ updated: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('invalid token user');
    }

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { updated: true };
  }

  async resetPasswordToDefault(userId: string): Promise<{ updated: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('invalid token user');
    }

    const passwordHash = await bcrypt.hash(DEFAULT_RESET_PASSWORD, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { updated: true };
  }
}
