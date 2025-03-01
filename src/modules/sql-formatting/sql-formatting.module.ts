// src/modules/sql-formatting/sql-formatting.module.ts
import { Module } from '@nestjs/common';
import { LoggingModule } from '../logging/logging.module';
import { SqlFormattingController } from './sql-formatting.controller';
import { SqlFormattingService } from './sql-formatting.service';

@Module({
  imports: [LoggingModule],
  controllers: [SqlFormattingController],
  providers: [SqlFormattingService],
  exports: [SqlFormattingService],
})
export class SqlFormattingModule {}
