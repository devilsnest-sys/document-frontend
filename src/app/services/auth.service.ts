import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loginUrl = `${environment.apiUrl}/v1/users/login`;

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    const payload = { username, password };
    return this.http.post(this.loginUrl, payload);
  }

  setToken(token: string) {
    localStorage.setItem('authToken', token);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }
}
