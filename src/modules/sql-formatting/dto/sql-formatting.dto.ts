// src/modules/sql-formatting/dto/sql-formatting.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SqlFormattingRequestDto {
  @ApiProperty({
    description: 'SQL query to format/minify (base64 encoded)',
    example: 'U0VMRUNUICogRlJPTSB7T3JnfS5bTmFtZV0gV0hFUkUgSUQgPSAxOw==',
  })
  @IsString()
  @IsNotEmpty()
  original_query: string;
}

export class SqlFormattingResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Formatted/Minified SQL query (base64 encoded)',
    example: 'U0VMRUNUICogRlJPTSB7T3JnfS5bTmFtZV0gV0hFUkUgSUQgPSAxOw==',
  })
  formatted_query: string;

  @ApiProperty({
    description: 'Array of warning messages about the formatting/minification',
    example: ['Some formatting rules could not be applied'],
    type: [String],
    required: false,
  })
  warnings?: string[];
}
