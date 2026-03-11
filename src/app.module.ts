import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TranslateModule } from './translate/translate.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
import { WordlistsModule } from './wordlists/wordlists.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TranslateModule,
    VocabularyModule,
    WordlistsModule,
    ProgressModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
