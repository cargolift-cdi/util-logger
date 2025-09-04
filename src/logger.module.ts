import { Module, Global } from '@nestjs/common';
import { LoggerContextService } from './logger.service';

@Global() // Opcional: torna o logger disponível globalmente sem precisar importar o módulo
@Module({
  providers: [LoggerContextService],
  exports: [LoggerContextService],
})
export class LoggerModule {}