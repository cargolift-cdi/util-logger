import { Injectable, LoggerService, LogLevel, Scope } from '@nestjs/common';
import pino, { Logger, TransportTargetOptions } from 'pino';
import { LogContext, LogTrace } from './logger.interface';
import { v4 as uuidv4 } from 'uuid';
import type { RabbitMQMessage } from '@cargolift-cdi/types';

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
        translateTime: 'SYS:dd/mm/yyyy HH:MM:ss.l',
        ignore: process.env.LOG_DEBUG_IGNORE || 'pid,hostname,trace,correlation_id,application,message',
        messageFormat: "{message}",
      },
    }
    this.pinoLogger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? transportOptions : undefined,
    });
  }

  /**
   * Define o contexto padrão para os logs.
   * @param req (Opcional) O objeto Request para extrair informações de contexto.
   */
  setDefaultContext(req?: any, rabbitMQMessage?: RabbitMQMessage): void {
    this.setContext(null, req, rabbitMQMessage);
  }

  /**
   * Define o contexto do log com base no objeto Request.
   * @param req O objeto Request para extrair informações de contexto.
   */
  setContextRequest(req: any): void {
    this.setContext(null, req);
  }

  /**
   * Define o contexto do log com base na mensagem RabbitMQ.
   * @param rabbitMQMessage A mensagem RabbitMQ para extrair informações de contexto.
   */
  setContextRabbitMQ(rabbitMQMessage: RabbitMQMessage): void {
    this.setContext(null, undefined, rabbitMQMessage);
  }


  /**
   * Define o contexto base para todos os logs subsequentes nesta instância.
   * Valida os campos obrigatórios.
   * @param context O contexto da transação/request.
   * @param req (Opcional) O objeto Request para extrair headers de rastreabilidade de logs como 'x-trace', 'x-correlation-id'.
   * @param rabbitMQMessage (Opcional) A mensagem AMQP (como RabbitMQ) para extrair headers de rastreabilidade de logs como 'x-trace', 'x-correlation-id'.
   */
  setContext(context?: LogContext, req?: any, rabbitMQMessage?: RabbitMQMessage): void {
    let trace: LogTrace[] = [];
    const xTrace = req?.headers?.['x-trace'] || rabbitMQMessage?.properties?.headers?.['x-trace'] as string | undefined;
    const xCorrelation = (req as any)?.correlationId || req?.headers?.['x-correlation-id'] || rabbitMQMessage?.properties?.headers?.['x-correlation-id'] as string | undefined;

    this.context = Object.assign(this.context, context);

    // Preserve existing correlation id if already set in service or provided in context or present on the request/headers
    this.context.correlation_id =
      this.context.correlation_id ||
      context?.correlation_id ||
      xCorrelation ||
      uuidv4();

    if (!this.context.application) {
      this.context.application = {
        name: process.env.npm_package_name,
        function: req?.originalUrl || req?.url || rabbitMQMessage?.fields?.routingKey || rabbitMQMessage?.properties?.headers?.pattern || 'unknown',
        action: req?.method || undefined,
      };
    }

    // Processa o cabeçalho 'x-trace' para rastreamento
    if (xTrace) {
      try {
        const traceObj = typeof xTrace === 'string' ? JSON.parse(xTrace) : xTrace;
        if (Array.isArray(traceObj)) {
          for (const item of traceObj) {
            if (item && typeof item === 'object') {
              trace.push(item);
            }
          }
        } else if (typeof traceObj === 'object' && traceObj !== null) {
          trace.push(traceObj);
        }
      } catch (e) {
        trace = [];
      }
    }

    // Adiciona novo registro ao trace
    trace.push({
      application: this.context.application.name,
      function: this.context.application.function,
      timestamp: new Date().toISOString(),
    });
    this.context.trace = trace;
    if (!this.context.trace) this.context.trace = [];

    // Persiste o contexto de log na requisição para consumidores posteriores (ex: filtros globais)
    if (req) {
      (req as any).correlationId = this.context.correlation_id;
      (req as any).logContext = { ...this.context };
    }
  }


  /**
   * Retorna uma cópia do contexto atual de logs (para uso por publishers/middleware).
   */
  getContext(): Partial<LogContext> {
    return { ...this.context };
  }

  /**
   * Verifica se o contexto de log está definido.
   * @returns 
   */
  isContextSet(): boolean {
    return !!(this.context && this.context.application && this.context.correlation_id);
  }

  /**
   * Constrói a estrutura de log a ser enviada para o sistema de logging.
   * @param message A mensagem de log.
   * @param logType O tipo de log (ex: "application", "business").
   * @param extraContext Contexto adicional a ser incluído no log.
   * @returns Um objeto representando a estrutura de log.
   */
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

  debug(message: string, extraContext?: Record<string, any>) {
    this.pinoLogger.debug(this.buildLog(message, 'application', extraContext));
  }

  log(message: any, ...optionalParams: any[]) {
    throw new Error('Method not implemented.');
  }

  error(message: string, error?: Record<string, any>, extraContext?: Record<string, any>) {
    let errorData = {};
    if (error) {
      try {
        errorData = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
      } catch (e) {
        errorData = { error: 'Failed to serialize error object' };
      }
    }

    this.pinoLogger.error(
      this.buildLog(
        message, 'application',
        {
          ...extraContext,
          error: errorData
        })
    );
  }

  warn(message: any, ...optionalParams: any[]) {
    throw new Error('Method not implemented.');
  }

  businessError(message: string, extraContext?: Record<string, any>) {
    this.pinoLogger.error(this.buildLog(message, 'business', extraContext));
  }
}

