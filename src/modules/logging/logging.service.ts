// src/modules/logging/logging.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from './log.entity';

@Injectable()
export class LoggingService {
  constructor(
    @InjectRepository(Log)
    private logRepository: Repository<Log>,
  ) {}

  async createLog(logData: Partial<Log>): Promise<Log> {
    const log = this.logRepository.create(logData);
    return this.logRepository.save(log);
  }

  async findAll(): Promise<Log[]> {
    return this.logRepository.find();
  }
}
