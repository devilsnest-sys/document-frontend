// vendor-registration.service.ts

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

  /**
   * NEW METHOD - Validates email for EDIT mode
   * Checks if email is duplicate for other vendors (excludes current vendor being edited)
   * @param id - The vendor ID being edited
   * @param userType - Type of user (vendor)
   * @param email - Email to validate
   * @returns Observable with { isDuplicate: boolean, message: string }
   */
  validateEmail(id: number, userType: string, email: string): Observable<{ isDuplicate: boolean; message: string }> {
    const headers = this.getAuthHeaders();
    
    const payload = {
      id: id,
      userType: userType,
      email: email
    };

    return this.http.post<{ isDuplicate: boolean; message: string }>(
      `${environment.apiUrl}/v1/users/validate`,
      payload,
      { headers }
    );
  }

  checkUsernameExists(username: string, type: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(
        `${environment.apiUrl}/v1/vendors/check-username?username=${username}&type=${type}`
    );
  }

  // Get all vendors for the dropdown
  getAllVendors(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.registrationUrl}`, { headers });
  }

  // Get vendor details by ID
  getVendorById(vendorId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.registrationUrl}/${vendorId}`, { headers });
  }

  // Update existing vendor by ID
  updateVendor(vendorData: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.put<any>(`${this.registrationUrl}/${vendorData.id}`, vendorData, { headers });
  }

  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  generateNextVendorCode(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(
      `${this.registrationUrl}/generate-next-vendor-code`,
      { headers }
    );
  }
}