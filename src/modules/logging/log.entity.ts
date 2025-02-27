// src/modules/logging/log.entity.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Log {
  @ApiProperty({ description: 'Unique identifier for the log entry' })
  @PrimaryGeneratedColumn('uuid')
  log_id: string;

  @ApiProperty({ description: 'Type of log (info, warning, success, error)' })
  @Column()
  log_type: string;

  @ApiProperty({ description: 'Endpoint where the log was generated' })
  @Column()
  log_endpoint: string;

  @ApiProperty({
    description: 'Unique identifier for the location generating the log',
  })
  @Column()
  log_location: string;

  @ApiProperty({ description: 'Owner of the log (system or user identifier)' })
  @Column()
  log_owner: string;

  @ApiProperty({
    description: 'Severity of the log (low, medium, high, critical)',
  })
  @Column()
  log_severity: string;

  @ApiProperty({ description: 'Short title for the log entry' })
  @Column()
  log_title: string;

  @ApiProperty({ description: 'Detailed message of the log' })
  @Column('text')
  log_message: string;

  @ApiProperty({ description: 'Timestamp when the log was created' })
  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
