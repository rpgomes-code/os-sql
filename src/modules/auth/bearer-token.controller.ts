// src/modules/bearer-token/bearer-token.controller.ts
import { Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BearerTokenService } from './bearer-token.service';

@ApiTags('Bearer Token Authentication')
@Controller('auth')
export class BearerTokenController {
  constructor(private readonly bearerTokenService: BearerTokenService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate Bearer Token',
    description: 'Generates a new bearer token with a 24-hour expiration.',
  })
  @ApiResponse({
    status: 201,
    description: 'Token generated successfully.',
    schema: {
      example: {
        token: 'uuid-token',
        expires_in: 'Timestamp when the token is no longer valid',
      },
    },
  })
  generateToken() {
    const token = this.bearerTokenService.generateToken().token;
    const expires_in = this.bearerTokenService.generateToken().expiration;
    return { token, expires_in };
  }

  @Get('validate')
  @ApiOperation({
    summary: 'Validate Bearer Token',
    description: 'Checks if the provided bearer token is valid.',
  })
  @ApiQuery({
    name: 'token',
    description: 'The bearer token to validate',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
    schema: {
      example: { valid: true },
    },
  })
  validateToken(@Query('token') token: string) {
    const valid = this.bearerTokenService.validateToken(token);
    return { valid };
  }

  @Delete('revoke')
  @ApiOperation({
    summary: 'Revoke Bearer Token',
    description: 'Revokes the provided bearer token, making it invalid.',
  })
  @ApiQuery({
    name: 'token',
    description: 'The bearer token to revoke',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Token revoked',
    schema: {
      example: { revoked: true },
    },
  })
  revokeToken(@Query('token') token: string) {
    const revoked = this.bearerTokenService.revokeToken(token);
    return { revoked };
  }
}
