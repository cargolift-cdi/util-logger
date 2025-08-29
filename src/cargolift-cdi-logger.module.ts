// logging.module.ts
import { Module, Global } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { CargoliftCDILogger } from './cargolift-cdi-logger.service';

// Usamos @Global() para que o ContextualLogger fique disponível
// para injeção em toda a aplicação sem precisar importar o LoggingModule
// em todos os outros módulos. É opcional, mas conveniente para um logger.
@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'middleware-service-email',
        // TODO: Produção
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        // level: 'info'

        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                  translateTime: 'SYS:dd/mm/yyyy HH:MM:ss',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
      },
    }),
  ],
  providers: [CargoliftCDILogger], // Disponibiliza o ContextualLogger para injeção
  exports: [CargoliftCDILogger],   // Exporta para que outros módulos possam usá-lo
})
export class CargoliftCDILoggerModule { }