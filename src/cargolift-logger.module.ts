import { Module, Global } from '@nestjs/common';
import { CargoliftCDILogger } from './cargolift-logger.service';

@Global() // Opcional: torna o logger disponível globalmente sem precisar importar o módulo
@Module({
  providers: [CargoliftCDILogger],
  exports: [CargoliftCDILogger],
})
export class CargoliftCDILoggerModule {}