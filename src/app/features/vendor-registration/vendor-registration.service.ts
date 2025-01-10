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
}
