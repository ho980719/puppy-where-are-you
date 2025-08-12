import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract message/code
    let message = 'Internal Server Error';
    let code: ErrorCode = ErrorCode.INTERNAL_ERROR;

    if (exception instanceof HttpException) {
      const res: any = exception.getResponse();
      // HttpException can carry string or object
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        message = res.message || message;
        code = (res.code as ErrorCode) || code;
      } else {
        message = exception.message || message;
      }
    } else if (exception && typeof exception === 'object' && 'message' in (exception as any)) {
      message = (exception as any).message || message;
    }

    // Map generic HttpStatus to default codes if not provided
    if (!code || code === ErrorCode.INTERNAL_ERROR) {
      switch (status) {
        case HttpStatus.BAD_REQUEST:
          code = ErrorCode.VALIDATION_ERROR;
          break;
        case HttpStatus.UNAUTHORIZED:
          code = ErrorCode.UNAUTHORIZED;
          break;
        case HttpStatus.FORBIDDEN:
          code = ErrorCode.FORBIDDEN;
          break;
        case HttpStatus.NOT_FOUND:
          code = ErrorCode.NOT_FOUND;
          break;
        case HttpStatus.CONFLICT:
          code = ErrorCode.CONFLICT;
          break;
        default:
          code = ErrorCode.INTERNAL_ERROR;
      }
    }

    response.status(status).json({
      data: null,
      error: { code, message },
    });
  }
}
