import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Shape: { data: T; error?: { code: string; message: string } }
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((value) => {
        // If already in ApiResponse shape, pass through
        if (value && typeof value === 'object' && 'data' in value) return value;
        // Otherwise, wrap in { data }
        return { data: value };
      }),
    );
  }
}
