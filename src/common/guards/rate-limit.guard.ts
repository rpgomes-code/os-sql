// src/common/guards/rate-limit.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TooManyRequestsException } from '../exceptions/too-many-requests.exception';

interface RateLimitRecord {
  endpointCounts: Map<string, number>;
  overallCount: number;
  resetTime: number;
}

const rateLimitStore: Map<string, RateLimitRecord> = new Map();

@Injectable()
export class RateLimitGuard implements CanActivate {
  private perEndpointLimit = parseInt(
    process.env.PER_ENDPOINT_LIMIT || '50',
    10,
  );
  private overallLimit = parseInt(process.env.OVERALL_LIMIT || '200', 10);

  private extractToken(request: any): string | null {
    // Check authorization header first (Swagger UI uses this)
    const authHeader = request.headers.authorization;
    if (authHeader) {
      // Split 'Bearer <token>'
      const [type, token] = authHeader.split(' ');
      if (type.toLowerCase() === 'bearer' && token) {
        return token;
      }
    }

    // Fallback to x-bearer-token header
    const xBearerToken = request.headers['x-bearer-token'];
    if (xBearerToken) {
      return xBearerToken;
    }

    return null;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      // Log the headers for debugging (be careful not to log sensitive data in production)
      const headers = { ...request.headers };
      delete headers.cookie; // Remove sensitive data
      console.log('Request headers:', headers);

      throw new UnauthorizedException(
        'Bearer token required. Please include a valid bearer token in the Authorization header.',
      );
    }

    const now = Date.now();
    let record = rateLimitStore.get(token);

    // Initialize or reset rate limit record if needed
    if (!record || now > record.resetTime) {
      record = {
        endpointCounts: new Map(),
        overallCount: 0,
        resetTime: now + 60 * 1000, // Reset counts every minute
      };
      rateLimitStore.set(token, record);
    }

    // Get endpoint information
    const endpoint = `${request.method} ${request.route.path}`;
    const countForEndpoint = record.endpointCounts.get(endpoint) || 0;

    // Check endpoint-specific rate limit
    if (countForEndpoint >= this.perEndpointLimit) {
      throw new TooManyRequestsException(
        `Rate limit exceeded for endpoint ${endpoint}. Please try again later.`,
      );
    }

    // Check overall rate limit
    if (record.overallCount >= this.overallLimit) {
      throw new TooManyRequestsException(
        'Overall API rate limit exceeded. Please try again later.',
      );
    }

    // Update rate limit counters
    record.endpointCounts.set(endpoint, countForEndpoint + 1);
    record.overallCount += 1;

    return true;
  }
}
