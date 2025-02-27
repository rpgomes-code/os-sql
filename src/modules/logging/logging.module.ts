// src/modules/logging/logging.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from './log.entity';
import { LoggingController } from './logging.controller';
import { LoggingService } from './logging.service';

@Module({
  imports: [TypeOrmModule.forFeature([Log])],
  providers: [LoggingService],
  exports: [LoggingService],
  controllers: [LoggingController],
})
export class LoggingModule {}
