// src/modules/sql-migration/dto/sql-migration.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SqlMigrationRequestDto {
  @ApiProperty({
    description: 'SQL Server query to convert (base64 encoded)',
    example: 'U0VMRUNUICogRlJPTSB7T3JnfS5bTmFtZV0gTElLRSAnJWFzZCUn',
  })
  @IsString()
  @IsNotEmpty()
  original_query: string;
}

export class SqlMigrationResponseDto {
  @ApiProperty({
    description: 'Indicates if the conversion was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Converted PostgreSQL query (base64 encoded)',
    example:
      'U0VMRUNUICogRlJPTSB7T3JnfS5bTmFtZV0gV0hFUkUgY2FzZWFjY2VudF9ub3JtYWxpemUoW05hbWVdIGNvbGxhdGUgImRlZmF1bHQiKSBMSUtFIGNhc2VhY2NlbnRfbm9ybWFsaXplKCclYXNkJScpOw==',
  })
  converted_query: string;

  @ApiProperty({
    description: 'Array of warning messages about the conversion',
    example: ['Dynamic ORDER BY requires application-level implementation'],
    type: [String],
    required: false,
  })
  warnings?: string[];
}
