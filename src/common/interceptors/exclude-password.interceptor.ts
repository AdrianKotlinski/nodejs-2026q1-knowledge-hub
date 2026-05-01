import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

const strip = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(strip);
  if (obj && typeof obj === 'object' && 'password' in obj) {
    const copy = { ...obj };
    delete copy.password;
    return copy;
  }
  return obj;
};

@Injectable()
export class ExcludePasswordInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(strip));
  }
}
