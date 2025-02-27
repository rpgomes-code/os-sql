// src/modules/sql/sql-conversion.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class SqlConversionService {
  convertSqlServerToPostgres(query: string): string {
    let converted = query;

    // Phase 1: Core syntax conversion
    converted = this.convertSqlServerToBasic(converted);

    // Phase 2: PostgreSQL-specific adjustments
    converted = this.convertBasicToPostgres(converted);

    // Phase 3: Critical fixes
    converted = this.handleBooleanLiterals(converted);
    converted = this.convertBooleanComparisons(converted); // Add this line
    converted = this.fixEmptyStringChecks(converted);
    converted = this.cleanRedundantCasts(converted);
    converted = this.handleOrderBy(converted);
    converted = this.preserveNamedParameters(converted);
    converted = this.convertArrayParameters(converted);
    converted = this.convertLikeOperators(converted);
    converted = this.finalizeStringConcatenation(converted);

    this.validateQuery(converted);
    return converted;
  }

  private convertSqlServerToBasic(query: string): string {
    let converted = query;

    // Remove SQL Server specific syntax
    converted = converted
      .replace(/^\s*GO\s*$/gim, '')
      .replace(/WITH\s+\(NOLOCK\)/gi, '')
      .replace(/#(\w+)/g, 'temp_$1');

    // Handle identifiers
    converted = converted.replace(/\[([^\]]+)\]/g, (_, match) => {
      const parts = match.split('.');
      return parts.map((part) => `\`${part.trim()}\``).join('.');
    });

    // Convert temporal functions
    converted = converted
      .replace(/GETDATE\(\)/gi, 'CURRENT_TIMESTAMP')
      .replace(/GETUTCDATE\(\)/gi, 'UTC_TIMESTAMP()')
      .replace(/SYSDATETIME\(\)/gi, 'CURRENT_TIMESTAMP(6)');

    // Convert functions and data types
    converted = this.convertSpecificFunctions(converted);
    converted = this.convertDataTypes(converted);

    return converted;
  }

  private convertBasicToPostgres(query: string): string {
    let converted = query;

    // Convert MySQL-style identifiers to PostgreSQL
    converted = converted
      .replace(
        /(?:\bFROM|JOIN)\s+`([^`]+)`/gi,
        (_, match) => `FROM "${match.replace(/\./g, '"."')}"`,
      )
      .replace(/`([^`]+)`/g, '"$1"');

    // Handle string operations
    converted = this.handleStringComparisons(converted);

    // Convert functions and data types
    converted = this.convertPostgresFunctions(converted);
    converted = this.finalizeDataTypes(converted);

    return converted;
  }

  private handleBooleanLiterals(query: string): string {
    return (
      query
        // Convert numeric comparisons first to avoid false positives
        .replace(
          /(\bWHERE|\bAND|\bOR)\s+([\w.]+)\s*=\s*1(?!\d)/gi,
          '$1 $2 = TRUE',
        )
        .replace(
          /(\bWHERE|\bAND|\bOR)\s+([\w.]+)\s*=\s*0(?!\d)/gi,
          '$1 $2 = FALSE',
        )
        // Handle boolean parameters
        .replace(/(@\w+)\s*=\s*1(?!\d)/gi, '$1 IS TRUE')
        .replace(/(@\w+)\s*=\s*0(?!\d)/gi, '$1 IS FALSE')
    );
  }

  private fixEmptyStringChecks(query: string): string {
    return query
      .replace(/@(\w+)\s*=\s*''/g, "@$1 = ''")
      .replace(/@(\w+)\s*=\s*'\s*'/g, "@$1 = ''");
  }

  private cleanRedundantCasts(query: string): string {
    return query
      .replace(/::text/gi, '')
      .replace(/(LIKE\s*'%'\s*\|\|)/gi, '$1')
      .replace(/(\|\|\s*'%')/gi, '$1');
  }

  private handleOrderBy(query: string): string {
    return query
      .replace(/ORDER BY @\w+/gi, '/* DYNAMIC_ORDER_PLACEHOLDER */')
      .replace(/ORDER BY\s+\[\w+\]/gi, '/* DYNAMIC_ORDER_PLACEHOLDER */');
  }

  private preserveNamedParameters(query: string): string {
    return query.replace(/@(\w+)/g, (match) => {
      const param = match.substring(1);
      return `@${param}`;
    });
  }

  private convertArrayParameters(query: string): string {
    return (
      query
        // Convert IN (@param) to = ANY(@param)
        .replace(/(\w+)\s+IN\s*\(\s*@(\w+)\s*\)/gi, '$1 = ANY(@$2)')
        // Convert IN (@param1, @param2) to = ANY(ARRAY[@param1, @param2])
        .replace(/IN\s*\(\s*@(\w+)(\s*,\s*@\w+)*\s*\)/gi, '= ANY(ARRAY[@$1$2])')
    );
  }

  private convertBooleanComparisons(query: string): string {
    return query
      .replace(/=\s*TRUE/gi, 'IS TRUE')
      .replace(/=\s*FALSE/gi, 'IS FALSE');
  }

  private convertLikeOperators(query: string): string {
    return query.replace(
      /LIKE\s*'%'\s*\+\s*@(\w+)\s*\+\s*'%'/gi,
      "LIKE '%' || @$1 || '%'",
    );
  }

  private finalizeStringConcatenation(query: string): string {
    return query
      .replace(/([^\d\s])\s*\+\s*([^\d\s])/g, '$1 || $2')
      .replace(/(\w+)\s*\+\s*'/g, '$1 || ')
      .replace(/'\s*\+\s*(\w+)/g, ' || $1');
  }

  private convertSpecificFunctions(query: string): string {
    return query
      .replace(/ISNULL\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/gi, 'COALESCE($1, $2)')
      .replace(/LEN\(\s*([^)]+?)\s*\)/gi, 'CHAR_LENGTH($1)')
      .replace(/CHARINDEX\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/gi, 'STRPOS($2, $1)')
      .replace(
        /DATEADD\(\s*(\w+)\s*,\s*(-?\d+)\s*,\s*([^)]+?)\s*\)/gi,
        "$3 + INTERVAL '$2 $1'",
      )
      .replace(
        /IIF\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/gi,
        'CASE WHEN $1 THEN $2 ELSE $3 END',
      );
  }

  private convertDataTypes(query: string): string {
    return query.replace(
      /(?:CAST|CONVERT)\s*\(\s*(\w+)\s+AS\s+(\w+)\s*\)/gi,
      (match, expr, type) => `CAST(${expr} AS ${this.mapDataType(type)})`,
    );
  }

  private convertPostgresFunctions(query: string): string {
    return query
      .replace(/CURRENT_TIMESTAMP(\(\d+\))?/gi, 'NOW()')
      .replace(/UTC_TIMESTAMP\(\)/gi, "NOW() AT TIME ZONE 'UTC'");
  }

  private finalizeDataTypes(query: string): string {
    return query
      .replace(/NVARCHAR/gi, 'VARCHAR')
      .replace(/VARCHAR\(\d+\)/gi, 'TEXT')
      .replace(/DATETIME2?/gi, 'TIMESTAMP')
      .replace(/SMALLDATETIME/gi, 'TIMESTAMP(0)');
  }

  private handleStringComparisons(query: string): string {
    return query
      .replace(
        /(\w+)\s+LIKE\s+('.*?')/gi,
        'caseaccent_normalize($1) ILIKE caseaccent_normalize($2)',
      )
      .replace(/CONCAT\(([^)]+)\)/gi, (match, args) =>
        args
          .split(',')
          .map((p) => `COALESCE(${p.trim()}, '')`)
          .join(' || '),
      );
  }

  private mapDataType(sqlServerType: string): string {
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
    return typeMap[sqlServerType.toUpperCase()] || sqlServerType;
  }

  private validateQuery(query: string): void {
    const forbiddenPatterns = [
      /IN\s*\(@\w+\)/gi, // Unconverted IN clauses
      /WITH\s+\(NOLOCK\)/gi, // SQL Server hints
      /\+/g, // String concatenation operators
    ];

    forbiddenPatterns.forEach((pattern) => {
      if (pattern.test(query)) {
        throw new Error(
          `Validation failed: Found residual SQL Server pattern - ${pattern.source}`,
        );
      }
    });
  }
}
