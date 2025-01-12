import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'; 
import { ToastserviceService } from '../../../core/services/toastservice.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard-main',
  standalone: false,
  
  templateUrl: './dashboard-main.component.html',
  styleUrl: './dashboard-main.component.css'
})
export class DashboardMainComponent {
  steps = Array(15).fill(0);
  currentStep = 3;

  vendorPoForm!: FormGroup;
  vendors: any[] = [];
  purchaseOrders: any[] = [];
  isSubmitting = false;

  constructor(private fb: FormBuilder, private http: HttpClient, private toastService: ToastserviceService) {}

  ngOnInit(): void {
    this.vendorPoForm = this.fb.group({
      vendor: [''],
      po: ['']
    });

    this.loadVendors();
  }

  loadVendors(): void {
    const token = localStorage.getItem('authToken');
    const url = `${environment.apiUrl}/v1/vendors`;
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    this.http.get<any[]>(url, { headers }).subscribe({
      next: (response) => {
        this.vendors = response;
      },
      error: (err) => {
        console.error('Error fetching vendors:', err);
      }
    });
  }

  onVendorChange(vendorId: number): void {
    const token = localStorage.getItem('authToken');
    if (!vendorId) return;
    const url = `${environment.apiUrl}/v1/PurchaseOrder/vendor/${vendorId}`;
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    this.http.get<any[]>(url, { headers }).subscribe({
      next: (response) => {
        this.purchaseOrders = response;
      },
      error: (err) => {
        console.error('Error fetching purchase orders:', err);
      }
    });
  }

  isStepBarVisible(): boolean {
    const vendorSelected = this.vendorPoForm.get('vendor')?.value;
    const poSelected = this.vendorPoForm.get('po')?.value;
    return !!(vendorSelected && poSelected);
  }

  onCancel(): void {
    this.vendorPoForm.reset();
    this.purchaseOrders = [];
  }
}
