// dashboard-main.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { environment } from '../../../../environment/environment';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-main',
  standalone: false,
  templateUrl: './dashboard-main.component.html',
  styleUrl: './dashboard-main.component.css'
})
export class DashboardMainComponent {
//   stageNames: { [key: number]: string } = {
//   1: 'O.A',
//   2: 'CPBG',
//   3: 'LC Payment',
//   4: 'Document Upload',
//   5: 'Bank LC',
//   6: 'Shipping Details',
//   7: 'Dispatch Info',
//   8: 'Original Shipping',
//   9: 'Bank LC Upload',
//   10: 'Bank CAD',
//   11: 'Payment Advice',
//   12: 'Credit',
//   13: 'Document Entry',
//   14: 'Acceptance',
//   15: 'Final Approval'
// };

  steps: number[] = Array.from({ length: 15 }, (_, i) => i + 1);
  currentStep = 3;
  stepStatuses: { [key: number]: string } = {};

  vendorPoForm!: FormGroup;
  vendors: any[] = [];
  purchaseOrders: any[] = [];
  vendorControl = new FormControl('');
  filteredVendors$ = new BehaviorSubject<any[]>([]);
  isSubmitting = false;

  // Add this property to track the selected PO number
  selectedPoNumber: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastService: ToastserviceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadVendors();
    this.setupVendorFilter();

    // Auto-set vendor for vendors
    setTimeout(() => this.checkUserTypeAndSetVendor(), 500);
    
    // Fetch step statuses when PO changes
    this.vendorPoForm.get('po')?.valueChanges.subscribe((poValue) => {
      this.selectedPoNumber = poValue; // Update the selected PO number
      console.log('Selected PO Number:', this.selectedPoNumber); // Log it
      this.fetchStepStatuses();
    });
  }

  private initializeForm(): void {
    this.vendorPoForm = this.fb.group({
      vendor: [''],
      po: ['']
    });
  }

  private setupVendorFilter(): void {
    this.vendorControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterVendors(value))
    ).subscribe(filtered => this.filteredVendors$.next(filtered));
  }

  private loadVendors(): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;
  
    this.http.get<any[]>(`${environment.apiUrl}/v1/vendors`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: vendors => {
        this.vendors = vendors;
        this.filteredVendors$.next(this.vendors);
  
        // Restore selected vendor in case of page reload
        const selectedVendor = this.vendorPoForm.get('vendor')?.value;
        if (selectedVendor) {
          const foundVendor = this.vendors.find(v => v.id === selectedVendor.id);
          if (foundVendor) {
            this.vendorControl.setValue(foundVendor, { emitEvent: false });
          }
        }
      },
      error: err => {
        console.error('Error fetching vendors:', err);
        this.toastService.showToast('error', 'Error loading vendors');
      }
    });
  }

  private filterVendors(value: string | null): any[] {
    if (!value) return this.vendors;
    const filterValue = value.toLowerCase();
    return this.vendors.filter(vendor =>
      vendor.vendorCode?.toLowerCase().includes(filterValue) ||
      vendor.companyName?.toLowerCase().includes(filterValue)
    );
  }

  onVendorSelect(event: any): void {
    const selectedVendorId = event.option.value;
    const selectedVendor = this.vendors.find(v => v.id === selectedVendorId);
  
    if (selectedVendor) {
      this.vendorPoForm.patchValue({ vendor: selectedVendor });
      this.vendorControl.setValue(selectedVendor, { emitEvent: false });
      this.onVendorChange(selectedVendor.vendorCode);
      console.log(selectedVendor.companyName);
    }
  }   

  displayVendor(vendor: any): string {
    return vendor && vendor.vendorCode && vendor.companyName
      ? `${vendor.vendorCode} - ${vendor.companyName}`
      : '';
  }

  showAllVendors(): void {
    this.filteredVendors$.next(this.vendors);
  }

  onVendorChange(vendorCode: string | null): void {
    if (!vendorCode) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;
  
    const url = `${environment.apiUrl}/v1/PurchaseOrder/vendor/${vendorCode}`;
    const headers = { Authorization: `Bearer ${token}` };
  
    this.purchaseOrders = [];
  
    this.http.get<any[]>(url, { headers }).subscribe({
      next: response => {
        this.purchaseOrders = response;
      },
      error: err => {
        console.error('Error fetching purchase orders:', err);
        this.toastService.showToast('error', 'No PO Found For Selected Vendor');
      }
    });
  }  

  isStepBarVisible(): boolean {
    return !!(this.vendorPoForm.get('vendor')?.value && this.vendorPoForm.get('po')?.value);
  }

  navigateToStep(step: number): void {
    const poNumber = this.vendorPoForm.get('po')?.value;
    if (poNumber) {
      this.router.navigate(['/stages', `step${step}`, poNumber]);
    }
  }

  onCancel(): void {
    this.vendorPoForm.reset();
    this.purchaseOrders = [];
    this.selectedPoNumber = null; // Reset the selected PO number
  }

  private loadVendorById(vendorId: number): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;
  
    const url = `${environment.apiUrl}/v1/vendors/${vendorId}`;
    const headers = { Authorization: `Bearer ${token}` };
  
    this.http.get<any>(url, { headers }).subscribe({
      next: vendor => {
        if (vendor) {
          this.vendorPoForm.patchValue({ vendor: vendor });
          this.vendorControl.setValue(vendor, { emitEvent: false });
          this.onVendorChange(vendor.vendorCode); // Load POs for this vendor
        }
      },
      error: err => {
        console.error('Error fetching vendor:', err);
        this.toastService.showToast('error', 'Error loading vendor');
      }
    });
  }
  
  private checkUserTypeAndSetVendor(): void {
    const userType = localStorage.getItem('userType');
    const vendorId = localStorage.getItem('userId');

    if (userType === 'vendor' && vendorId) {
      this.loadVendorById(parseInt(vendorId, 10)); // Fetch vendor details directly
    }
  }

  private fetchStepStatuses(): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const poNumber = this.vendorPoForm.get('po')?.value;
    //const poNumber=1;
    const url = `${environment.apiUrl}/v1/StageStatus/StageStatusPo/${poNumber}`;
    
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        this.stepStatuses = response.reduce((acc: { [x: string]: any; }, stage: { stageId: string | number; status: any; }) => {
          acc[stage.stageId] = stage.status;
          return acc;
        }, {} as { [key: number]: string });
      },
      error: (err) => {
        console.error('Error fetching step statuses:', err);
      }
    });
  }

  getStepClass(i: number): string {
    const stepNumber = i + 1;
    const status = this.stepStatuses[stepNumber];
  
    if (status === 'Complete') {
      return 'completed';
    } else if (status === 'InProgress') {
      return 'current';
    } else {
      return 'pending';
    }
  }
}