// src/modules/sql/dto/analyze-sql.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class AnalyzeSqlDto {
  @ApiProperty({
    description: 'SQL dialect to analyze',
    enum: ['sql_server', 'azure', 'oracle', 'postgres'],
  })
  @IsString()
  @IsIn(['sql_server', 'azure', 'oracle', 'postgres'])
  dialect: string;

  @ApiProperty({ description: 'Full SQL query to analyze' })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description:
      'Analysis types to perform. If omitted or empty, defaults to all: performance, maintainability, syntax',
    isArray: true,
    enum: ['performance', 'maintainability', 'syntax'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(['performance', 'maintainability', 'syntax'], { each: true })
  analysis_type?: string[];
}
