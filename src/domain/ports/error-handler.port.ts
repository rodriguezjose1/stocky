import { DomainException } from '../exceptions/domain-exception';

export interface ErrorHandlerPort {
  handleError(error: Error | DomainException): never;
}

export const ERROR_HANDLER_PORT = 'ERROR_HANDLER_PORT';
