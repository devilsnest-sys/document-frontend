import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { environment } from '../../../../environment/environment';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

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
  vendorControl = new FormControl('');
  filteredVendors: Observable<any[]> | undefined;
  isSubmitting = false;

  constructor(private fb: FormBuilder, private http: HttpClient, private toastService: ToastserviceService, private router: Router) { }

  navigateToStep(step: number): void {
    const poNumber = this.vendorPoForm.get('po')?.value;
    if (poNumber) {
      this.router.navigate(['/stages', 'step' + step, poNumber]);
    }
  }

  ngOnInit(): void {
    this.vendorPoForm = this.fb.group({
      vendor: [''],
      po: ['']
    });

    this.loadVendors();

    // Set up the autocomplete filtering
    this.filteredVendors = this.vendorControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        console.log('Filter value:', value); // Debug log
        return this._filterVendors(value || '');
      })
    );

    // Listen to vendor form control changes
    this.vendorPoForm.get('vendor')?.valueChanges.subscribe(vendorId => {
      console.log('Selected vendor ID:', vendorId); // Debug log
      if (vendorId) {
        this.vendorPoForm.patchValue({ po: '' }, { emitEvent: false });
        this.onVendorChange(vendorId);
      }
    });
  }

  loadVendors(): void {
    const token = localStorage.getItem('authToken');
    const url = `${environment.apiUrl}/v1/vendors`;
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any[]>(url, { headers }).subscribe({
      next: (response) => {
        this.vendors = response;
        console.log('Loaded vendors:', this.vendors); // Debug log
      },
      error: (err) => {
        console.error('Error fetching vendors:', err);
        this.toastService.showToast('error','Error loading vendors');
      }
    });
  }

  private _filterVendors(value: string): any[] {
    console.log('Filtering vendors with value:', value); // Debug log
    const filterValue = value.toLowerCase();
    
    if (!filterValue) {
      return this.vendors;
    }

    return this.vendors.filter(vendor => {
      const vendorCode = vendor.vendorCode?.toLowerCase() || '';
      const companyName = vendor.companyName?.toLowerCase() || '';
      
      return vendorCode.includes(filterValue) || 
             companyName.includes(filterValue);
    });
  }
  


  onVendorSelect(event: any): void {
    console.log('Vendor select event:', event); // Debug log
    const selectedValue = event.option.value;
    console.log('Selected value:', selectedValue); // Debug log
    
    const selectedVendor = this.vendors.find(v => 
      v.vendorCode === selectedValue || 
      v.id === selectedValue
    );
    
    console.log('Found vendor:', selectedVendor); // Debug log

    if (selectedVendor) {
      this.vendorPoForm.patchValue({
        vendor: selectedVendor.id
      }, { emitEvent: true });

      this.vendorControl.setValue(
        `${selectedVendor.vendorCode} - ${selectedVendor.companyName}`,
        { emitEvent: false }
      );
    }
  }

  displayVendor(vendor: any): string {
    if (vendor) {
      if (typeof vendor === 'object') {
        return `${vendor.vendorCode} - ${vendor.companyName}`;
      }
      return vendor;
    }
    return '';
  }
  


  onVendorChange(vendorId: number): void {
    const token = localStorage.getItem('authToken');
    if (!vendorId) return;
    
    const url = `${environment.apiUrl}/v1/PurchaseOrder/vendor/${vendorId}`;
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    
    // Clear existing POs before loading new ones
    this.purchaseOrders = [];
    
    this.http.get<any[]>(url, { headers }).subscribe({
      next: (response) => {
        this.purchaseOrders = response;
      },
      error: (err) => {
        console.error('Error fetching purchase orders:', err);
        this.toastService.showToast('error','Error loading purchase orders');
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
