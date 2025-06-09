// src/app/core/http.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { LoaderService } from './services/loader-service.service';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  constructor(private loaderService: LoaderService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
     this.loaderService.showLoader();
    // Clone and modify the request to add custom headers
    const modifiedReq = request.clone({
      setHeaders: {
        'bypass-tunnel-reminder': 'true'
      }
    });
    return next.handle(modifiedReq).pipe(
      finalize(() => {
        this.loaderService.hideLoader();
      })
    );
  }
}
