# util-logger

Logger contextual para aplicações NestJS, com suporte a rastreamento, correlação e integração com Pino.

## Instalação

```bash
npm install @cargolift-cdi\util-logger
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
  application: { name: 'my-app', function: 'myFunction' },
  caller_info: { type: 'user', id: 'user-123' }
});
```

### 4. Log de erro de negócio

```typescript
this.logger.businessError('Erro de negócio', { code: 'INVALID_PAYLOAD' });
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
  "correlation_id": "...",
  "trace": [ ... ],
  "application": { ... },
  "caller_info": { ... },
  "error": { ... },
  "context": { ... },
  "message": "Mensagem de log"
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

