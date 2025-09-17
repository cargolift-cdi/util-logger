import { Injectable, NestMiddleware } from '@nestjs/common';
import { ModuleRef, ContextIdFactory } from '@nestjs/core';
import { LoggerContextService } from '../logger.service';

@Injectable()
export class APILoggerMiddleware implements NestMiddleware {
  constructor(private readonly moduleRef: ModuleRef) { }

  async use(req: any, res: any, next: Function) {
    // Resolve a request-scoped instance of LoggerContextService for this request
    const contextId = ContextIdFactory.getByRequest(req);
    const logger = await this.moduleRef.resolve(LoggerContextService, contextId, { strict: false });

    // Start timer
    const startHr = typeof process.hrtime.bigint === 'function' ? process.hrtime.bigint() : null;

    try {
      const url = req?.originalUrl || req?.url;

      if (!logger.isContextSet()) {
        logger.setContextRequest(req);
      }
      /*
       logger.setContext(
        {
          application: {
            name: 'unknown', 
            function: url,
            action: req?.method,
          },
        },
        req,
      );
      */

      // const currentApplication = logger.getContext().application || {};

      // Log de entrada (request)
      logger.info(`HTTP ${req?.method} ${url} [${res?.statusCode}] - Request received`, {
        application: {
          ...logger.getContext().application || {},
          action: 'request',
        },
        data: {
          request: {
            method: req?.method,
            path: url,
          },
          payload: this.safeBody(req?.body),
        },
      });

      res?.on?.('finish', () => {
        const endHr = typeof process.hrtime.bigint === 'function' ? process.hrtime.bigint() : null;
        const durationMs = startHr && endHr ? Number((endHr - startHr) / BigInt(1_000_000)) : undefined;
        logger.info(`HTTP ${req?.method} ${url} [${res?.statusCode}] - Response sent`, {
          application: {
            ...logger.getContext().application || {},
            action: 'response',
          },
          data: {
            response: {
              statusCode: res?.statusCode,
              durationMs,
              body: res?.json,
            },
            payload: this.safeBody(res?.json),
          },
        });
      });
    } catch {
      // Avoid blocking the request in case logging fails for any reason
    } finally {
      next();
    }
  }

  private safeBody(body: any) {
    if (!body || typeof body !== 'object') return body;
    const redact = new Set(['password', 'senha', 'token', 'access_token', 'authorization']);
    const out: Record<string, any> = Array.isArray(body) ? {} : {};
    try {
      const src = Array.isArray(body) ? { array: body } : body;
      for (const [k, v] of Object.entries(src)) {
        out[k] = redact.has(k.toLowerCase()) ? '***' : v;
      }
    } catch {
      return undefined;
    }
    return out;
  }
}
