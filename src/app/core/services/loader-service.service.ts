import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loadingSubject.asObservable();

  showLoader() {
    this.loadingSubject.next(true);
    // console.log("test success");
  }

  hideLoader() {
    this.loadingSubject.next(false);
  }
}
