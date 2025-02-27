// src/modules/bearer-token/bearer-token.service.ts
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BearerTokenService {
  // In-memory token store: token -> expiration date
  private tokens: Map<string, Date> = new Map();

  generateToken(): { token: string; expiration: Date } {
    const token = uuidv4();
    const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // Valid for 24 hours
    this.tokens.set(token, expiration);
    return { token, expiration };
  }

  validateToken(token: string): boolean {
    const expiration = this.tokens.get(token);
    if (!expiration) return false;
    if (expiration < new Date()) {
      this.tokens.delete(token);
      return false;
    }
    return true;
  }

  revokeToken(token: string): boolean {
    return this.tokens.delete(token);
  }
}
