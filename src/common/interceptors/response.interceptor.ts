import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((response: Record<string, unknown>) => {
        if (typeof response === "string") {
          return {
            success: true,
            message: response,
          };
        }
        return {
          success: true,
          ...response,
        };
      }),
    );
  }
}
