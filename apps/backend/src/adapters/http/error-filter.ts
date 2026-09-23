import {
  Catch,
  HttpException,
  type ExceptionFilter,
  type ArgumentsHost,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';
import { ApplicationError } from '../../domain/models';
@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';
    if (error instanceof ApplicationError) {
      code = error.code;
      message = error.message;
      status =
        code === 'NOT_FOUND' ? 404 : code === 'INVALID_INPUT' ? 400 : 503;
    } else if (error instanceof ZodError) {
      status = 400;
      code = 'INVALID_INPUT';
      message = 'Request validation failed.';
    } else if (error instanceof HttpException) {
      status = error.getStatus();
      code = 'HTTP_ERROR';
      message = error.message;
    } else {
      Logger.error(
        'Unhandled request error',
        error instanceof Error ? error.stack : undefined,
      );
    }
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({ code, message });
  }
}
