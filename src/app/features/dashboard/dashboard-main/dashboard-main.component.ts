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
  totalUsers: number;
  totalCompletedPOs: number;
  totalOverduePOs: number;
  totalPendingPOs: number;
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
  userId: string | null = null;

  // User assigned POs - NEW
  userAssignedPOs: any[] = [];
  isLoadingUserPOs = false;
  allUsers: any[] = [];
  selectedUserIdForPOs: string | null = null;

  // Dashboard statistics
  dashboardStats: DashboardStats = {
    totalPOs: 0,
    totalVendors: 0,
    totalUsers: 0,
    totalCompletedPOs: 0,
    totalOverduePOs: 0,
    totalPendingPOs: 0
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
    
    // Load user-specific data for non-vendor users
    if (!this.isVendorUser) {
      this.loadDashboardStats();
      this.loadAllUsers(); // NEW: Load all users for dropdown
      this.selectedUserIdForPOs = this.userId; // Set default to current user
      this.loadUserAssignedPOs(); // NEW
    }

    setTimeout(() => this.checkUserTypeAndSetVendor(), 500);
    
    this.vendorPoForm.get('po')?.valueChanges.subscribe((poValue) => {
      this.selectedPoNumber = poValue;
      this.fetchStepStatuses();
    });
  }

  private checkUserType(): void {
    this.userType = localStorage.getItem('userType');
    this.userId = localStorage.getItem('userId');
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

  // NEW: Load all POs assigned to a specific user
  private loadUserAssignedPOs(userIdToLoad?: string): void {
    const targetUserId = userIdToLoad || this.selectedUserIdForPOs || this.userId;
    
    if (!targetUserId) {
      console.warn('No userId found, skipping user PO load');
      return;
    }

    this.isLoadingUserPOs = true;
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.isLoadingUserPOs = false;
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const url = `${environment.apiUrl}/v1/PurchaseOrder/by-user/${targetUserId}`;

    this.http.get<any[]>(url, { headers }).subscribe({
      next: (pos) => {
        this.userAssignedPOs = pos;
        this.isLoadingUserPOs = false;
        console.log(`Loaded ${pos.length} POs for user ${targetUserId}`);
      },
      error: (err) => {
        console.error('Error loading user assigned POs:', err);
        this.toastService.showToast('error', 'Error loading assigned POs');
        this.isLoadingUserPOs = false;
        this.userAssignedPOs = [];
      }
    });
  }

  // NEW: Load all users for the dropdown
  private loadAllUsers(): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    const url = `${environment.apiUrl}/v1/users`;

    this.http.get<any[]>(url, { headers }).subscribe({
      next: (users) => {
        // Filter out vendor users and current user from the list
        this.allUsers = users.filter(user => 
          user.userType !== 'vendor' && user.id.toString() !== this.userId
        );
        console.log(`Loaded ${this.allUsers.length} users for filter`);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.toastService.showToast('error', 'Error loading users list');
      }
    });
  }

  // NEW: Handle user filter selection change
  onUserFilterChange(selectedUserId: string): void {
    this.selectedUserIdForPOs = selectedUserId;
    this.loadUserAssignedPOs(selectedUserId);
    
    // Get selected user name for toast message
    let userName = 'current user';
    if (selectedUserId === this.userId) {
      userName = 'your';
    } else {
      const selectedUser = this.allUsers.find(u => u.id.toString() === selectedUserId);
      if (selectedUser) {
        userName = selectedUser.name + "'s";
      }
    }
    
    this.toastService.showToast('warning', `Loading ${userName} POs...`);
  }

  // NEW: Navigate to a specific PO from user assigned list
  navigateToUserPO(po: any): void {
    // First, find and set the vendor
    const vendor = this.vendors.find(v => v.id === po.vendorId);
    if (vendor) {
      this.vendorPoForm.patchValue({ vendor: vendor });
      this.vendorControl.setValue(vendor, { emitEvent: false });
      
      // Load POs for this vendor
      this.onVendorChange(vendor.vendorCode);
      
      // Wait a bit for POs to load, then select the PO
      setTimeout(() => {
        this.vendorPoForm.patchValue({ po: po.id });
        
        // Navigate to stages view
        this.router.navigate(['/stages', 1, po.id]);
      }, 300);
    }
  }

  // NEW: Get PO status from stage statuses
  getPOStatus(po: any): string {
    return this.getOverallStatus(po.stageStatuses);
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
    next: (response) => {
      this.purchaseOrders = response;

      if (this.purchaseOrders.length === 0) {
        this.toastService.showToast('warning', 'No POs found for this vendor');
      }
    },
    error: err => {
      console.error('Error fetching purchase orders:', err);
      this.toastService.showToast('error', 'Error loading purchase orders');
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

  // Dashboard Methods
  private loadDashboardStats(): void {
    this.isLoadingStats = true;
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.isLoadingStats = false;
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any>(`${environment.apiUrl}/v1/users/summary`, { headers }).subscribe({
      next: (summary) => {
        this.dashboardStats = {
          totalPOs: summary.totalPurchaseOrders || 0,
          totalVendors: summary.totalVendors || 0,
          totalUsers: summary.totalUsers || 0,
          totalCompletedPOs: summary.totalCompletedPOs || 0,
          totalOverduePOs: summary.totalOverduePOs || 0,
          totalPendingPOs: summary.totalPendingPOs || 0
        };

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
    if (!token || !this.userId) {
      this.isLoadingStats = false;
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any[]>(`${environment.apiUrl}/v1/PurchaseOrder/by-user/${this.userId}`, { headers }).subscribe({
      next: (pos) => {
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
      .slice(0, 5);
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

  getVendorName(vendorId: number): string {
    const vendor = this.vendors.find(v => v.id === vendorId);
    return vendor ? vendor.companyName : 'Unknown';
  }

  calculateProgress(stageStatuses: any[]): number {
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

  getCompletionRate(): number {
    if (this.dashboardStats.totalPOs === 0) return 0;
    return Math.round((this.dashboardStats.totalCompletedPOs / this.dashboardStats.totalPOs) * 100);
  }

  getAveragePOsPerVendor(): number {
    if (this.dashboardStats.totalVendors === 0) return 0;
    return parseFloat((this.dashboardStats.totalPOs / this.dashboardStats.totalVendors).toFixed(1));
  }

  refreshDashboard(): void {
    this.loadVendors();
    if (!this.isVendorUser) {
      this.loadDashboardStats();
      this.loadAllUsers(); // NEW: Refresh users list
      this.loadUserAssignedPOs(); // NEW: Refresh user assigned POs
    }
    this.toastService.showToast('success', 'Dashboard refreshed');
  }

  navigateToPO(poNumber: string): void {
    const po = this.purchaseOrders.find(p => p.pO_NO === poNumber);
    if (po) {
      this.vendorPoForm.patchValue({ po: po.id });
    }
  }
}