import { Injectable, LoggerService, LogLevel, Scope } from '@nestjs/common';
import pino, { Logger, TransportTargetOptions } from 'pino';
import { LogContext, LogTrace } from './logger.interface';
import { v4 as uuidv4 } from 'uuid';

/*
{
  "correlation_id": "a7b1c3d9-e4f5-4a6b-8c9d-0e1f2a3b4c5d",
  "trace": [
    {
      "name": "middleware-api-util.notification",
      "timestamp": "2025-09-03T14:14:55.443Z"
    },
    {
      "name": "middleware-api-util.email",
      "timestamp": "2025-09-03T14:14:55.443Z"
    }
  ],
  "application": {
    "name": "middleware-api-util",
    "function:": "notification",
    "action": "POST",
    "resourceId": "",
    "version": "1.2.3"
  },
  "caller_info": {
    "type": "user",
    "id": "user-123",
    "details": {
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  },
  "error": {
    "type": "business",
    "code": "INVALID_PAYLOAD",
    "message": "O campo 'destinatario' está faltando no payload.",
    "stack_trace": "Error: ... at ..."
  },
  "context": {
    "http": {
      "request": {
        "method": "post",
        "path": "/v1/emails"
      }
    },
    "payload": {
      "remetente": "exemplo@empresa.com",
      "assunto": "Teste"
    },
    "rabbitmq": {
      "queue": "email-queue",
      "message_id": "some-message-id"
    }
  }
}}*/



// @Injectable({ scope: Scope.TRANSIENT }) // TRANSIENT para criar uma nova instância por request/consumer
@Injectable({ scope: Scope.REQUEST })
export class LoggerContextService implements LoggerService {
  private pinoLogger: Logger;
  private context: Partial<LogContext> = {};

  constructor() {
    const transportOptions: TransportTargetOptions = {
      target: 'pino-pretty', // Para desenvolvimento. Em produção, isso deve ser removido
      options: {
        colorize: true,
        translateTime: 'UTC:dd/mm/yyyy HH:MM:ss.l',
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
   * @param req (Opcional) O objeto Request para extrair headers de rastreabilidade de logs como 'x-trace', 'x-correlation-id'.
   */
  setContext(context: LogContext, req?: Request): void {
    let trace: LogTrace[] = [];
    const xTrace = req?.headers['x-trace'];
    const xCorrelation = req?.headers['x-correlation-id'];

    if (xTrace) {
      try {
        const traceObj = typeof xTrace === 'string' ? JSON.parse(xTrace) : xTrace;
        if (typeof traceObj === 'object' && traceObj !== null) {
          trace.push(traceObj);
        }
      } catch (e) {
        trace = [];
      }
    }

    // Adiciona novo registro ao trace
    trace.push({
      name: context.application.name + '.' + context.application.function,
      timestamp: new Date().toISOString(),
    });

    this.context = Object.assign(this.context, context);
    this.context.correlation_id =  xCorrelation || uuidv4();
    this.context.trace = trace;
    if (!this.context.trace) this.context.trace = [];
  }

  private buildLog(message: string, logType: string, extraContext: Record<string, any> = {}) {
    return {
      logType: logType,
      ...this.context,
      ...extraContext,
      // timestamp: new Date().toISOString(),
      message,
    };
  }

  info(message: string, extraContext?: Record<string, any>) {
    this.pinoLogger.info(this.buildLog(message, 'application', extraContext));
  }

  log(message: any, ...optionalParams: any[]) {
    throw new Error('Method not implemented.');
  }

  error(message: string, error?: Record<string, any>, extraContext?: Record<string, any>) {
    this.pinoLogger.error(
      this.buildLog(
        message, 'application', 
        { 
          ...extraContext, error: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))) })
    );
  }

  warn(message: any, ...optionalParams: any[]) {
    throw new Error('Method not implemented.');
  }

  businessError(message: string, extraContext?: Record<string, any>) {
    this.pinoLogger.error(this.buildLog(message, 'business', extraContext));
  }


  /**
   * Adiciona um passo ao rastreamento (trace) da transação.
   * @param name - Nome descritivo do passo. Ex: "ValidatingDriverCPF"
   */
  /*
  addTraceStep(name: string) {
    if (!this.context.trace) {
      this.context.trace = [];
    }

    const step: TraceStep = {
      name,
      timestamp: new Date().toISOString(),
    };

    this.context.trace.push(step);
  }
*/

  /*
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
      */


}

