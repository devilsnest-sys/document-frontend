// src/app/core/http.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clone and modify the request to add custom headers
    const modifiedReq = request.clone({
      setHeaders: {
        'bypass-tunnel-reminder': 'true'
      }
    });
    return next.handle(modifiedReq);
  }
}
