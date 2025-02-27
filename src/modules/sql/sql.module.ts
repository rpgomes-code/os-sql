// src/modules/sql/sql.module.ts
import { Module } from '@nestjs/common';
import { SqlConversionService } from './sql-conversion.service';

@Module({
  controllers: [], // Removed SqlController
  providers: [SqlConversionService], // Keep only the conversion service
  exports: [SqlConversionService],
})
export class SqlModule {}