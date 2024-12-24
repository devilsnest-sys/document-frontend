import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject  } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loginUrl = `${environment.apiUrl}/v1/users/login`;
  private vendorLoginUrl = `${environment.apiUrl}/v1/vendorusers/login`;
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn()); 

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    const payload = { username, password };
    return this.http.post(this.loginUrl, payload);
  }

  vendorLogin(username: string, password: string): Observable<any> {
    const payload = { username, password };
    return this.http.post(this.vendorLoginUrl, payload);
  }

  setToken(token: string): void {
    localStorage.setItem('authToken', token);
    this.isLoggedInSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }  

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  clearToken(): void {
    localStorage.removeItem('authToken');
    this.isLoggedInSubject.next(false);
  }

  getLoginState(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }
}
