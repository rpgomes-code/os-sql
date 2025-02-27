// src/common/filters/global-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggingService } from '../../modules/logging/logging.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggingService: LoggingService) {}

  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Create a unique log identifier
    const logId = uuidv4();

    const log = {
      log_id: logId,
      log_type: 'error',
      log_endpoint: `${request.method} ${request.url}`,
      log_location: uuidv4(), // unique identifier for the error location
      log_owner: 'system',
      log_severity: status >= 500 ? 'high' : 'low',
      log_title: exception.message || 'Internal Server Error',
      log_message: exception.stack || '',
      created_at: new Date(),
    };

    // Save the log using the LoggingService
    await this.loggingService.createLog(log);

    response.status(status).json(log);
  }
}
