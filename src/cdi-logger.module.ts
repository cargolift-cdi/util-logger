// src/cdi-logger.module.ts

import { Module, Global } from '@nestjs/common';
import { CdiLoggerService } from './cdi-logger.service';

@Global() // Opcional: Torna o serviço disponível globalmente sem precisar importar o módulo
@Module({
  providers: [CdiLoggerService],
  exports: [CdiLoggerService],
})
export class CdiLoggerModule {}