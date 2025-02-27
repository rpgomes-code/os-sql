// src/modules/sql-migration/sql-migration.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  SqlMigrationRequestDto,
  SqlMigrationResponseDto,
} from './dto/sql-migration.dto';
import { SqlMigrationService } from './sql-migration.service';

@ApiTags('SQL Migration')
@Controller('sql-migration')
export class SqlMigrationController {
  constructor(private readonly sqlMigrationService: SqlMigrationService) {}

  @Post('convert')
  @ApiOperation({
    summary: 'Convert SQL Server Query to PostgreSQL',
    description:
      'Converts an SQL Server query to PostgreSQL format following OutSystems guidelines',
  })
  @ApiResponse({
    status: 201,
    description: 'Query converted successfully',
    type: SqlMigrationResponseDto,
  })
  async convertQuery(
    @Body() dto: SqlMigrationRequestDto,
  ): Promise<SqlMigrationResponseDto> {
    return this.sqlMigrationService.convertQuery(dto);
  }
}
