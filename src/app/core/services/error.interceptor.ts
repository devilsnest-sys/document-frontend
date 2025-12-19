import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoaderService } from './loader-service.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private loaderService: LoaderService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.loaderService.showLoader();
    
    const modifiedReq = request.clone({
      setHeaders: {
        'bypass-tunnel-reminder': 'true'
      }
    });

    return next.handle(modifiedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        let errorCode = '500';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
          errorCode = 'Client Error';
        } else {
          // Server-side error
          errorCode = error.status.toString();
          
          switch (error.status) {
            case 0:
              errorMessage = 'No Internet Connection';
              errorCode = 'Network Error';
              break;
            // case 400:
            //   errorMessage = 'Bad Request';
            //   break;
            case 401:
              errorMessage = 'Unauthorized - Please login again';
              // Optionally redirect to login
              // this.router.navigate(['/login']);
              break;
            // case 403:
            //   errorMessage = 'Access Forbidden';
            //   break;
            // case 404:
            //   errorMessage = 'Resource Not Found';
            //   break;
            case 500:
              errorMessage = 'Internal Server Error';
              break;
            case 503:
              errorMessage = 'Service Unavailable';
              break;
            default:
              errorMessage = error.error?.message || 'Something went wrong';
          }
        }

        // For critical errors, navigate to error page
        // if (error.status === 404 || error.status === 500 || error.status === 0) {
        //   this.router.navigate(['/error'], {
        //     state: { 
        //       message: errorMessage,
        //       code: errorCode 
        //     }
        //   });
        // }

        console.error('HTTP Error:', errorMessage);
        return throwError(() => error);
      }),
      finalize(() => {
        this.loaderService.hideLoader();
      })
    );
  }
}