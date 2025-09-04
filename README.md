# util-logger

Logger contextual para aplicações NestJS, com suporte a rastreamento, correlação e integração com Pino.

## Instalação

```bash
npm install @cargolift-cdi/util-logger
```

## Dependências

- `@nestjs/common`
- `pino`
- `uuid`

## Uso Básico

### 1. Importe o módulo no seu projeto

```typescript
import { LoggerModule } from 'middleware-api-logger';

@Module({
  imports: [LoggerModule],
  // ... outros módulos
})
export class AppModule {}
```

### 2. Injete o serviço onde desejar

```typescript
import { LoggerContextService } from 'middleware-api-logger';

@Injectable()
export class SomeService {
  constructor(private readonly logger: LoggerContextService) {}

  someMethod() {
    this.logger.info('Mensagem de log', { contexto: 'extra' });
  }
}
```

### 3. Defina o contexto (opcional)

```typescript
this.logger.setContext({
  correlation_id: uuidv4(),
  application: { name: 'my-app', function: 'myFunction' },
});
```

### 4. Log de erro de negócio

```typescript
this.logger.businessError('Erro de negócio', { code: 'INVALID_PAYLOAD' });
```

### 4. Log de erro da aplicação
```typescript
this.logger.error(`Erro ao conectar no banco de dados`, new Error('Erro de teste', { cause: 'Simulação de erro' }));
```

## Exemplo de configuração de ambiente

```env
LOG_LEVEL=info
NODE_ENV=development
```

## Estrutura do Log

O log gerado segue o padrão:

```json
{
  "level": 99,
  "time" : "...",
  "pid": 12096,
  "hostname": "...",
  "logType": "...",  
  "correlation_id": "...",
  "application": { 
    "name": "...",
    "function": "..."
   },
  "trace": [ ... ],
  "error": { ... },
  "message": "Mensagem de log"
}
```

Exemplos:
```json
{
    "level": 50,
    "time": 1756933652405,
    "pid": 12096,
    "hostname": "CGLN002439",
    "logType": "application",
    "correlation_id": "96da4eaa-59fe-4615-8f15-98dd156011c4",
    "application": {
        "name": "middleware-api-util",
        "function": "notification"
    },
    "trace": [
        {
            "name": "middleware-api-util.notification",
            "timestamp": "2025-09-03T21:07:27.927Z"
        }
    ],
    "error": {
        "stack": "Error: Erro de teste\n    at NotificationController.sendPushNotification (C:\\Cargolift\\Github\\middleware-api-util\\src\\notification\\notification.controller.ts:27:57)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async C:\\Cargolift\\Github\\middleware-api-util\\node_modules\\@nestjs\\core\\router\\router-execution-context.js:46:28\n    at async C:\\Cargolift\\Github\\middleware-api-util\\node_modules\\@nestjs\\core\\router\\router-proxy.js:9:17",
        "message": "Erro de teste",
        "cause": "Simula├º├úo de erro"
    },
    "message": "Notifica├º├úo enviada: Titulo:"
}
```

## Licença

MIT

---

Se quiser personalizar algum trecho, me avise!

# Build & Publish
```
npm run build
npm publish --access public
```

