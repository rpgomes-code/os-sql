// src/modules/bearer-token/bearer-token.module.ts
import { Module } from '@nestjs/common';
import { BearerTokenController } from './bearer-token.controller';
import { BearerTokenService } from './bearer-token.service';

@Module({
  providers: [BearerTokenService],
  controllers: [BearerTokenController],
  exports: [BearerTokenService],
})
export class BearerTokenModule {}
