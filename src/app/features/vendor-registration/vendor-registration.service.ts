import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class VendorService {
  private registrationUrl = `${environment.apiUrl}/v1/vendors`;

  constructor(private http: HttpClient) {}

  registerVendor(vendorData: any): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post(this.registrationUrl, vendorData, { headers });
  }

  bulkRegisterVendors(file: File): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
  
    const formData = new FormData();
    formData.append('excelFile', file, file.name);
  
    return this.http.post(`${environment.apiUrl}/v1/vendors/upload`, formData, { headers, responseType: 'text' });
  }
  checkEmailExists(email: string, type: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(
      `${environment.apiUrl}/v1/users/check-email?email=${encodeURIComponent(email)}&type=${type}`
    );
  }

  checkUsernameExists(username: string, type: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(
        `${environment.apiUrl}/v1/users/check-username?username=${username}&type=${type}`
    );
}
  
}
