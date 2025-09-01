// src/cargolift-logger.service.ts

import { Injectable, LoggerService, Scope } from '@nestjs/common';
import pino, { Logger, TransportTargetOptions } from 'pino';
import { CargoliftLogContext, ErrorType, TraceStep } from './interfaces';

@Injectable({ scope: Scope.TRANSIENT }) // TRANSIENT para criar uma nova instância por request/consumer
export class CargoliftCDILogger implements LoggerService {
  private pinoLogger: Logger;
  private context: Partial<CargoliftLogContext> = {};

  constructor() {
    const transportOptions: TransportTargetOptions = {
        target: 'pino-pretty', // Para desenvolvimento. Em produção, isso deve ser removido para cuspir JSON puro.
        options: {
            colorize: true,
            levelFirst: true,
            translateTime: 'UTC:dd/mm/yyyy HH:MM:ss.l'
        }
    }
    this.pinoLogger = pino({
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV !== 'production' ? transportOptions : undefined,
    });
  }

  /**
   * Define o contexto base para todos os logs subsequentes nesta instância.
   * Valida os campos obrigatórios.
   * @param context O contexto da transação/request.
   */
  setContext(context: Record<string, any>): void {
    // Validação de campos obrigatórios
    const requiredFields = [
      'correlationId',
      'application.module',
      'application.function',
      'application.action',
      'caller.type',
      'caller.id',
    ];
    
    for (const field of requiredFields) {
      const keys = field.split('.');
      let current: any = context;
      let path = '';
      for (const key of keys) {
        path = path ? `${path}.${key}` : key;
        if (current[key] === undefined || current[key] === null) {
          throw new Error(`[CargoliftCDILogger] Campo obrigatório ausente no contexto: ${path}`);
        }
        current = current[key];
      }
    }
    
    // Usamos 'Object.assign' para mesclar o novo contexto com qualquer um que já exista.
    // Isso permite chamadas sequenciais a setContext para enriquecer o log.
    this.context = Object.assign(this.context, context);

    if (!this.context.trace) this.context.trace = [];
    if (!this.context.trace_string) this.context.trace_string = '';
  }

  /**
   * Adiciona um passo ao rastreamento (trace) da transação.
   * @param name - Nome descritivo do passo. Ex: "ValidatingDriverCPF"
   */
  addTraceStep(name: string) {
    if (!this.context.trace) {
        this.context.trace = [];
    }

    const step: TraceStep = {
        name,
        timestamp: new Date().toISOString(),
    };

    this.context.trace.push(step);
    this.context.trace_string = this.context.trace.map(t => t.name).join(' -> ');
  }

  private mergePayload(message: string, payload: Record<string, any> = {}, errorType: ErrorType = 'none') {
    const finalPayload = {
      ...this.context,
      ...payload,
      errorType,
    };
    return { finalPayload, message };
  }

  log(message: string, context?: Record<string, any>) {
    const { finalPayload } = this.mergePayload(message, context);
    this.pinoLogger.info(finalPayload, message);
  }

  info(message: string, context?: Record<string, any>) {
    this.log(message, context);
  }

  // ===== MÉTODO CORRIGIDO =====
  error(message: string, traceOrContext?: string | Record<string, any>, context?: Record<string, any>) {
    let payload: Record<string, any> = {};

    // Verifica o segundo argumento
    if (typeof traceOrContext === 'object' && traceOrContext !== null) {
      payload = { ...payload, ...traceOrContext };
    } else if (typeof traceOrContext === 'string') {
      payload.stackTrace = traceOrContext;
    }

    // Verifica o terceiro argumento
    if (typeof context === 'object' && context !== null) {
      payload = { ...payload, ...context };
    }
    
    const isBusinessError = payload.errorType === 'businessError';
    const errorType: ErrorType = isBusinessError ? 'businessError' : 'application';
    
    const { finalPayload } = this.mergePayload(message, payload, errorType);
    this.pinoLogger.error(finalPayload, message);
  }
  // ============================

  warn(message: string, context?: Record<string, any>) {
    const { finalPayload } = this.mergePayload(message, context);
    this.pinoLogger.warn(finalPayload, message);
  }

  debug?(message: string, context?: Record<string, any>) {
    const { finalPayload } = this.mergePayload(message, context);
    this.pinoLogger.debug(finalPayload, message);
  }

  verbose?(message: string, context?: Record<string, any>) {
    const { finalPayload } = this.mergePayload(message, context);
    this.pinoLogger.trace(finalPayload, message);
  }

  /**
   * Loga um erro de negócio explícito (ex: validação de dados).
   * @param message A mensagem do erro.
   * @param context Contexto adicional para o log.
   */
  businessError(message: string, context: Record<string, any>) {
    this.error(message, { ...context, errorType: 'businessError' });
  }
}