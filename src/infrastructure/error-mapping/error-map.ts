// src/infrastructure/error-mapping/error-map.ts
import { HttpStatus } from '@nestjs/common';
import { InsufficientStockException } from '../../domain/exceptions/insufficient-stock.exception';

export interface ErrorMapping {
  status: HttpStatus;
  message: string | ((error: Error) => string);
}

export const errorMap: Map<new (...args: any[]) => Error, ErrorMapping> =
  new Map([
    [
      InsufficientStockException,
      { status: HttpStatus.BAD_REQUEST, message: (error) => error.message },
    ],
  ]);

export const defaultErrorMapping: ErrorMapping = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  message: 'An unexpected error occurred',
};
