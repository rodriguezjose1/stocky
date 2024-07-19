import { Module, Global } from '@nestjs/common';
import { LoggerMiddleware } from './logger.middleware';

@Global() // Indica que este módulo es global y puede ser importado en cualquier otro módulo
@Module({
  providers: [LoggerMiddleware],
  exports: [LoggerMiddleware], // Exporta el servicio para que esté disponible globalmente
})
export class LoggerModule {}
