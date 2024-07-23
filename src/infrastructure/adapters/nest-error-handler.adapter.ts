// src/infrastructure/adapters/nest-error-handler.adapter.ts
import { Injectable, HttpException } from '@nestjs/common';
import { ErrorHandlerPort } from '../../domain/ports/error-handler.port';
import { errorMap, defaultErrorMapping } from '../error-mapping/error-map';

@Injectable()
export class NestErrorHandlerAdapter implements ErrorHandlerPort {
  handleError(error: Error): never {
    if (error instanceof HttpException) {
      throw error;
    }

    for (const [ErrorType, mapping] of errorMap) {
      if (error instanceof ErrorType) {
        const message =
          typeof mapping.message === 'function'
            ? mapping.message(error)
            : mapping.message;
        throw new HttpException(message, mapping.status);
      }
    }

    // Si no se encuentra un mapeo específico, usar el mapeo por defecto
    throw new HttpException(
      defaultErrorMapping.message,
      defaultErrorMapping.status,
    );
  }
}
