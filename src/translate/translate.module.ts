import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TranslateController } from './translate.controller';
import { TranslateService } from './translate.service';

@Module({
  imports: [PrismaModule],
  controllers: [TranslateController],
  providers: [TranslateService],
})
export class TranslateModule {}
