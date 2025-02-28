// src/modules/sql/dto/convert-sql.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { NotEqual } from '../../../common/validators/not-equal.validator';

export class ConvertSqlDto {
  @ApiProperty({
    description: 'Source SQL dialect',
    enum: ['sql_server', 'azure', 'oracle', 'postgres'],
  })
  @IsString()
  @IsIn(['sql_server', 'azure', 'oracle', 'postgres'])
  from_dialect: string;

  @ApiProperty({
    description: 'Target SQL dialect (must be different from from_dialect)',
    enum: ['sql_server', 'azure', 'oracle', 'postgres'],
  })
  @IsString()
  @IsIn(['sql_server', 'azure', 'oracle', 'postgres'])
  @NotEqual('from_dialect', {
    message: 'from_dialect and to_dialect cannot be the same',
  })
  to_dialect: string;

  @ApiProperty({ description: 'Original SQL query to convert' })
  @IsString()
  original_query: string;
}
