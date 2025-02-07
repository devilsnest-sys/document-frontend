import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loginUrl = `${environment.apiUrl}/v1/users/login`;
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  private userNameSubject = new BehaviorSubject<string | null>(this.getUserName());
  private userTypeSubject = new BehaviorSubject<string | null>(this.getUserType());

  constructor(private http: HttpClient) {}

  login(username: string, password: string, userType: string): Observable<any> {
    const payload = { username, password, userType };
    return this.http.post(this.loginUrl, payload);
  }

  setToken(token: string, userName: string, id: number, userType: any): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userName', userName);
    localStorage.setItem('userId', id.toString());
    localStorage.setItem('userType', userType);
    this.isLoggedInSubject.next(true);
    this.userNameSubject.next(userName);
    this.userTypeSubject.next(userType);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getUserName(): string | null {
    return localStorage.getItem('userName');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  getUserType(): string | null {
    return localStorage.getItem('userType');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  clearToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    this.isLoggedInSubject.next(false);
    this.userNameSubject.next(null);
    this.userTypeSubject.next(null);
  }

  getLoginState(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  getUserNameState(): Observable<string | null> {
    return this.userNameSubject.asObservable();
  }

  getUserTypeState(): Observable<string | null> {
    return this.userTypeSubject.asObservable();
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/request-reset`, { email });
  }

  resetPassword(email: string, otp: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/reset-password`, {
      email,
      otp,
      newPassword
    });
  }

}
