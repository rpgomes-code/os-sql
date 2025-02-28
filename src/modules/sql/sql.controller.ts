// src/modules/sql/sql.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SqlService } from './sql.service';
import { AnalyzeSqlDto } from './dto/analyze-sql.dto';
import { ConvertSqlDto } from './dto/convert-sql.dto';

@ApiTags('sql')
@Controller('sql')
export class SqlController {
  constructor(private readonly sqlService: SqlService) {}

  @Post('analyze')
  @ApiOperation({
    summary: 'Analyze SQL Query',
    description:
      'Analyzes the provided SQL query for performance, maintainability, and syntax issues. If analysis_type is omitted or empty, defaults to all.',
  })
  @ApiResponse({
    status: 201,
    description: 'SQL analysis completed',
    schema: {
      example: {
        dialect: 'sql_server',
        converted_query: 'Converted: SELECT ...',
        analysis: [
          {
            analysis_type: 'syntax',
            notes: [
              {
                title: 'Issue in syntax',
                location: 'SELECT ...',
                possible_fix: 'Consider reviewing the SQL syntax',
              },
            ],
          },
        ],
      },
    },
  })
  analyze(@Body() analyzeSqlDto: AnalyzeSqlDto) {
    return this.sqlService.analyze(analyzeSqlDto);
  }

  @Post('convert')
  @ApiOperation({
    summary: 'Convert SQL Query',
    description:
      'Converts an SQL query from one dialect to another. The to_dialect must be different from from_dialect.',
  })
  @ApiResponse({
    status: 201,
    description: 'SQL conversion completed',
    schema: {
      example: {
        from_dialect: 'sql_server',
        original_query: 'SELECT ...',
        to_dialect: 'postgres',
        converted_query: 'Converted [sql_server -> postgres]: SELECT ...',
      },
    },
  })
  convert(@Body() convertSqlDto: ConvertSqlDto) {
    return this.sqlService.convert(convertSqlDto);
  }
}
