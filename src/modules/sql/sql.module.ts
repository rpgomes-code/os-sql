// src/modules/sql/sql.module.ts
import { Module } from '@nestjs/common';
import { SqlConversionService } from './sql-conversion.service';
import { SqlController } from './sql.controller';
import { SqlService } from './sql.service';

@Module({
  controllers: [SqlController],
  providers: [SqlService, SqlConversionService], // Both services are properly registered
  exports: [SqlService, SqlConversionService],
})
export class SqlModule {}
