# @cargolift-cdi/util-logger

Logger global para projetos NestJS da Cargolift.

## Instalação

```
npm install @cargolift-cdi/util-logger nestjs-pino
```

## Uso

```typescript
import { LoggingModule, Logging } from '@cargolift-cdi/util-logger';

@Module({
  imports: [LoggingModule],
})
export class AppModule {}
```

Depois, injete o serviço `Logging` onde precisar:

```typescript
constructor(private readonly logger: Logging) {}
```


# Build & Publish
```
npm run build
npm publish --access public
```
