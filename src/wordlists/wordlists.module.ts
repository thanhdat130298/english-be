import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WordlistsController } from './wordlists.controller';
import { WordlistsService } from './wordlists.service';

@Module({
  imports: [PrismaModule],
  controllers: [WordlistsController],
  providers: [WordlistsService],
})
export class WordlistsModule {}
