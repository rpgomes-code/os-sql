// src/modules/sql-migration/sql-migration.service.ts
import { Injectable } from '@nestjs/common';
import {
  SqlMigrationRequestDto,
  SqlMigrationResponseDto,
} from './dto/sql-migration.dto';

@Injectable()
export class SqlMigrationService {
  async convertQuery(
    dto: SqlMigrationRequestDto,
  ): Promise<SqlMigrationResponseDto> {
    try {
      // Decode the base64 query
      const decodedQuery = Buffer.from(dto.original_query, 'base64').toString(
        'utf-8',
      );
      const warnings: string[] = [];

      let convertedQuery = decodedQuery;

      // Phase 1: Core syntax conversion
      convertedQuery = this.convertCoreSyntax(convertedQuery);

      // Phase 2: Handle string operations and LIKE patterns
      convertedQuery = this.handleStringConcatenation(convertedQuery);
      convertedQuery = this.handleLikeOperations(convertedQuery);

      // Phase 3: Handle critical transformations
      convertedQuery = this.handleBooleanLiterals(convertedQuery);
      convertedQuery = this.handleArrayParameters(convertedQuery);
      convertedQuery = this.handleTopToLimit(convertedQuery);
      convertedQuery = this.handleTimeComparisons(convertedQuery);
      convertedQuery = this.handleTemporalFunctions(convertedQuery);
      convertedQuery = this.handleDataTypes(convertedQuery);

      // Phase 4: Handle statement transformations
      convertedQuery = this.handleStuffXmlPath(convertedQuery);
      convertedQuery = this.handleInsertStatements(convertedQuery);
      convertedQuery = this.handleUpdateStatements(convertedQuery);

      // Final phase: Validation and cleanup
      convertedQuery = this.cleanRedundantCasts(convertedQuery);
      this.validateQuery(convertedQuery, warnings);

      return {
        success: true,
        converted_query: Buffer.from(convertedQuery).toString('base64'),
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        converted_query: '',
        warnings: [`Conversion failed: ${error.message}`],
      };
    }
  }

  private convertCoreSyntax(query: string): string {
    return query
      .replace(/^\s*GO\s*$/gim, '')
      .replace(/WITH\s+\(NOLOCK\)/gi, '')
      .replace(/#(\w+)/g, 'temp_$1');
  }

  private handleBooleanLiterals(query: string): string {
    let converted = query;

    // Handle Is_ prefixed and boolean-like field names with table references
    converted = converted.replace(
      /(\{[^}]+\}\.\[(?:Is_?)[A-Za-z_]+\])\s*=\s*1(?!\d)/gi,
      '$1 IS TRUE',
    );
    converted = converted.replace(
      /(\{[^}]+\}\.\[(?:Is_?)[A-Za-z_]+\])\s*=\s*0(?!\d)/gi,
      '$1 IS FALSE',
    );

    // Handle WHERE, AND, OR conditions with parameters
    converted = converted.replace(
      /(\bWHERE|\bAND|\bOR)\s+(@\w+)\s*=\s*1(?!\d)/gi,
      '$1 $2 IS TRUE',
    );
    converted = converted.replace(
      /(\bWHERE|\bAND|\bOR)\s+(@\w+)\s*=\s*0(?!\d)/gi,
      '$1 $2 IS FALSE',
    );

    // Handle boolean fields in AND/OR conditions
    converted = converted.replace(
      /(\bWHERE|\bAND|\bOR)\s+(\{[^}]+\}\.\[[^\]]+\])\s*=\s*1(?!\d)/gi,
      '$1 $2 IS TRUE',
    );
    converted = converted.replace(
      /(\bWHERE|\bAND|\bOR)\s+(\{[^}]+\}\.\[[^\]]+\])\s*=\s*0(?!\d)/gi,
      '$1 $2 IS FALSE',
    );

    // Handle parameter conditions
    converted = converted.replace(/(@\w+)\s*=\s*1(?!\d)/gi, '$1 IS TRUE');
    converted = converted.replace(/(@\w+)\s*=\s*0(?!\d)/gi, '$1 IS FALSE');

    return converted;
  }

  private handleArrayParameters(query: string): string {
    let converted = query;

    // Handle parameterized IN clauses with table references
    converted = converted.replace(
      /(\{[^}]+\}\.\[[^\]]+\]|\w+\.[^\s]+)\s+IN\s*\(\s*(@?\w+)\s*\)/gi,
      (match, column, param) => {
        // Add @ if missing
        const parameter = param.startsWith('@') ? param : `@${param}`;
        return `${column} = ANY(ARRAY[${parameter}])`;
      },
    );

    // Handle multiple parameters IN clauses
    converted = converted.replace(
      /\bIN\s*\(\s*(@?\w+)(\s*,\s*@?\w+)*\s*\)/gi,
      (match, firstParam, otherParams) => {
        // Process first parameter
        let params = [
          firstParam.startsWith('@') ? firstParam : `@${firstParam}`,
        ];

        // Process other parameters if they exist
        if (otherParams) {
          params = params.concat(
            otherParams
              .split(',')
              .map((p) => p.trim())
              .filter((p) => p)
              .map((p) => (p.startsWith('@') ? p : `@${p}`)),
          );
        }

        return `= ANY(ARRAY[${params.join(',')}])`;
      },
    );

    return converted;
  }

  private handleStringConcatenation(query: string): string {
    let converted = query;

    // Handle string concatenations with LIKE patterns
    converted = converted.replace(
      /LIKE\s*'([^']*?)'\s*\+\s*@(\w+)\s*\+\s*'([^']*?)'/gi,
      "LIKE '$1' || @$2 || '$3'",
    );

    // Handle table/column concatenations
    converted = converted.replace(
      /(\{[\w_]+\}\.\[[\w_]+\])\s*\+\s*'([^']+)'/gi,
      "$1 || '$2'",
    );
    converted = converted.replace(
      /'([^']+)'\s*\+\s*(\{[\w_]+\}\.\[[\w_]+\])/gi,
      "'$1' || $2",
    );

    // Handle general string concatenations
    converted = converted.replace(
      /'([^']+)'\s*\+\s*'([^']+)'/g,
      "'$1' || '$2'",
    );
    converted = converted.replace(/'([^']+)'\s*\+\s*@(\w+)/g, "'$1' || @$2");
    converted = converted.replace(/@(\w+)\s*\+\s*'([^']+)'/g, "@$1 || '$2'");

    return converted;
  }

  private handleLikeOperations(query: string): string {
    let converted = query;

    // Handle LIKE operations with table references and parameters, ensuring all text columns use caseaccent_normalize
    const likePattern =
      /(\{[^}]+\}\.\[[^\]]+\]|\w+\.[^\s]+)\s+LIKE\s+(?:'[^']*'\s*(?:\+|\|\|)\s*)?(@\w+)(?:\s*(?:\+|\|\|)\s*'[^']*')?/gi;
    converted = converted.replace(likePattern, (match, column, param) => {
      return `caseaccent_normalize(${column} collate "default") LIKE caseaccent_normalize('%' || ${param} || '%')`;
    });

    // Handle simple LIKE with concatenation
    converted = converted.replace(
      /(\{[^}]+\}\.\[[^\]]+\]|\w+\.[^\s]+)\s+LIKE\s+'([^']+)'\s*\+\s*(@\w+)\s*\+\s*'([^']+)'/gi,
      "caseaccent_normalize($1 collate \"default\") LIKE caseaccent_normalize('$2' || $3 || '$4')",
    );

    // Handle simple LIKE patterns
    converted = converted.replace(
      /(\{[^}]+\}\.\[[^\]]+\]|\w+\.[^\s]+)\s+LIKE\s+'([^']+)'/gi,
      'caseaccent_normalize($1 collate "default") LIKE caseaccent_normalize(\'$2\')',
    );

    return converted;
  }

  private handleStuffXmlPath(query: string): string {
    // Pattern to match STUFF with FOR XML PATH including the separator in the SELECT part
    const xmlPathPattern =
      /STUFF\s*\(\s*\(\s*SELECT\s+('([^']+)'\s*\+\s*)?([^)]+)FROM\s+([^)]+)FOR\s+XML\s+PATH\s*\('[^']*'\)\s*\)\s*,\s*\d+\s*,\s*\d+\s*,\s*'[^']*'\s*\)/gi;

    return query.replace(
      xmlPathPattern,
      (match, separatorGroup, separator, selectExpr, fromWhere) => {
        // Extract the separator from the prefix if it exists, defaulting to empty string
        const actualSeparator = separator ? separator.trim() : '';

        // Clean up the select expression by removing the concatenation operator
        const cleanSelectExpr = selectExpr.replace(/\+\s*$/, '').trim();

        // Create the STRING_AGG expression
        return `COALESCE((
        SELECT STRING_AGG(${cleanSelectExpr}, '${actualSeparator}')
        FROM ${fromWhere}
      ), '')`;
      },
    );
  }

  private handleTimeComparisons(query: string): string {
    return query.replace(
      /(\{[\w_]+\})\.\[Time\]\s*(>|<|=|>=|<=|<>)\s*'(\d{2}:\d{2}:\d{2})'/g,
      "$1.[Time]::time $2 '$3'",
    );
  }

  private handleTemporalFunctions(query: string): string {
    return query
      .replace(/GETDATE\(\)/gi, 'CURRENT_TIMESTAMP')
      .replace(/GETUTCDATE\(\)/gi, "NOW() AT TIME ZONE 'UTC'")
      .replace(/SYSDATETIME\(\)/gi, 'CURRENT_TIMESTAMP(6)');
  }

  private handleDataTypes(query: string): string {
    const typeMap: Record<string, string> = {
      INT: 'INTEGER',
      SMALLINT: 'SMALLINT',
      TINYINT: 'SMALLINT',
      BIGINT: 'BIGINT',
      BIT: 'BOOLEAN',
      FLOAT: 'DOUBLE PRECISION',
      REAL: 'REAL',
      VARCHAR: 'TEXT',
      NVARCHAR: 'TEXT',
      CHAR: 'CHAR',
      NCHAR: 'CHAR',
      TEXT: 'TEXT',
      NTEXT: 'TEXT',
      DATE: 'DATE',
      DATETIME: 'TIMESTAMP',
      DATETIME2: 'TIMESTAMP',
      SMALLDATETIME: 'TIMESTAMP(0)',
      TIME: 'TIME',
      DATETIMEOFFSET: 'TIMESTAMPTZ',
      DECIMAL: 'DECIMAL',
      NUMERIC: 'NUMERIC',
      MONEY: 'NUMERIC(19,4)',
      SMALLMONEY: 'NUMERIC(10,4)',
      BINARY: 'BYTEA',
      VARBINARY: 'BYTEA',
      IMAGE: 'BYTEA',
      UNIQUEIDENTIFIER: 'UUID',
      XML: 'XML',
      SQL_VARIANT: 'JSONB',
    };

    return query.replace(
      /(\bCAST\s*\(\s*\w+\s+AS\s+)(\w+)(\s*\))/gi,
      (match, prefix, type, suffix) => {
        const pgType = typeMap[type.toUpperCase()] || type;
        return `${prefix}${pgType}${suffix}`;
      },
    );
  }

  private handleTopToLimit(query: string): string {
    const topMatch = query.match(/SELECT\s+TOP\s+(\d+)/i);
    if (topMatch && topMatch[1]) {
      let result = query.replace(/SELECT\s+TOP\s+(\d+)/gi, 'SELECT');
      if (result.includes('ORDER BY')) {
        result = result.replace(
          /(ORDER BY[^;\n]*)([;\n]|$)/,
          `$1 LIMIT ${topMatch[1]}$2`,
        );
      } else {
        result = result.trim();
        result = result.endsWith(';')
          ? result.slice(0, -1) + ` LIMIT ${topMatch[1]};`
          : result + ` LIMIT ${topMatch[1]}`;
      }
      return result;
    }
    return query;
  }

  private handleInsertStatements(query: string): string {
    return query.replace(
      /INSERT\s+INTO\s+(\{[\w_]+\})\s+\(\1\.\[([^\]]+)\]/gi,
      'INSERT INTO $1 ([$2]',
    );
  }

  private handleUpdateStatements(query: string): string {
    return query.replace(
      /UPDATE\s+(\{[\w_]+\})\s+SET\s+\1\.\[([^\]]+)\]/gi,
      'UPDATE $1 SET [$2]',
    );
  }

  private cleanRedundantCasts(query: string): string {
    return query
      .replace(/::text/gi, '')
      .replace(/(LIKE\s*'%'\s*\|\|)/gi, '$1')
      .replace(/(\|\|\s*'%')/gi, '$1');
  }

  private validateQuery(query: string, warnings: string[]): void {
    const forbiddenPatterns = [
      {
        pattern: /IN\s*\(@\w+\)/gi,
        message: 'Unconverted IN clauses detected',
      },
      { pattern: /WITH\s+\(NOLOCK\)/gi, message: 'SQL Server hints detected' },
      { pattern: /\+/g, message: 'String concatenation operators detected' },
      {
        pattern: /=\s*[01](?!\d)/g,
        message: 'Unconverted boolean literals detected',
      },
    ];

    // Check for dynamic ORDER BY
    if (query.includes('DYNAMIC_ORDER_PLACEHOLDER')) {
      warnings.push(
        'Dynamic ORDER BY requires application-level implementation',
      );
    }

    // Check for temporary tables
    if (query.includes('temp_')) {
      warnings.push('Temporary tables were converted with temp_ prefix');
    }

    // Check forbidden patterns
    forbiddenPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(query)) {
        warnings.push(`Validation warning: ${message}`);
      }
    });
  }
}
