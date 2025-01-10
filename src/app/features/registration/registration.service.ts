import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private registrationUrl = `${environment.apiUrl}/v1/users`;

  constructor(private http: HttpClient) {}

  registerUser(payload: any, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(this.registrationUrl, payload, { headers });
  }
}
