import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class UtilService {
      getISTISOString(): string {
  const now = new Date();

  // IST = UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000;

  const istTime = new Date(now.getTime() + istOffset);

  return istTime.toISOString().replace('Z', ''); 
}
}