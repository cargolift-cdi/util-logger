# Cargolift CDI Logger 📝

Biblioteca de log padronizada para aplicações NestJS da Cargolift. Construída sobre `nestjs-pino`, ela impõe uma estrutura de log consistente para facilitar o rastreamento, a análise e o monitoramento centralizado (ELK Stack).

## Funcionalidades

-   **Estrutura de Log Padronizada:** Garante que todos os logs contenham informações cruciais como `correlationId`, `application`, `caller`, e `trace`.
-   **Tipagem de Erros:** Diferencia entre `businessError` (falhas de validação, regras de negócio) e `application` (erros de infraestrutura, bugs).
-   **Rastreamento de Transações (Tracing):** Mantém um histórico de passos (`trace`) dentro de uma mesma requisição.
-   **Contexto por Requisição:** Utiliza o escopo `Scope.TRANSIENT` do NestJS para isolar o contexto de log para cada requisição.

## Instalação

A biblioteca requer que o projeto consumidor também tenha `nestjs-pino` e `pino-http` instalados.

```bash
npm install cargolift-cdi-logger nestjs-pino pino-http
```

## Configuração

Importe o `LoggerModule` do `nestjs-pino` no seu `AppModule` e configure-o para usar a nossa biblioteca como logger principal da aplicação.

**`app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { CdiLoggerModule } from 'cargolift-cdi-logger'; // Nossa biblioteca
import { v4 as uuidv4 } from 'uuid';

@Module({
  imports: [
    CdiLoggerModule, // Importe o nosso módulo
    LoggerModule.forRoot({
      pinoHttp: {
        // Gera um ID de requisição único para ser usado como correlationId
        genReqId: (req) => req.headers['x-correlation-id'] || uuidv4(),
        transport: {
          target: 'pino-pretty', // Em desenvolvimento, use um transport legível
          options: {
            singleLine: true,
            colorize: true,
          },
        },
        // Adicione outras configurações do pino aqui
        // Ex: Para enviar para o Logstash, configure o transport adequado
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## Como Usar

### 1. Criando um Interceptor para Injetar o Contexto (Recomendado)

A melhor forma de garantir que o contexto seja definido para cada requisição é usar um `Interceptor`.

**`logging.interceptor.ts`**

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CdiLoggerService, CdiLoggerContext } from 'cargolift-cdi-logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CdiLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable {
    const request = context.switchToHttp().getRequest();
    
    // Supondo que você tenha autenticação e possa extrair o usuário
    const user = request.user || { id: 'anonymous', type: 'system' };

    const loggerContext: CdiLoggerContext = {
      correlationId: request.id, // ID gerado pelo pinoHttp
      application: {
        module: 'register', // Defina o módulo dinamicamente se necessário
        function: context.getClass().name, // Nome do Controller
        action: context.getHandler().name, // Nome do método
      },
      caller: {
        type: user.type || 'user',
        id: user.id,
        details: {
          name: user.name,
          email: user.email,
        }
      },
      trace: {
        name: `Entry -> ${context.getClass().name}.${context.getHandler().name}`,
        timestamp: new Date().toISOString(),
      },
    };

    this.logger.setContext(loggerContext);

    return next.handle();
  }
}
```

Aplique este interceptor globalmente no seu `main.ts`:
```typescript
// main.ts
const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger)); // Usa o logger do nestjs-pino
app.useGlobalInterceptors(new LoggingInterceptor(app.get(CdiLoggerService)));
```


### 2. Usando o Logger em Serviços e Controllers

Após configurar o interceptor, o contexto já estará disponível. Apenas injete e use o `CdiLoggerService`.

**`driver.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { CdiLoggerService } from 'cargolift-cdi-logger';

@Injectable()
export class DriverService {
  constructor(private readonly logger: CdiLoggerService) {}

  async createDriver(driverData: any) {
    this.logger.info('Iniciando criação de motorista.', {
      driverCPF: driverData.cpf,
    });

    // 1. Adiciona um passo ao trace
    this.logger.addTraceStep('ValidatingCPF');
    if (!this.isValidCPF(driverData.cpf)) {
      // 2. Loga um erro de negócio
      this.logger.error(
        `CPF inválido: ${driverData.cpf}`, 
        { cpf: driverData.cpf },
        'businessError' // Tipo do erro
      );
      throw new Error('CPF fornecido é inválido.');
    }

    this.logger.addTraceStep('SavingToDatabase');
    try {
        //... lógica para salvar no banco ...
    } catch (dbError) {
        // 3. Loga um erro de aplicação
        this.logger.error(
            'Falha ao salvar motorista no banco de dados.', 
            { error: dbError.message, stack: dbError.stack },
            'application' // Tipo do erro
        );
        throw new Error('Erro interno ao processar a requisição.');
    }

    this.logger.addTraceStep('DriverCreationFinished');
    this.logger.info('Motorista criado com sucesso.', {
      resource_id: driverData.cpf, // Adiciona o resource_id ao payload
    });

    return { success: true };
  }

  private isValidCPF(cpf: string): boolean {
    // ... sua lógica de validação de CPF ...
    return cpf && cpf.length === 11;
  }
}
```

## Estrutura do JSON de Log de Saída

```json
{
  "level": "info",
  "timestamp": "...",
  "message": "Motorista criado com sucesso.",
  "correlationId": "req-1",
  "application": {
    "module": "register",
    "function": "DriverController",
    "action": "create",
    "resource_id": "12345678900"
  },
  "caller": { "type": "user", "id": "israel.possoli" },
  "errorType": "none",
  "trace": { "name": "DriverCreationFinished", "timestamp": "..." },
  "trace_string": "Entry -> ... -> ValidatingCPF -> SavingToDatabase -> DriverCreationFinished",
  "full_trace_history": [
      { "name": "Entry -> ...", "timestamp": "..." },
      { "name": "ValidatingCPF", "timestamp": "..." }
  ]
}
```