import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdditionalFieldService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getStages(): Observable<{ id: number; name: string }[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/v1/stages`, { headers });
  }

  getAdditionalFields(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${environment.apiUrl}/v1/AdditionalField`, { headers });
  }

  getAdditionalFieldSelections(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${environment.apiUrl}/v1/additional-field-selection`, { headers });
  }

  updateFieldSelection(recordId: number, payload: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch(`${environment.apiUrl}/v1/additional-field-selection/${recordId}`, payload, { headers });
  }
}
