// dashboard-main.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { environment } from '../../../../environment/environment';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import { Router } from '@angular/router';

interface DashboardStats {
  totalPOs: number;
  totalVendors: number;
  completedStages: number;
  pendingStages: number;
  overduePos: number;
  activePos: number;
  totalUsers?: number;
  totalCompletedPOs?: number;
  totalPendingPOs?: number;
}

interface POStatus {
  poNumber: string;
  vendorName: string;
  dueDate: Date;
  status: string;
  progress: number;
}

@Component({
  selector: 'app-dashboard-main',
  standalone: false,
  templateUrl: './dashboard-main.component.html',
  styleUrl: './dashboard-main.component.css'
})
export class DashboardMainComponent {
  steps: number[] = Array.from({ length: 15 }, (_, i) => i + 1);
  currentStep = 3;
  stepStatuses: { [key: number]: string } = {};

  vendorPoForm!: FormGroup;
  vendors: any[] = [];
  purchaseOrders: any[] = [];
  vendorControl = new FormControl('');
  filteredVendors$ = new BehaviorSubject<any[]>([]);
  isSubmitting = false;
  selectedPoNumber: string | null = null;

  // User type tracking
  isVendorUser = false;
  userType: string | null = null;

  // Dashboard statistics
  dashboardStats: DashboardStats = {
    totalPOs: 0,
    totalVendors: 0,
    completedStages: 0,
    pendingStages: 0,
    overduePos: 0,
    activePos: 0
  };

  recentPOs: POStatus[] = [];
  overduePOs: POStatus[] = [];
  isLoadingStats = false;

  stages = [
    { id: 1, stageName: 'OA' },
    { id: 2, stageName: 'CPBG' },
    { id: 3, stageName: 'LC' },
    { id: 4, stageName: 'Advance' },
    { id: 5, stageName: 'Drawing & QAP' },
    { id: 6, stageName: 'FF' },
    { id: 7, stageName: 'Draft Shipping' },
    { id: 8, stageName: 'Original Shipping' },
    { id: 9, stageName: 'Bank-LC' },
    { id: 10, stageName: 'Bank-CAD' },
    { id: 11, stageName: 'Bank-LSC' },
    { id: 12, stageName: 'Credit' },
    { id: 13, stageName: 'Imports Clearance' },
    { id: 14, stageName: 'Acceptance' },
    { id: 15, stageName: 'Payment' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastService: ToastserviceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkUserType();
    this.initializeForm();
    this.loadVendors();
    this.setupVendorFilter();
    
    // Only load dashboard stats for non-vendor users
    if (!this.isVendorUser) {
      this.loadDashboardStats();
    }

    setTimeout(() => this.checkUserTypeAndSetVendor(), 500);
    
    this.vendorPoForm.get('po')?.valueChanges.subscribe((poValue) => {
      this.selectedPoNumber = poValue;
      this.fetchStepStatuses();
    });
  }

  private checkUserType(): void {
    this.userType = localStorage.getItem('userType');
    this.isVendorUser = this.userType === 'vendor';
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
    this.selectedPoNumber = null;
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
          this.onVendorChange(vendor.vendorCode);
        }
      },
      error: err => {
        console.error('Error fetching vendor:', err);
        this.toastService.showToast('error', 'Error loading vendor');
      }
    });
  }
  
  private checkUserTypeAndSetVendor(): void {
    const vendorId = localStorage.getItem('userId');

    if (this.isVendorUser && vendorId) {
      this.loadVendorById(parseInt(vendorId, 10));
    }
  }

  private fetchStepStatuses(): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const poNumber = this.vendorPoForm.get('po')?.value;
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

  // New Dashboard Methods - Updated to use summary API
  private loadDashboardStats(): void {
    this.isLoadingStats = true;
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.isLoadingStats = false;
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch summary data from the new API
    this.http.get<any>(`${environment.apiUrl}/v1/users/summary`, { headers }).subscribe({
      next: (summary) => {
        // Map API response to dashboard stats
        this.dashboardStats = {
          totalPOs: summary.totalPurchaseOrders || 0,
          totalVendors: summary.totalVendors || 0,
          completedStages: 0, // Will be calculated from POs
          pendingStages: 0,   // Will be calculated from POs
          overduePos: summary.totalOverduePOs || 0,
          activePos: summary.totalPendingPOs || 0,
          totalUsers: summary.totalUsers || 0,
          totalCompletedPOs: summary.totalCompletedPOs || 0,
          totalPendingPOs: summary.totalPendingPOs || 0
        };

        // Load additional details for recent/overdue POs
        this.loadDetailedPOData();
      },
      error: (err) => {
        console.error('Error loading dashboard summary:', err);
        this.toastService.showToast('error', 'Error loading dashboard statistics');
        this.isLoadingStats = false;
      }
    });
  }

  private loadDetailedPOData(): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch all POs for detailed stats
    this.http.get<any[]>(`${environment.apiUrl}/v1/PurchaseOrder`, { headers }).subscribe({
      next: (pos) => {
        this.calculateStageStats(pos);
        this.identifyOverduePOs(pos);
        this.getRecentPOs(pos);
        this.isLoadingStats = false;
      },
      error: (err) => {
        console.error('Error loading detailed PO data:', err);
        this.isLoadingStats = false;
      }
    });
  }

  private calculateStageStats(pos: any[]): void {
    let completedCount = 0;
    let pendingCount = 0;

    pos.forEach(po => {
      if (po.stageStatuses) {
        const completed = po.stageStatuses.filter((s: any) => s.status === 'Complete').length;
        const pending = po.stageStatuses.filter((s: any) => s.status === 'Pending' || s.status === 'InProgress').length;
        
        completedCount += completed;
        pendingCount += pending;
      }
    });

    this.dashboardStats.completedStages = completedCount;
    this.dashboardStats.pendingStages = pendingCount;
  }

  private identifyOverduePOs(pos: any[]): void {
    const today = new Date();
    this.overduePOs = pos
      .filter(po => {
        if (!po.contractualDeliveryDate) return false;
        const dueDate = new Date(po.contractualDeliveryDate);
        return dueDate < today && po.stageStatuses?.some((s: any) => s.status !== 'Complete');
      })
      .map(po => ({
        poNumber: po.pO_NO,
        vendorName: this.getVendorName(po.vendorId),
        dueDate: new Date(po.contractualDeliveryDate),
        status: 'Overdue',
        progress: this.calculateProgress(po.stageStatuses)
      }))
      .slice(0, 5); // Show top 5 overdue
  }

  private getRecentPOs(pos: any[]): void {
    this.recentPOs = pos
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(po => ({
        poNumber: po.pO_NO,
        vendorName: this.getVendorName(po.vendorId),
        dueDate: new Date(po.contractualDeliveryDate),
        status: this.getOverallStatus(po.stageStatuses),
        progress: this.calculateProgress(po.stageStatuses)
      }));
  }

  private getVendorName(vendorId: number): string {
    const vendor = this.vendors.find(v => v.id === vendorId);
    return vendor ? vendor.companyName : 'Unknown';
  }

  private calculateProgress(stageStatuses: any[]): number {
    if (!stageStatuses || stageStatuses.length === 0) return 0;
    const completed = stageStatuses.filter(s => s.status === 'Complete').length;
    return Math.round((completed / stageStatuses.length) * 100);
  }

  private getOverallStatus(stageStatuses: any[]): string {
    if (!stageStatuses || stageStatuses.length === 0) return 'Not Started';
    if (stageStatuses.every(s => s.status === 'Complete')) return 'Completed';
    if (stageStatuses.some(s => s.status === 'InProgress')) return 'In Progress';
    return 'Pending';
  }

  getDaysOverdue(dueDate: Date): number {
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  refreshDashboard(): void {
    this.loadVendors();
    if (!this.isVendorUser) {
      this.loadDashboardStats();
    }
    this.toastService.showToast('success', 'Dashboard refreshed');
  }

  navigateToPO(poNumber: string): void {
    // Find the PO and set it in the form
    const po = this.purchaseOrders.find(p => p.pO_NO === poNumber);
    if (po) {
      this.vendorPoForm.patchValue({ po: po.id });
    }
  }
}