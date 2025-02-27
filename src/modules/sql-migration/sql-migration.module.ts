// src/modules/sql-migration/sql-migration.module.ts
import { Module } from '@nestjs/common';
import { LoggingModule } from '../logging/logging.module';
import { SqlModule } from '../sql/sql.module';
import { SqlMigrationController } from './sql-migration.controller';
import { SqlMigrationService } from './sql-migration.service';

@Module({
  imports: [SqlModule, LoggingModule],
  controllers: [SqlMigrationController],
  providers: [SqlMigrationService],
  exports: [SqlMigrationService],
})
export class SqlMigrationModule {}
