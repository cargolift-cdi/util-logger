import { Injectable, Scope } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class CargoliftCDILogger {
  private context!: Record<string, any>;

  constructor(private readonly logger: PinoLogger) {}

  // Define o contexto para esta instância específica do logger
  setContext(context: Record<string, any>) {
    const requiredFields = ['correlationId', 'application', 'consumer'];
    for (const field of requiredFields) {
      if (!context[field]) {
        throw new Error(`O campo obrigatório '${field}' não foi informado em setContext.`);
      }
    }
    this.context = context;
    // Também podemos definir o contexto no pino para que ele apareça no prefixo
    this.logger.setContext(context.name);
  }

  info(message: string, data?: Record<string, any>, ...args: any[]) {
    this.logger.info({ ...this.context, data }, message, ...args);
  }

 
  error(error: Error, message?: string, ...args: any[]) {
    this.logger.error({ ...this.context, err: error }, message || error.message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.logger.warn({ ...this.context }, message, ...args);
  }

  debug(message: string, ...args: any[]) {
    this.logger.debug({ ...this.context }, message, ...args);
  }

  // Erro de negócio
  businessError(message: string, details?: any) {
    this.logger.warn({ ...this.context, errorType: 'business', ...details }, message);
  }

  criticalError(message: string, details?: any) {
    this.logger.error({ ...this.context, errorType: 'critical', ...details }, message);
  }
}