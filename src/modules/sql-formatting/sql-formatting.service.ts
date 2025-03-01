// src/modules/sql-formatting/sql-formatting.service.ts
import { Injectable } from '@nestjs/common';
import { LoggingService } from '../logging/logging.service';
import {
  SqlFormattingRequestDto,
  SqlFormattingResponseDto,
} from './dto/sql-formatting.dto';

@Injectable()
export class SqlFormattingService {
  constructor(private readonly loggingService: LoggingService) {}

  /**
   * Format an SQL query with proper indentation and spacing for better readability
   */
  async formatQuery(
    dto: SqlFormattingRequestDto,
  ): Promise<SqlFormattingResponseDto> {
    try {
      // Decode the base64 query
      const decodedQuery = Buffer.from(dto.original_query, 'base64').toString(
        'utf-8',
      );
      const warnings: string[] = [];

      // Apply formatting
      const formattedQuery = this.applyFormatting(decodedQuery, warnings);

      // Log successful formatting
      await this.loggingService.createLog({
        log_type: 'info',
        log_endpoint: 'POST /sql-formatting/format',
        log_location: 'SqlFormattingService.formatQuery',
        log_owner: 'system',
        log_severity: 'low',
        log_title: 'SQL Query Formatted',
        log_message: `Original query length: ${decodedQuery.length}, Formatted query length: ${formattedQuery.length}`,
      });

      return {
        success: true,
        formatted_query: Buffer.from(formattedQuery).toString('base64'),
        warnings,
      };
    } catch (error) {
      // Log error
      await this.loggingService.createLog({
        log_type: 'error',
        log_endpoint: 'POST /sql-formatting/format',
        log_location: 'SqlFormattingService.formatQuery',
        log_owner: 'system',
        log_severity: 'medium',
        log_title: 'SQL Formatting Failed',
        log_message: (error.stack || error.message),
      });

      return {
        success: false,
        formatted_query: '',
        warnings: [`Formatting failed: ${error.message}`],
      };
    }
  }

  /**
   * Minify an SQL query by removing unnecessary whitespace and comments
   */
  async minifyQuery(
    dto: SqlFormattingRequestDto,
  ): Promise<SqlFormattingResponseDto> {
    try {
      // Decode the base64 query
      const decodedQuery = Buffer.from(dto.original_query, 'base64').toString(
        'utf-8',
      );
      const warnings: string[] = [];

      // Apply minification
      const minifiedQuery = this.applyMinification(decodedQuery, warnings);

      // Calculate compression percentage
      const originalSize = decodedQuery.length;
      const minifiedSize = minifiedQuery.length;
      const compressionPercent = originalSize > 0
        ? Math.round((1 - minifiedSize / originalSize) * 100)
        : 0;

      // Log successful minification
      await this.loggingService.createLog({
        log_type: 'info',
        log_endpoint: 'POST /sql-formatting/minify',
        log_location: 'SqlFormattingService.minifyQuery',
        log_owner: 'system',
        log_severity: 'low',
        log_title: 'SQL Query Minified',
        log_message: `Original size: ${originalSize}, Minified size: ${minifiedSize}, Compression: ${compressionPercent}%`,
      });

      return {
        success: true,
        formatted_query: Buffer.from(minifiedQuery).toString('base64'),
        warnings,
      };
    } catch (error) {
      // Log error
      await this.loggingService.createLog({
        log_type: 'error',
        log_endpoint: 'POST /sql-formatting/minify',
        log_location: 'SqlFormattingService.minifyQuery',
        log_owner: 'system',
        log_severity: 'medium',
        log_title: 'SQL Minification Failed',
        log_message: error.stack || error.message,
      });

      return {
        success: false,
        formatted_query: '',
        warnings: [`Minification failed: ${error.message}`],
      };
    }
  }

  /**
   * Apply SQL formatting rules to make the query more readable
   */
  private applyFormatting(query: string, warnings: string[]): string {
    try {
      // Common SQL keywords to format
      const mainKeywords = [
        'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
        'INNER JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
        'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT'
      ];

      const secondaryKeywords = [
        'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
        'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'WITH'
      ];

      // Start with a clean query by removing excess whitespace
      let formattedQuery = query.trim();

      // Replace tabs with spaces for consistent indentation
      formattedQuery = formattedQuery.replace(/\t/g, '  ');

      // Normalize whitespace
      formattedQuery = formattedQuery.replace(/\s+/g, ' ');

      // Add newlines before main keywords
      for (const keyword of mainKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        formattedQuery = formattedQuery.replace(regex, `\n${keyword}`);
      }

      // Add newlines before secondary keywords
      for (const keyword of secondaryKeywords) {
        const regex = new RegExp(`\\b${keyword.replace(' ', '\\s+')}\\b`, 'gi');
        formattedQuery = formattedQuery.replace(regex, `\n${keyword}`);
      }

      // Add newlines after commas in SELECT clauses
      formattedQuery = formattedQuery.replace(/,\s+(?![^(]*\))/g, ',\n  ');

      // Handle indentation
      const lines = formattedQuery.split('\n');
      let indentLevel = 0;
      let inSelectClause = false;

      const indentedLines = lines.map(line => {
        let trimmedLine = line.trim();
        if (!trimmedLine) return '';

        // Adjust indent level based on content
        if (/\bSELECT\b/i.test(trimmedLine)) {
          indentLevel = 0;
          inSelectClause = true;
        } else if (/\bFROM\b/i.test(trimmedLine)) {
          indentLevel = 0;
          inSelectClause = false;
        } else if (/\bJOIN\b/i.test(trimmedLine)) {
          indentLevel = 1;
        } else if (/\bWHERE\b/i.test(trimmedLine)) {
          indentLevel = 0;
        } else if (/\b(GROUP BY|ORDER BY|HAVING)\b/i.test(trimmedLine)) {
          indentLevel = 0;
        } else if (inSelectClause && trimmedLine.length > 0 && !(/\bSELECT\b/i.test(trimmedLine))) {
          indentLevel = 1;
        }

        // Increase indent for nested queries
        if (trimmedLine.endsWith('(')) {
          const indent = '  '.repeat(indentLevel);
          indentLevel++;
          return indent + trimmedLine;
        }

        // Decrease indent for closing parentheses
        if (trimmedLine.startsWith(')')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        const indent = '  '.repeat(indentLevel);
        return indent + trimmedLine;
      });

      return indentedLines.join('\n').trim();
    } catch (error) {
      warnings.push(`Simple formatter applied: ${error.message}`);

      // Fallback to basic formatting if advanced formatting fails
      return query
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s*=\s*/g, ' = ')
        .replace(/\s*>\s*/g, ' > ')
        .replace(/\s*<\s*/g, ' < ')
        .replace(/\s*\(\s*/g, ' (')
        .replace(/\s*\)\s*/g, ') ')
        .trim();
    }
  }

  /**
   * Apply SQL minification rules to reduce query size
   */
  private applyMinification(query: string, warnings: string[]): string {
    try {
      // Remove single-line comments
      let minifiedQuery = query.replace(/--.*$/gm, '');

      // Remove multi-line comments
      minifiedQuery = minifiedQuery.replace(/\/\*[\s\S]*?\*\//g, '');

      // Replace multiple whitespace characters with a single space
      minifiedQuery = minifiedQuery.replace(/\s+/g, ' ');

      // Remove spaces around common operators
      minifiedQuery = minifiedQuery
        .replace(/\s*=\s*/g, '=')
        .replace(/\s*>\s*/g, '>')
        .replace(/\s*<\s*/g, '<')
        .replace(/\s*>=\s*/g, '>=')
        .replace(/\s*<=\s*/g, '<=')
        .replace(/\s*<>\s*/g, '<>')
        .replace(/\s*!=\s*/g, '!=')
        .replace(/\s*\(\s*/g, '(')
        .replace(/\s*\)\s*/g, ')')
        .replace(/\s*,\s*/g, ',');

      // Preserve space after keywords
      const keywords = [
        'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER',
        'OUTER', 'CROSS', 'GROUP', 'ORDER', 'BY', 'HAVING', 'LIMIT',
        'OFFSET', 'UNION', 'INSERT', 'UPDATE', 'DELETE', 'CREATE',
        'ALTER', 'DROP', 'INTO', 'VALUES', 'SET', 'AS'
      ];

      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        minifiedQuery = minifiedQuery.replace(regex, match => `${match} `);
      }

      // Trim leading and trailing whitespace
      minifiedQuery = minifiedQuery.trim();

      return minifiedQuery;
    } catch (error) {
      warnings.push(`Basic minification applied: ${error.message}`);

      // Fallback to simple minification
      return query.replace(/\s+/g, ' ').trim();
    }
  }
}
