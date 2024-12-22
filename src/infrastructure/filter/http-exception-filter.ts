// src/infrastructure/filters/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    console.log(exception);

    const exceptionResponse: any = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const httpStatus = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = exceptionResponse.message || 'Internal server error';
    let errors = [];

    if (exception instanceof BadRequestException) {
      if (exceptionResponse.message && exceptionResponse.message.length <= 1) {
        message = exceptionResponse.message[0];
      } else {
        message = exceptionResponse.error;
        errors = exceptionResponse.errors;
      }
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message,
      code: exceptionResponse.code || undefined,
      errors: errors,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
