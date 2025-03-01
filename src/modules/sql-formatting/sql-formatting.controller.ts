// src/modules/sql-formatting/sql-formatting.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  SqlFormattingRequestDto,
  SqlFormattingResponseDto,
} from './dto/sql-formatting.dto';
import { SqlFormattingService } from './sql-formatting.service';

@ApiTags('SQL Formatting')
@Controller('sql-formatting')
export class SqlFormattingController {
  constructor(private readonly sqlFormattingService: SqlFormattingService) {}

  @Post('format')
  @ApiOperation({
    summary: 'Format SQL Query',
    description:
      'Formats an SQL query with proper indentation and spacing for better readability',
  })
  @ApiResponse({
    status: 201,
    description: 'Query formatted successfully',
    type: SqlFormattingResponseDto,
  })
  async formatQuery(
    @Body() dto: SqlFormattingRequestDto,
  ): Promise<SqlFormattingResponseDto> {
    return this.sqlFormattingService.formatQuery(dto);
  }

  @Post('minify')
  @ApiOperation({
    summary: 'Minify SQL Query',
    description:
      'Minifies an SQL query by removing unnecessary whitespace and comments',
  })
  @ApiResponse({
    status: 201,
    description: 'Query minified successfully',
    type: SqlFormattingResponseDto,
  })
  async minifyQuery(
    @Body() dto: SqlFormattingRequestDto,
  ): Promise<SqlFormattingResponseDto> {
    return this.sqlFormattingService.minifyQuery(dto);
  }
}
