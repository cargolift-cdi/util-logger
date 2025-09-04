# Cargolift CDI Logger

Biblioteca de logging padronizada para aplicações NestJS da Cargolift, construída sobre o Pino.js. O objetivo é criar logs em formato JSON estruturado para facilitar a análise, o trace e a observabilidade em ferramentas como Logstash e Elasticsearch.

## Instalação

```bash
npm install cargoliftcdilogger
```

## Features

-   Logs em formato JSON estruturado.
-   Geração automática de `correlationId` para rastreamento de ponta a ponta.
-   Estrutura de `trace` para seguir o fluxo da requisição.
-   Contexto rico com informações da aplicação (`module`, `function`, `action`) e do chamador (`caller`).
-   Diferenciação clara entre erros de negócio (`businessError`) e erros de aplicação (`application`).
-   Fácil integração com o ecossistema NestJS.

## Uso Básico

A forma mais eficaz de usar o logger é configurá-lo globalmente na sua aplicação e usar um Middleware ou Interceptor para definir o contexto inicial de cada requisição.

### 1. Configurando o Logger na Aplicação

No seu arquivo `main.ts`, instrua o NestJS a usar sua implementação customizada do logger.

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CargoliftCDILogger } from 'cargoliftcdilogger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Desativamos o logger padrão do Nest para usar o nosso em todos os lugares
    bufferLogs: true, 
  });
  
  // Use a nossa implementação como o logger principal da aplicação
  app.useLogger(app.get(CargoliftCDILogger));
  
  await app.listen(3000);
}
bootstrap();
```

### 2. Criando um Middleware para Definir o Contexto

Um middleware é o local ideal para extrair headers (como `x-correlation-id`), gerar IDs e definir o contexto inicial do log para cada requisição recebida.

```typescript
// logging.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CargoliftCDILogger } from 'cargoliftcdilogger';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: CargoliftCDILogger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id']?.toString() || `api-${randomUUID()}`;

    // Exemplo de como pegar informações do caller (ex: de um token JWT decodificado)
    const userFromJwt = (req as any).user; // Supondo que um guard de autenticação já populou isso

    this.logger.setContext({
      correlationId,
      application: {
        module: 'unknown', // Pode ser definido ou sobrescrito depois, no controller/service
        function: 'unknown',
        action: 'unknown',
      },
      caller: {
        type: userFromJwt ? 'user' : 'api',
        id: userFromJwt ? userFromJwt.id : 'external-system',
        details: userFromJwt ? {
            name: userFromJwt.name,
            email: userFromJwt.email,
        } : undefined,
      },
    });

    this.logger.addTraceStep('RequestReceived');

    next();
  }
}
```

### 3. Usando o Logger em Controllers e Services

Agora, você pode injetar o `CargoliftCDILogger` em qualquer lugar e usá-lo. Como ele é `Scope.TRANSIENT`, cada requisição terá sua própria instância com seu próprio contexto.

```typescript
// driver.controller.ts
import { Controller, Post, Body, Inject } from '@nestjs/common';
import { CargoliftCDILogger, ApplicationInfo } from 'cargiliftcdilogger';

@Controller('drivers')
export class DriverController {
  private readonly appInfo: ApplicationInfo = {
    module: 'register',
    function: 'driver',
    action: 'create', // Ação default para este contexto
  };

  constructor(@Inject(CargoliftCDILogger) private readonly logger: CargoliftCDILogger) {
    // Sobrescreve parte do contexto inicial com informações específicas deste controller
    this.logger.setContext({ application: this.appInfo });
  }

  @Post()
  createDriver(@Body() driverData: any) {
    this.logger.addTraceStep('CreateDriverStarted');

    this.logger.info(`Tentando criar motorista com CPF: ${driverData.cpf}`, {
        application: { ...this.appInfo, resource_id: driverData.cpf }
    });

    try {
        if (!this.isValidCpf(driverData.cpf)) {
            // Este é um erro de validação, portanto, um "Business Error"
            this.logger.businessError('CPF inválido fornecido', {
                application: { ...this'appInfo, resource_id: driverData.cpf },
                validationDetails: 'O CPF não passou no algoritmo de validação.'
            });
            // throw new BadRequestException('CPF inválido');
        }

        // Lógica de criação do motorista...

        this.logger.addTraceStep('DriverCreatedSuccessfully');
        this⚫logger.log('Motorista criado com sucesso!', {
            application: { ...this.appInfo, resource_id: driverData.cpf }
        });

        return { message: 'Motorista criado!' };

    } catch (error) {
        // Erro inesperado, como falha no banco de dados. Um "Application Error"
        this.logger.error('Falha inesperada ao criar motorista', error.stack, {
            application: { ...this.appInfo, resource_id: driverData.cpf }
        });
        // throw new InternalServerErrorException('Erro interno');
    }
  }

  private isValidCpf(cpf: string): boolean {
    // Sua lógica de validação de CPF aqui
    return cpf && cpf.length === 11;
  }
}
```

### Exemplo de Saída do Log (JSON)

```json
{
  "level": "error",
  "timestamp": 1672531200000,
  "correlationId": "api-b7d1f8a0-4a8f-11ef-9a2c-0242ac120002",
  "trace_string": "RequestReceived -> CreateDriverStarted",
  "trace": [
    { "name": "RequestReceived", "timestamp": "2025-09-01T10:00:00.000Z" },
    { "name": "CreateDriverStarted", "timestamp": "2025-09-01T10:00:01.123Z" }
  ],
  "application": {
    "module": "register",
    "function": "driver",
    "action": "create",
    "resource_id": "12345678900"
  },
  "caller": {
    "type": "user",
    "id": "israel.possoli",
    "details": { "name": "Israel Possoli", "email": "israel.possoli@example.com" }
  },
  "errorType": "businessError",
  "validationDetails": "O CPF não passou no algoritmo de validação.",
  "message": "CPF inválido fornecido"
}

```


# Build & Publish
```
npm run build
npm publish --access public
```
