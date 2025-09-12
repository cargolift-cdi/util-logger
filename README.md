# @cargolift-cdi/util-logger

Logger contextual para aplicações NestJS com rastreabilidade (trace), correlação entre serviços e integração com Pino. Inclui:
- Serviço de logger com escopo por request
- Middleware HTTP para logs de requisição/resposta
- Tipos/Interfaces para padronizar o contexto de logs

## Instalação

```bash
npm install @cargolift-cdi/util-logger
```

Peer dependency:
- @nestjs/common (v11+)

O pacote já traz pino/pino-pretty nas dependências.

## Exportações (APIs públicas)

Importe a partir do pacote:

```ts
import {
  LoggerModule,
  LoggerContextService,
  APILoggerMiddleware,
  // Tipos
  ApplicationInfo,
  CallerInfo,
  LogContext,
  LogTrace,
  Error as LogError,
  ErrorType,
} from '@cargolift-cdi/util-logger';
```

### LoggerModule
Módulo global opcional que fornece `LoggerContextService`.

### LoggerContextService (request-scoped)
Métodos principais:
- setDefaultContext(req?, rabbitMQMessage?)
- setContextRequest(req)
- setContextRabbitMQ(rabbitMQMessage)
- setContext(context?: LogContext, req?: any, rabbitMQMessage?: RabbitMQMessage)
- getContext(): Partial<LogContext>
- isContextSet(): boolean
- info(message: string, extraContext?: Record<string, any>)
- debug(message: string, extraContext?: Record<string, any>)
- error(message: string, error?: Record<string, any>, extraContext?: Record<string, any>)
- businessError(message: string, extraContext?: Record<string, any>)

Observações:
- `log()` e `warn()` não estão implementados e lançarão erro se chamados.
- O serviço é escopado por request (`Scope.REQUEST`). Cada requisição HTTP (ou contexto manual em consumers) possui seu próprio contexto de log.

### APILoggerMiddleware
Middleware que:
- Gera/propaga `correlation_id`
- Define contexto padrão a partir da requisição
- Loga evento de request (entrada) e response (saída) com duração em ms
- Redige campos sensíveis no body (`password`, `senha`, `token`, `access_token`, `authorization`)

### Tipos (interfaces)
- ApplicationInfo: { name: string; function?; action?; resource_id? }
- CallerInfo: { type: 'user' | 'api' | 'system'; id?; details? }
- LogTrace: { application: string; function: string; timestamp: string; name? }
- ErrorType: 'business' | 'application' | 'none'
- Error (LogError): { type: ErrorType; code: string; message: string; stack_trace? }
- LogContext: { correlation_id?; trace?; application?; caller_info?; error? }

## Uso rápido

### 1) Importar o módulo

```ts
import { Module } from '@nestjs/common';
import { LoggerModule } from '@cargolift-cdi/util-logger';

@Module({
  imports: [LoggerModule],
})
export class AppModule {}
```

### 2) Aplicar o middleware HTTP (opcional, recomendado)

```ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerModule, APILoggerMiddleware } from '@cargolift-cdi/util-logger';

@Module({ imports: [LoggerModule] })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(APILoggerMiddleware).forRoutes('*');
  }
}
```

### 3) Injetar e usar o serviço

```ts
import { Injectable } from '@nestjs/common';
import { LoggerContextService } from '@cargolift-cdi/util-logger';

@Injectable()
export class SomeService {
  constructor(private readonly logger: LoggerContextService) {}

  doWork() {
    // O middleware já definiu o contexto em requisições HTTP; em outros casos você pode setar manualmente.
    this.logger.info('Processando solicitação', { data: { foo: 'bar' } });
  }
}
```

### 4) Definir/propagar contexto manualmente (ex.: consumers RabbitMQ)

```ts
import { LoggerContextService } from '@cargolift-cdi/util-logger';
import type { RabbitMQMessage } from '@cargolift-cdi/types';

export class Consumer {
  constructor(private readonly logger: LoggerContextService) {}

  async handle(message: RabbitMQMessage) {
    this.logger.setContextRabbitMQ(message); // lê headers x-trace e x-correlation-id
    this.logger.info('Mensagem recebida', {
      data: { rabbitmq: { queue: message?.fields?.routingKey } },
    });
  }
}
```

### 5) Propagação entre serviços
- HTTP: envie/consuma headers `x-correlation-id` e `x-trace` (JSON array/objeto) nas requisições.
- AMQP: use `properties.headers['x-correlation-id']` e `properties.headers['x-trace']`.

Para emitir chamadas HTTP com o mesmo contexto:

```ts
import axios from 'axios';
import { LoggerContextService } from '@cargolift-cdi/util-logger';

async function callOtherService(logger: LoggerContextService) {
  const ctx = logger.getContext();
  await axios.get('https://service/endpoint', {
    headers: {
      'x-correlation-id': ctx.correlation_id,
      'x-trace': JSON.stringify(ctx.trace ?? []),
    },
  });
}
```

## Estrutura do log emitido

Shape base (simplificado):

```json
{
  "logType": "application | business",
  "correlation_id": "uuid",
  "application": { "name": "...", "function": "...", "action": "GET|POST|..." },
  "trace": [ { "application": "...", "function": "...", "timestamp": "ISO" } ],
  "message": "string",
  // + campos extra de "extraContext"
}
```

Exemplo (HTTP request):

```json
{
  "logType": "application",
  "correlation_id": "96da4eaa-59fe-4615-8f15-98dd156011c4",
  "application": { "name": "middleware-api-util", "function": "/v1/emails", "action": "POST" },
  "trace": [ { "application": "middleware-api-util", "function": "/v1/emails", "timestamp": "2025-09-03T21:07:27.927Z" } ],
  "message": "HTTP POST /v1/emails [200] - Request received",
  "data": { "http": { "request": { "method": "POST", "path": "/v1/emails" } } }
}
```

## Variáveis de ambiente (process.env)

- LOG_LEVEL
  - Descrição: nível de log do Pino
  - Valores: "fatal", "error", "warn", "info", "debug", "trace", "silent"
  - Default: "info"
- NODE_ENV
  - Descrição: quando `development`, habilita saída human-readable via `pino-pretty` (apenas para desenvolvimento)
  - Valores comuns: "development", "production", "test"
  - Default: não definido (trata como produção para transporte)
- LOG_DEBUG_IGNORE
  - Descrição: campos ignorados (ocultados) quando usando `pino-pretty`
  - Default: `pid,hostname,trace,correlation_id,application,message`
- npm_package_name
  - Descrição: nome do pacote (injetado automaticamente pelo npm em tempo de execução). Usado como fallback para `application.name` quando o contexto não define um nome
  - Como ajustar: defina manualmente `application.name` via `setContext` para sobrepor

Notas:
- Em produção, recomenda-se não usar `pino-pretty` (já é automaticamente desabilitado quando `NODE_ENV !== 'development'`).
- Você pode adicionar campos arbitrários em `extraContext` das chamadas de log.

## Exemplos de código

### Definindo contexto manual

```ts
logger.setContext({
  correlation_id: 'a7b1c3d9-e4f5-4a6b-8c9d-0e1f2a3b4c5d',
  application: { name: 'my-service', function: 'processOrder', action: 'POST' },
});
```

### Log de erro de negócio

```ts
logger.businessError('Falha na validação da NF-e', {
  error: { type: 'business', code: 'INVALID_PAYLOAD', message: "Campo 'destinatario' ausente" },
});
```

### Log de erro de aplicação (capturando Error)

```ts
try {
  throw new Error('Erro de teste');
} catch (e) {
  logger.error('Falha ao processar', e as Error, { origin: 'worker-x' });
}
```

## Boas práticas
- Propague `x-correlation-id` entre serviços sempre que possível.
- Use `extraContext` para anexar dados de negócio (sanitizados) úteis para depuração.
- Evite registrar payloads sensíveis. O middleware já redige alguns campos comuns.

## Licença
MIT
