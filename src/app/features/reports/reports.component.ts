import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { environment } from '../../../environment/environment';
import { ToastserviceService } from '../../core/services/toastservice.service';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

interface StageStatus {
  id: number;
  poId: number;
  stageId: number;
  tncAccepted: boolean;
  status: string;
  updatedAt: string;
  actionPendingWith?: string;
  statusText?: string;
}

interface PurchaseOrderData {
  vendName: string | null;
  id: number;
  pO_NO: string;
  poDescription: string;
  poType: number;
  incoterms: number;
  poTypeName: string | null;
  incotermName: string | null;
  contractualDeliveryDate: string;
  actualDeliveryDate: string;
  contactPersonName: string;
  contactPersonEmailId: string;
  contactNo: string | null;
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
  isDeleted: boolean;
  vendorId: number;
  poFilePath: string;
  vendorCode: string;
  reminderSent: boolean;
  stageStatuses: StageStatus[];
  uploadedDocumentFlow: any[];
}

// Report 1: STATUS OF PO STAGE
interface PoStageReportData {
  vendorName: string;
  vendorCode: string;
  poNumber: string;
  orderValue: string;
  stageCompleted: string;
  acdCcd: string;
  numberOfDaysComplete: number;
  remainingDays: string;
  cpbgDueDate: string;
  receiptOfShipping: string;
  dlpDueDate: string;
  orderStatus: string;
}

// Report 2: STATUS OF All POs
interface AllPosReportData {
  vendorName: string;
  vendorCode: string;
  purchaseOrders: string;
  orderValue: string;
  stageCompleted: string;
  acdCcd: string;
  numberOfDaysComplete: number;
  remainingDays: string;
  orderStatus: string;
}

// Report 3: STAGE WISE ACTIONS
interface StageWiseReportData {
  vendorName: string;
  vendorCode: string;
  purchaseOrders: string;
  orderValue: string;
  statusOfStage: string;
  action: string;
  pendingWith: string;
  dateOfReturnByUser: string;
  dateOfReceipt: string;
  acdCcd: string;
  numberOfDaysComplete: number;
  remainingDays: string;
  orderStatus: string;
}

@Component({
  selector: 'app-reports',
  standalone: false,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  reportForm!: FormGroup;
  vendors: any[] = [];
  purchaseOrders: any[] = [];
  vendorControl = new FormControl('');
  filteredVendors$ = new BehaviorSubject<any[]>([]);
  
  // AG-Grid properties
  public modules: Module[] = [ClientSideRowModelModule];
  
  // Data for different reports
  poStageRowData: PoStageReportData[] = [];
  allPosRowData: AllPosReportData[] = [];
  stageWiseRowData: StageWiseReportData[] = [];
  
  selectedPoData: PurchaseOrderData | null = null;
  reportTypes = [
    { value: 'po_stage', label: 'STATUS OF PO STAGE' },
    { value: 'all_pos', label: 'STATUS OF All POs' },
    { value: 'stage_wise', label: 'STAGE WISE ACTIONS' }
  ];

  // Column definitions for Report 1: STATUS OF PO STAGE
  poStageColumnDefs: ColDef[] = [
    {
      headerName: 'Vendor Name',
      field: 'vendorName',
      minWidth: 200,
      width: 250,
      headerTooltip: 'VENDOR NAME with vendor code',
      cellRenderer: (params: any) => {
        return `(${params.data.vendorCode})`;
      }
    },
    {
      headerName: 'PO Number',
      field: 'poNumber',
      minWidth: 150,
      width: 180,
      headerTooltip: 'SELECT PO FROM dropdown or enter PO Number'
    },
    {
      headerName: 'Order Value',
      field: 'orderValue',
      minWidth: 120,
      width: 140
    },
    {
      headerName: 'Stage Completed',
      field: 'stageCompleted',
      minWidth: 150,
      width: 170
    },
    {
      headerName: 'ACD/CCD',
      field: 'acdCcd',
      minWidth: 120,
      width: 140
    },
    {
      headerName: 'Days Complete',
      field: 'numberOfDaysComplete',
      minWidth: 120,
      width: 140,
      headerTooltip: 'Number of days completed from Actual Delivery Date(ACD/CCD)'
    },
    {
      headerName: 'Remaining Days',
      field: 'remainingDays',
      minWidth: 150,
      width: 180,
      headerTooltip: 'Remaining days- Delayed or in time'
    },
    {
      headerName: 'CPBG Due Date',
      field: 'cpbgDueDate',
      minWidth: 150,
      width: 170,
      headerTooltip: 'CPBG due date Received not'
    },
    {
      headerName: 'Shipping Docs',
      field: 'receiptOfShipping',
      minWidth: 150,
      width: 170,
      headerTooltip: 'Receipt of Shipping documents'
    },
    {
      headerName: 'DLP Due Date',
      field: 'dlpDueDate',
      minWidth: 130,
      width: 150
    },
    {
      headerName: 'Order Status',
      field: 'orderStatus',
      minWidth: 120,
      width: 140,
      headerTooltip: 'Order Status open/closed'
    }
  ];

  // Column definitions for Report 2: STATUS OF All POs
  allPosColumnDefs: ColDef[] = [
    {
      headerName: 'Vendor Name',
      field: 'vendorName',
      minWidth: 200,
      width: 250,
      headerTooltip: 'VENDOR NAME with vendor code',
      cellRenderer: (params: any) => {
        return `${params.data.vendorName} (${params.data.vendorCode})`;
      }
    },
    {
      headerName: 'Purchase Orders',
      field: 'purchaseOrders',
      minWidth: 150,
      width: 180
    },
    {
      headerName: 'Order Value',
      field: 'orderValue',
      minWidth: 120,
      width: 140
    },
    {
      headerName: 'Stage Completed',
      field: 'stageCompleted',
      minWidth: 150,
      width: 170
    },
    {
      headerName: 'ACD/CCD',
      field: 'acdCcd',
      minWidth: 120,
      width: 140
    },
    {
      headerName: 'Days Complete',
      field: 'numberOfDaysComplete',
      minWidth: 120,
      width: 140,
      headerTooltip: 'Number of days completed from Actual Delivery Date(ACD/CCD)'
    },
    {
      headerName: 'Remaining Days',
      field: 'remainingDays',
      minWidth: 150,
      width: 180,
      headerTooltip: 'Remaining days- Delayed or in time'
    },
    {
      headerName: 'Order Status',
      field: 'orderStatus',
      minWidth: 120,
      width: 140,
      headerTooltip: 'Order Status open/closed'
    }
  ];

  // Column definitions for Report 3: STAGE WISE ACTIONS
  stageWiseColumnDefs: ColDef[] = [
    {
      headerName: 'Vendor Name',
      field: 'vendorName',
      minWidth: 200,
      width: 250,
      headerTooltip: 'VENDOR NAME with vendor code',
      cellRenderer: (params: any) => {
        return `${params.data.vendorName} (${params.data.vendorCode})`;
      }
    },
    {
      headerName: 'Purchase Orders',
      field: 'purchaseOrders',
      minWidth: 150,
      width: 180
    },
    {
      headerName: 'Order Value',
      field: 'orderValue',
      minWidth: 120,
      width: 140
    },
    {
      headerName: 'Status of Stage',
      field: 'statusOfStage',
      minWidth: 150,
      width: 170,
      headerTooltip: 'Eg. LC'
    },
    {
      headerName: 'Action',
      field: 'action',
      minWidth: 200,
      width: 250
    },
    {
      headerName: 'Pending With',
      field: 'pendingWith',
      minWidth: 130,
      width: 150
    },
    {
      headerName: 'Date of Return by User/Vendor',
      field: 'dateOfReturnByUser',
      minWidth: 180,
      width: 200
    },
    {
      headerName: 'Date of Receipt',
      field: 'dateOfReceipt',
      minWidth: 130,
      width: 150
    },
    {
      headerName: 'ACD/CCD',
      field: 'acdCcd',
      minWidth: 120,
      width: 140
    },
    {
      headerName: 'Days Complete',
      field: 'numberOfDaysComplete',
      minWidth: 120,
      width: 140,
      headerTooltip: 'Number of days completed from Actual Delivery Date(ACD/CCD)'
    },
    {
      headerName: 'Remaining Days',
      field: 'remainingDays',
      minWidth: 150,
      width: 180,
      headerTooltip: 'Remaining days- Delayed or in time'
    },
    {
      headerName: 'Order Status',
      field: 'orderStatus',
      minWidth: 120,
      width: 140,
      headerTooltip: 'Order Status open/closed'
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
    headerClass: 'ag-header-cell-wrap-text',
    autoHeaderHeight: true
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastService: ToastserviceService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadVendors();
    this.setupVendorFilter();
    this.checkUserTypeAndSetVendor();
  }

  private initializeForm(): void {
    this.reportForm = this.fb.group({
      reportType: ['po_stage'],
      vendor: [''],
      po: [''],
      fromDate: [''],
      toDate: ['']
    });

    // Watch for report type changes
    this.reportForm.get('reportType')?.valueChanges.subscribe((reportType) => {
      this.clearAllData();
      this.handleReportTypeChange(reportType);
    });

    // Watch for PO changes for single PO report
    this.reportForm.get('po')?.valueChanges.subscribe((poId) => {
      const reportType = this.reportForm.get('reportType')?.value;
      if (reportType === 'po_stage' && poId) {
        this.fetchPurchaseOrderData(poId);
      }
    });

    // Watch for vendor changes for all POs reports
    this.reportForm.get('vendor')?.valueChanges.subscribe((vendor) => {
      const reportType = this.reportForm.get('reportType')?.value;
      if ((reportType === 'all_pos' || reportType === 'stage_wise') && vendor) {
        this.fetchAllPurchaseOrdersData(vendor.vendorCode);
      }
    });
  }

  private handleReportTypeChange(reportType: string): void {
    // Reset form fields based on report type
    const currentVendor = this.reportForm.get('vendor')?.value;
    
    if (reportType === 'po_stage') {
      // For single PO report, keep PO selection
      this.reportForm.patchValue({ fromDate: '', toDate: '' });
    } else if (reportType === 'all_pos' || reportType === 'stage_wise') {
      // For all POs reports, clear PO and load all POs for selected vendor
      this.reportForm.patchValue({ po: '' });
      if (currentVendor) {
        this.fetchAllPurchaseOrdersData(currentVendor.vendorCode);
      }
    }
  }

  private clearAllData(): void {
    this.poStageRowData = [];
    this.allPosRowData = [];
    this.stageWiseRowData = [];
    this.selectedPoData = null;
  }

  private setupVendorFilter(): void {
    this.vendorControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterVendors(value))
    ).subscribe(filtered => this.filteredVendors$.next(filtered));
  }

  private loadVendors(): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.toastService.showToast('error', 'Authentication token not found');
      return;
    }

    this.http.get<any[]>(`${environment.apiUrl}/v1/vendors`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: vendors => {
        this.vendors = vendors || [];
        this.filteredVendors$.next(this.vendors);
      },
      error: err => {
        console.error('Error fetching vendors:', err);
        this.toastService.showToast('error', 'Error loading vendors');
      }
    });
  }

  private filterVendors(value: string | null): any[] {
    if (!value || !this.vendors.length) return this.vendors;
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
      this.reportForm.patchValue({ vendor: selectedVendor, po: '' });
      this.vendorControl.setValue(selectedVendor, { emitEvent: false });
      
      const reportType = this.reportForm.get('reportType')?.value;
      if (reportType === 'po_stage') {
        this.onVendorChange(selectedVendor.vendorCode);
      } else {
        this.fetchAllPurchaseOrdersData(selectedVendor.vendorCode);
      }
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
    if (!token) {
      this.toastService.showToast('error', 'Authentication token not found');
      return;
    }

    const url = `${environment.apiUrl}/v1/PurchaseOrder/vendor/${vendorCode}`;
    const headers = { Authorization: `Bearer ${token}` };

    this.purchaseOrders = [];
    this.reportForm.patchValue({ po: '' });
    this.clearAllData();

    this.http.get<any[]>(url, { headers }).subscribe({
      next: response => {
        this.purchaseOrders = response || [];
        if (this.purchaseOrders.length === 0) {
          this.toastService.showToast('error', 'No purchase orders found for selected vendor');
        }
      },
      error: err => {
        console.error('Error fetching purchase orders:', err);
        this.toastService.showToast('error', 'No PO Found For Selected Vendor');
        this.purchaseOrders = [];
      }
    });
  }

  // Fetch single PO data for STATUS OF PO STAGE report
  private fetchPurchaseOrderData(poId: number): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.toastService.showToast('error', 'Authentication token not found');
      return;
    }

    const url = `${environment.apiUrl}/v1/PurchaseOrder/FilterPoData/${poId}`;
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<PurchaseOrderData>(url, { headers }).subscribe({
      next: response => {
        this.selectedPoData = response;
        this.processPoStageData(response);
      },
      error: err => {
        console.error('Error fetching PO data:', err);
        this.toastService.showToast('error', 'Error loading purchase order data');
        this.poStageRowData = [];
        this.selectedPoData = null;
      }
    });
  }
  

  // Fetch all POs data for STATUS OF All POs and STAGE WISE ACTIONS reports
 private fetchAllPurchaseOrdersData(vendorCode: string): void {
  const token = localStorage.getItem('authToken');
  if (!token) {
    this.toastService.showToast('error', 'Authentication token not found');
    return;
  }

    // API endpoint to get all POs for a vendor (adjust according to your API)
    const url = `${environment.apiUrl}/v1/PurchaseOrder/FilterPoData/0`;
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<PurchaseOrderData[]>(url, { headers }).subscribe({
      next: response => {
        const reportType = this.reportForm.get('reportType')?.value;
        if (reportType === 'all_pos') {
          this.processAllPosData(response);
        } else if (reportType === 'stage_wise') {
          this.processStageWiseData(response);
        }
      },
      error: err => {
        console.error('Error fetching all PO data:', err);
        this.toastService.showToast('error', 'Error loading purchase orders data');
        this.allPosRowData = [];
        this.stageWiseRowData = [];
      }
    });
  }

  private processPoStageData(poData: PurchaseOrderData): void {
    const vendor = this.reportForm.get('vendor')?.value;
    
    const actualDeliveryDate = new Date(poData.actualDeliveryDate);
    const today = new Date();
    const daysDifference = Math.floor((today.getTime() - actualDeliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const completedStages = poData.stageStatuses?.filter(stage => stage.status === 'Complete').length || 0;
    const totalStages = poData.stageStatuses?.length || 0;
    
    const contractualDate = new Date(poData.contractualDeliveryDate);
    const remainingDays = Math.floor((contractualDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const remainingStatus = remainingDays < 0 ? `Delayed by ${Math.abs(remainingDays)} days` : `${remainingDays} days remaining`;
    
    const orderStatus = completedStages === totalStages && totalStages > 0 ? 'Closed' : 'Open';
    const cpbgStatus = this.calculateCPBGStatus(poData.stageStatuses);
    const shippingStatus = this.calculateShippingStatus(poData.stageStatuses);

    const reportData: PoStageReportData = {
      vendorName: vendor?.companyName || 'N/A',
      vendorCode: poData.vendorCode || 'N/A',
      poNumber: poData.pO_NO || 'N/A',
      orderValue: 'To be calculated',
      stageCompleted: totalStages > 0 ? `Stage ${completedStages} of ${totalStages}` : 'No stages',
      acdCcd: this.formatDate(poData.actualDeliveryDate),
      numberOfDaysComplete: Math.max(0, daysDifference),
      remainingDays: remainingStatus,
      cpbgDueDate: cpbgStatus,
      receiptOfShipping: shippingStatus,
      dlpDueDate: this.formatDate(poData.contractualDeliveryDate),
      orderStatus: orderStatus
    };

    this.poStageRowData = [reportData];
  }

private processAllPosData(posData: PurchaseOrderData[]): void {
  this.allPosRowData = posData.map(poData => {
    const actualDeliveryDate = new Date(poData.actualDeliveryDate);
    const today = new Date();
    const daysDifference = Math.floor((today.getTime() - actualDeliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const completedStages = poData.stageStatuses?.filter(stage => stage.status === 'Complete').length || 0;
    const totalStages = poData.stageStatuses?.length || 0;
    
    const contractualDate = new Date(poData.contractualDeliveryDate);
    const remainingDays = Math.floor((contractualDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const remainingStatus = remainingDays < 0 ? `Delayed by ${Math.abs(remainingDays)} days` : `${remainingDays} days remaining`;
    
    const orderStatus = completedStages === totalStages && totalStages > 0 ? 'Closed' : 'Open';

    // Get vendor name from PO data instead of form selection
    const vendorName = this.getVendorNameByCode(poData.vendorCode) || poData.vendName || 'N/A';

    return {
      vendorName: vendorName,
      vendorCode: poData.vendorCode || 'N/A',
      purchaseOrders: poData.pO_NO || 'N/A',
      orderValue: 'To be calculated',
      stageCompleted: totalStages > 0 ? `Stage ${completedStages} of ${totalStages}` : 'No stages',
      acdCcd: this.formatDate(poData.actualDeliveryDate),
      numberOfDaysComplete: Math.max(0, daysDifference),
      remainingDays: remainingStatus,
      orderStatus: orderStatus
    };
  });
}

private processStageWiseData(posData: PurchaseOrderData[]): void {
  const stageWiseData: StageWiseReportData[] = [];
  
  posData.forEach(poData => {
    const actualDeliveryDate = new Date(poData.actualDeliveryDate);
    const today = new Date();
    const daysDifference = Math.floor((today.getTime() - actualDeliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const completedStages = poData.stageStatuses?.filter(stage => stage.status === 'Complete').length || 0;
    const totalStages = poData.stageStatuses?.length || 0;
    
    const contractualDate = new Date(poData.contractualDeliveryDate);
    const remainingDays = Math.floor((contractualDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const remainingStatus = remainingDays < 0 ? `Delayed by ${Math.abs(remainingDays)} days` : `${remainingDays} days remaining`;
    
    const orderStatus = completedStages === totalStages && totalStages > 0 ? 'Closed' : 'Open';

    // Get vendor name from PO data instead of form selection
    const vendorName = this.getVendorNameByCode(poData.vendorCode) || poData.vendName || 'N/A';

    // Create entries for each stage
    poData.stageStatuses?.forEach(stage => {
      const stageAction = this.getStageAction(stage);
      const pendingWith = this.getPendingWith(stage);
      
      stageWiseData.push({
        vendorName: vendorName,
        vendorCode: poData.vendorCode || 'N/A',
        purchaseOrders: poData.pO_NO || 'N/A',
        orderValue: 'To be calculated',
        statusOfStage: this.getStageTypeName(stage.stageId),
        action: stageAction,
        pendingWith: pendingWith,
        dateOfReturnByUser: this.formatDate(stage.updatedAt),
        dateOfReceipt: this.formatDate(stage.updatedAt),
        acdCcd: this.formatDate(poData.actualDeliveryDate),
        numberOfDaysComplete: Math.max(0, daysDifference),
        remainingDays: remainingStatus,
        orderStatus: orderStatus
      });
    });
  });
  
  this.stageWiseRowData = stageWiseData;
}

private getVendorNameByCode(vendorCode: string): string | null {
  const vendor = this.vendors.find(v => v.vendorCode === vendorCode);
  return vendor ? vendor.companyName : null;
}
  private getStageTypeName(stageId: number): string {
    // Map stage IDs to their names - adjust based on your business logic
    const stageNames: { [key: number]: string } = {
      1: 'LC',
      2: 'FF',
      3: 'CPBG',
      4: 'Shipping',
      5: 'Documentation',
      // Add more stages as needed
    };
    return stageNames[stageId] || `Stage ${stageId}`;
  }

  private getStageAction(stage: StageStatus): string {
    // Generate action description based on stage status
    if (stage.status === 'Complete') {
      return 'Completed';
    } else if (stage.status === 'InProgress') {
      return 'In Progress';
    } else {
      return 'No Action';
    }
  }

  private getPendingWith(stage: StageStatus): string {
    // Determine who the stage is pending with
    if (stage.status === 'Complete') {
      return 'N/A';
    } else if (stage.tncAccepted) {
      return 'User';
    } else {
      return 'Vendor';
    }
  }

  private calculateCPBGStatus(stageStatuses: StageStatus[]): string {
    const cpbgRelevantStages = stageStatuses?.filter(stage => 
      stage.stageId <= 3 && stage.status === 'Complete'
    ) || [];
    
    if (cpbgRelevantStages.length >= 2) {
      return 'Received';
    } else if (cpbgRelevantStages.length >= 1) {
      return 'Partially Received';
    } else {
      return 'Not Received';
    }
  }

  private calculateShippingStatus(stageStatuses: StageStatus[]): string {
    const shippingRelevantStages = stageStatuses?.filter(stage => 
      stage.stageId >= 8 && stage.stageId <= 12 && stage.status === 'Complete'
    ) || [];
    
    if (shippingRelevantStages.length >= 3) {
      return 'Received';
    } else if (shippingRelevantStages.length >= 1) {
      return 'Partially Received';
    } else {
      return 'Pending';
    }
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  private checkUserTypeAndSetVendor(): void {
    const userType = localStorage.getItem('userType');
    const vendorId = localStorage.getItem('userId');

    if (userType === 'vendor' && vendorId) {
      const parsedVendorId = parseInt(vendorId, 10);
      if (!isNaN(parsedVendorId)) {
        this.loadVendorById(parsedVendorId);
      }
    }
  }

  private loadVendorById(vendorId: number): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.toastService.showToast('error', 'Authentication token not found');
      return;
    }

    const url = `${environment.apiUrl}/v1/vendors/${vendorId}`;
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any>(url, { headers }).subscribe({
      next: vendor => {
        if (vendor) {
          this.reportForm.patchValue({ vendor: vendor });
          this.vendorControl.setValue(vendor, { emitEvent: false });
          
          const reportType = this.reportForm.get('reportType')?.value;
          if (reportType === 'po_stage') {
            this.onVendorChange(vendor.vendorCode);
          } else {
            this.fetchAllPurchaseOrdersData(vendor.vendorCode);
          }
        }
      },
      error: err => {
        console.error('Error fetching vendor:', err);
        this.toastService.showToast('error', 'Error loading vendor');
      }
    });
  }

  onCancel(): void {
    this.reportForm.reset();
    this.reportForm.patchValue({ reportType: 'po_stage' });
    this.vendorControl.setValue('', { emitEvent: false });
    this.purchaseOrders = [];
    this.clearAllData();
    this.filteredVendors$.next(this.vendors);
  }

  // Get current report data based on selected report type
  getCurrentRowData(): any[] {
    const reportType = this.reportForm.get('reportType')?.value;
    switch (reportType) {
      case 'po_stage':
        return this.poStageRowData;
      case 'all_pos':
        return this.allPosRowData;
      case 'stage_wise':
        return this.stageWiseRowData;
      default:
        return [];
    }
  }

  // Get current column definitions based on selected report type
  getCurrentColumnDefs(): ColDef[] {
    const reportType = this.reportForm.get('reportType')?.value;
    switch (reportType) {
      case 'po_stage':
        return this.poStageColumnDefs;
      case 'all_pos':
        return this.allPosColumnDefs;
      case 'stage_wise':
        return this.stageWiseColumnDefs;
      default:
        return this.poStageColumnDefs;
    }
  }

  // Get current report title based on selected report type
  getCurrentReportTitle(): string {
    const reportType = this.reportForm.get('reportType')?.value;
    const reportTypeObj = this.reportTypes.find(rt => rt.value === reportType);
    return reportTypeObj ? reportTypeObj.label : 'Report';
  }

  // Check if current report type requires PO selection
  requiresPoSelection(): boolean {
    const reportType = this.reportForm.get('reportType')?.value;
    return reportType === 'po_stage';
  }

  // Check if current report type requires date range
  requiresDateRange(): boolean {
    const reportType = this.reportForm.get('reportType')?.value;
    return reportType === 'all_pos';
  }

  // Generate report based on current selections
  generateReport(): void {
    const reportType = this.reportForm.get('reportType')?.value;
    const vendor = this.reportForm.get('vendor')?.value;
    const po = this.reportForm.get('po')?.value;

    if (!vendor) {
      this.toastService.showToast('warning', 'Please select a vendor');
      return;
    }

    if (reportType === 'po_stage' && !po) {
      this.toastService.showToast('warning', 'Please select a purchase order');
      return;
    }

    // Data is already loaded through form change listeners
    const currentData = this.getCurrentRowData();
    if (currentData.length === 0) {
      this.toastService.showToast('error', 'No data available for the selected criteria');
    } else {
      this.toastService.showToast('success', `${currentData.length} records loaded successfully`);
    }
  }
}