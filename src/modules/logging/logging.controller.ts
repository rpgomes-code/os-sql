// src/modules/logging/logging.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Log } from './log.entity';
import { LoggingService } from './logging.service';

@ApiTags('Logs')
@Controller('logs')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve Logs',
    description: 'Fetches all logs stored in the database.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of logs',
    type: [Log],
  })
  async getAllLogs() {
    return this.loggingService.findAll();
  }
}
