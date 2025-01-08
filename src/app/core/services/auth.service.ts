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

  constructor(private http: HttpClient) {}

  login(username: string, password: string, userType: string): Observable<any> {
    const payload = { username, password, userType };
    return this.http.post(this.loginUrl, payload);
  }

  setToken(token: string, userName: string, id: number): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userName', userName);
    localStorage.setItem('userId', id.toString());
    this.isLoggedInSubject.next(true);
    this.userNameSubject.next(userName);
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

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  clearToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    this.isLoggedInSubject.next(false);
    this.userNameSubject.next(null);
  }

  getLoginState(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  getUserNameState(): Observable<string | null> {
    return this.userNameSubject.asObservable();
  }
}
