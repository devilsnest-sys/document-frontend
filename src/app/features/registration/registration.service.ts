import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private registrationUrl = `${environment.apiUrl}/v1/users`;
  private stagesUrl = `${environment.apiUrl}/v1/stages`;
  apiUrl: any;
  constructor(private http: HttpClient) {}

  registerUser(payload: any, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(this.registrationUrl, payload, { headers });
  }

  getStages(): Observable<Array<{ id: number; stageName: string }>> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${localStorage.getItem('authToken')}`
    );
    return this.http.get<Array<{ id: number; stageName: string }>>(this.stagesUrl, { headers });
  }

  checkEmailExists(email: string, type: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(
      `${this.registrationUrl}/check-email?email=${encodeURIComponent(email)}&type=${type}`
    );
  }

  checkUsernameExists(username: string, type: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(
        `${this.registrationUrl}/check-username?username=${username}&type=${type}`
    );
}

// Add these methods to your existing RegistrationService

// Get all users for the dropdown
getAllUsers(): Observable<any[]> {
  const headers = this.getAuthHeaders();
  return this.http.get<any[]>(`${this.registrationUrl}`, { headers });
}

// Get user details by username
getUserByUsername(username: string): Observable<any> {
  const headers = this.getAuthHeaders();
  return this.http.get<any>(`${this.apiUrl}/${username}`, { headers });
}

// Update existing user
updateUser(userData: any, token: string): Observable<any> {
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
  
  return this.http.put<any>(`${this.apiUrl}/${userData.id}`, userData, { headers });
}

// Helper method to get auth headers
private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('authToken');
  return new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
}
  
}
