import {HttpInterceptor, HttpRequest, HttpHandler, HttpEvent,} from '@angular/common/http';
  import { Injectable } from '@angular/core';
  import { Observable } from 'rxjs';
  import { finalize } from 'rxjs/operators';
  import { LoaderService } from './loader-service.service';
  
  @Injectable()
  export class LoaderInterceptor implements HttpInterceptor {
    constructor(private loaderService: LoaderService) {}
  
    intercept(
      req: HttpRequest<any>,
      next: HttpHandler
    ): Observable<HttpEvent<any>> {
      this.loaderService.showLoader();
  
      return next.handle(req).pipe(
        finalize(() => {
          this.loaderService.hideLoader();
        })
      );
    }
  }
  