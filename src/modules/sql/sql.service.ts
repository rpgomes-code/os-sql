// src/modules/sql/sql.service.ts
import { Injectable } from '@nestjs/common';
import { AnalyzeSqlDto } from './dto/analyze-sql.dto';
import { ConvertSqlDto } from './dto/convert-sql.dto';
import { SqlConversionService } from './sql-conversion.service'; // Add this import

@Injectable()
export class SqlService {
  constructor(
    private readonly conversionService: SqlConversionService, // Add dependency injection
  ) {}

  analyze(dto: AnalyzeSqlDto) {
    // If analysis_type is not provided or empty, default to all
    const analysisTypes =
      dto.analysis_type && dto.analysis_type.length > 0
        ? dto.analysis_type
        : ['performance', 'maintainability', 'syntax'];

    // For each analysis type, generate placeholder analysis results
    const analysis = analysisTypes.map((type) => ({
      analysis_type: type,
      notes: [
        {
          title: `Issue in ${type}`,
          location: 'SELECT ...', // Placeholder for code snippet
          possible_fix: 'Consider reviewing the SQL syntax', // Placeholder for suggestion
        },
      ],
    }));

    return {
      dialect: dto.dialect,
      converted_query: `Converted: ${dto.query}`, // Placeholder conversion
      analysis,
    };
  }

  convert(dto: ConvertSqlDto) {
    try {
      const decodedQuery = Buffer.from(dto.original_query, 'base64').toString(
        'utf-8',
      );
      const convertedQuery =
        this.conversionService.convertSqlServerToPostgres(decodedQuery);

      return {
        success: true,
        converted_query: Buffer.from(convertedQuery).toString('base64'),
        warnings: this.getConversionWarnings(convertedQuery),
      };
    } catch (error) {
      return {
        success: false,
        error: `Conversion failed: ${error.message}`,
        details: this.getErrorDetails(error),
      };
    }
  }

  private getConversionWarnings(query: string): string[] {
    const warnings: string[] = [];
    if (query.includes('DYNAMIC_ORDER_PLACEHOLDER')) {
      warnings.push(
        'Dynamic ORDER BY requires application-level implementation',
      );
    }
    if (query.includes('temp_')) {
      warnings.push('Temporary tables were converted with temp_ prefix');
    }
    return warnings;
  }

  private getErrorDetails(error: Error): Record<string, any> {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }
}
