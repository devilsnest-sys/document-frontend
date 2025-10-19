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
  cpbgDueDate?: string; // CPBG due date from PO
  dlpDueDate?: string; // DLP due date from PO registration
  shippingDate?: string; // Shipping date from PO
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
  dateOfReturnByVendor: string;
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
getCurrentRowData() {
throw new Error('Method not implemented.');
}
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
      headerTooltip: 'Number of days completed from Actual Delivery Date(ACD/CCD) to current date'
    },
    {
      headerName: 'Remaining Days',
      field: 'remainingDays',
      minWidth: 150,
      width: 180,
      headerTooltip: 'Remaining days from current date to shipping day - Delayed or in time'
    },
    {
      headerName: 'CPBG Due Date',
      field: 'cpbgDueDate',
      minWidth: 150,
      width: 170,
      headerTooltip: 'CPBG due date - Received or Not Received based on PO data'
    },
    {
      headerName: 'Shipping Docs',
      field: 'receiptOfShipping',
      minWidth: 150,
      width: 170,
      headerTooltip: 'Receipt of Shipping documents - Received if shipping document stage has documents'
    },
    {
      headerName: 'DLP Due Date',
      field: 'dlpDueDate',
      minWidth: 130,
      width: 150,
      headerTooltip: 'DLP due date taken from PO registration'
    },
    {
      headerName: 'Order Status',
      field: 'orderStatus',
      minWidth: 120,
      width: 140,
      headerTooltip: 'Order Status open/closed - Closed if DLP date is completed, otherwise Open'
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
      headerTooltip: 'Number of days completed from Actual Delivery Date(ACD/CCD) to current date'
    },
    {
      headerName: 'Remaining Days',
      field: 'remainingDays',
      minWidth: 150,
      width: 180,
      headerTooltip: 'Remaining days from current date to shipping day - Delayed or in time'
    },
    {
      headerName: 'Order Status',
      field: 'orderStatus',
      minWidth: 120,
      width: 140,
      headerTooltip: 'Order Status open/closed - Closed if DLP date is completed, otherwise Open'
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
      headerName: 'Date of Return by User',
      field: 'dateOfReturnByUser',
      minWidth: 180,
      width: 200,
      headerTooltip: 'Date when document was returned by User with document names (comma separated if multiple)'
    },
    {
      headerName: 'Date of Return by Vendor',
      field: 'dateOfReturnByVendor',
      minWidth: 180,
      width: 200,
      headerTooltip: 'Date when document was returned by Vendor with document names (comma separated if multiple)'
    },
    {
      headerName: 'Date of Receipt',
      field: 'dateOfReceipt',
      minWidth: 130,
      width: 150,
      headerTooltip: 'Shipping document date - when document type is receipt and approved'
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
      headerTooltip: 'Number of days completed from Actual Delivery Date(ACD/CCD) to current date'
    },
    {
      headerName: 'Remaining Days',
      field: 'remainingDays',
      minWidth: 150,
      width: 180,
      headerTooltip: 'Remaining days from current date to shipping day - Delayed or in time'
    },
    {
      headerName: 'Order Status',
      field: 'orderStatus',
      minWidth: 120,
      width: 140,
      headerTooltip: 'Order Status open/closed - Closed if DLP date is completed, otherwise Open'
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
  checkUserTypeAndSetVendor() {
    throw new Error('Method not implemented.');
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
    
    // Updated calculation logic based on requirements
    const actualDeliveryDate = new Date(poData.actualDeliveryDate);
    const today = new Date();
    const shippingDate = poData.shippingDate ? new Date(poData.shippingDate) : null;
    const dlpDate = poData.dlpDueDate ? new Date(poData.dlpDueDate) : null;
    
    // 1. Number of days completed from ACD to current date
    const daysDifference = Math.floor((today.getTime() - actualDeliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // 2. Remaining days = current date to shipping day
    let remainingDaysText = 'N/A';
    if (shippingDate) {
      const remainingDays = Math.floor((shippingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      remainingDaysText = remainingDays < 0 ? `Delayed by ${Math.abs(remainingDays)} days` : `${remainingDays} days remaining`;
    }
    
    const completedStages = poData.stageStatuses?.filter(stage => stage.status === 'Complete').length || 0;
    const totalStages = poData.stageStatuses?.length || 0;
    
    // 3. CPBG due date - received or not received based on PO data
    const cpbgStatus = poData.cpbgDueDate ? 'Received' : 'Not Received';
    
    // 4. Receipt of shipping documents - check if shipping document stage has documents
    const shippingStatus = this.calculateShippingDocumentStatus(poData.stageStatuses, poData.uploadedDocumentFlow);
    
    // 5. DLP due date from PO registration
    const dlpDueDateText = poData.dlpDueDate ? this.formatDate(poData.dlpDueDate) : 'N/A';
    
    // 6. Order status - closed if DLP date is completed, otherwise open
    const orderStatus = this.calculateOrderStatus(dlpDate);

    const reportData: PoStageReportData = {
      vendorName: vendor?.companyName || 'N/A',
      vendorCode: poData.vendorCode || 'N/A',
      poNumber: poData.pO_NO || 'N/A',
      orderValue: 'To be calculated',
      stageCompleted: totalStages > 0 ? `Stage ${completedStages} of ${totalStages}` : 'No stages',
      acdCcd: this.formatDate(poData.actualDeliveryDate),
      numberOfDaysComplete: Math.max(0, daysDifference),
      remainingDays: remainingDaysText,
      cpbgDueDate: cpbgStatus,
      receiptOfShipping: shippingStatus,
      dlpDueDate: dlpDueDateText,
      orderStatus: orderStatus
    };

    this.poStageRowData = [reportData];
  }

private processAllPosData(posData: PurchaseOrderData[]): void {
  this.allPosRowData = posData.map(poData => {
    const actualDeliveryDate = new Date(poData.actualDeliveryDate);
    const today = new Date();
    const shippingDate = poData.shippingDate ? new Date(poData.shippingDate) : null;
    const dlpDate = poData.dlpDueDate ? new Date(poData.dlpDueDate) : null;
    
    // Updated calculation logic
    const daysDifference = Math.floor((today.getTime() - actualDeliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Remaining days = current date to shipping day
    let remainingDaysText = 'N/A';
    if (shippingDate) {
      const remainingDays = Math.floor((shippingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      remainingDaysText = remainingDays < 0 ? `Delayed by ${Math.abs(remainingDays)} days` : `${remainingDays} days remaining`;
    }
    
    const completedStages = poData.stageStatuses?.filter(stage => stage.status === 'Complete').length || 0;
    const totalStages = poData.stageStatuses?.length || 0;
    
    // Order status based on DLP completion
    const orderStatus = this.calculateOrderStatus(dlpDate);

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
      remainingDays: remainingDaysText,
      orderStatus: orderStatus
    };
  });
}

private processStageWiseData(posData: PurchaseOrderData[]): void {
  const stageWiseData: StageWiseReportData[] = [];
  
  posData.forEach(poData => {
    const actualDeliveryDate = new Date(poData.actualDeliveryDate);
    const today = new Date();
    const shippingDate = poData.shippingDate ? new Date(poData.shippingDate) : null;
    const dlpDate = poData.dlpDueDate ? new Date(poData.dlpDueDate) : null;
    
    // Updated calculation logic
    const daysDifference = Math.floor((today.getTime() - actualDeliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Remaining days = current date to shipping day
    let remainingDaysText = 'N/A';
    if (shippingDate) {
      const remainingDays = Math.floor((shippingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      remainingDaysText = remainingDays < 0 ? `Delayed by ${Math.abs(remainingDays)} days` : `${remainingDays} days remaining`;
    }
    
    const completedStages = poData.stageStatuses?.filter(stage => stage.status === 'Complete').length || 0;
    const totalStages = poData.stageStatuses?.length || 0;
    
    // Order status based on DLP completion
    const orderStatus = this.calculateOrderStatus(dlpDate);

    // Get vendor name from PO data instead of form selection
    const vendorName = this.getVendorNameByCode(poData.vendorCode) || poData.vendName || 'N/A';

    // Create entries for each stage
    poData.stageStatuses?.forEach(stage => {
      const stageAction = this.getStageAction(stage);
      const pendingWith = this.getPendingWith(stage);
      
      // 7. Date of return by User/Vendor with document names
      const returnInfo = this.getReturnInformation(stage, poData.uploadedDocumentFlow);
      
      // 8. Date of receipt - shipping document date when document type is receipt and approved
      const receiptDate = this.getReceiptDate(stage, poData.uploadedDocumentFlow);
      
      stageWiseData.push({
        vendorName: vendorName,
        vendorCode: poData.vendorCode || 'N/A',
        purchaseOrders: poData.pO_NO || 'N/A',
        orderValue: 'To be calculated',
        statusOfStage: this.getStageTypeName(stage.stageId),
        action: stageAction,
        pendingWith: pendingWith,
        dateOfReturnByUser: returnInfo.userReturn,
        dateOfReturnByVendor: returnInfo.vendorReturn,
        dateOfReceipt: receiptDate,
        acdCcd: this.formatDate(poData.actualDeliveryDate),
        numberOfDaysComplete: Math.max(0, daysDifference),
        remainingDays: remainingDaysText,
        orderStatus: orderStatus
      });
    });
  });
  
  this.stageWiseRowData = stageWiseData;
}

// Helper method to calculate order status based on DLP completion
private calculateOrderStatus(dlpDate: Date | null): string {
  if (!dlpDate) return 'Open';
  
  const today = new Date();
  return dlpDate <= today ? 'Closed' : 'Open';
}

// Helper method to calculate shipping document status
private calculateShippingDocumentStatus(stageStatuses: StageStatus[], uploadedDocuments: any[]): string {
  // Find shipping document stage (adjust stage ID based on your business logic)
  const shippingStages = stageStatuses?.filter(stage => 
    stage.stageId >= 8 && stage.stageId <= 12 // Assuming these are shipping related stages
  ) || [];
  
  // Check if there are uploaded documents for shipping stages
  const hasShippingDocuments = uploadedDocuments?.some(doc => 
    doc.stageId >= 8 && doc.stageId <= 12 && doc.status === 'Approved'
  );
  
  if (hasShippingDocuments && shippingStages.some(stage => stage.status === 'Complete')) {
    return 'Received';
  } else if (shippingStages.some(stage => stage.status === 'InProgress')) {
    return 'Partially Received';
  } else {
    return 'Pending';
  }
}

// Helper method to get return information for documents
private getReturnInformation(stage: StageStatus, uploadedDocuments: any[]): { userReturn: string, vendorReturn: string } {
  const stageDocuments = uploadedDocuments?.filter(doc => doc.stageId === stage.stageId) || [];
  
  const userReturns: string[] = [];
  const vendorReturns: string[] = [];
  
  stageDocuments.forEach(doc => {
    if (doc.returnedBy === 'User' && doc.returnDate) {
      const returnInfo = `${this.formatDate(doc.returnDate)} - ${doc.documentName || doc.fileName}`;
      userReturns.push(returnInfo);
    } else if (doc.returnedBy === 'Vendor' && doc.returnDate) {
      const returnInfo = `${this.formatDate(doc.returnDate)} - ${doc.documentName || doc.fileName}`;
      vendorReturns.push(returnInfo);
    }
  });
  
  return {
    userReturn: userReturns.length > 0 ? userReturns.join(', ') : 'N/A',
    vendorReturn: vendorReturns.length > 0 ? vendorReturns.join(', ') : 'N/A'
  };
}

// Helper method to get receipt date for shipping documents
private getReceiptDate(stage: StageStatus, uploadedDocuments: any[]): string {
  // Find shipping document with type 'receipt' that is approved
  const receiptDocument = uploadedDocuments?.find(doc => 
    doc.stageId === stage.stageId && 
    doc.documentType?.toLowerCase().includes('receipt') && 
    doc.status === 'Approved'
  );
  
  return receiptDocument && receiptDocument.approvedDate 
    ? this.formatDate(receiptDocument.approvedDate) 
    : 'N/A';
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
    6: 'Insurance',
    7: 'Customs',
    8: 'Shipping Documents',
    9: 'Bill of Lading',
    10: 'Invoice',
    11: 'Packing List',
    12: 'Certificate of Origin'
    // Add more stages as needed
  };
  return stageNames[stageId] || `Stage ${stageId}`;
}

private getStageAction(stage: StageStatus): string {
  // Generate action description based on stage status
  if (stage.status === 'Complete') {
    return 'Completed';
  } else if (stage.status === 'InProgress') {
    return 'In Progress - Pending approval';
  } else {
    return 'Draft document returned for correction';
  }
}

private getPendingWith(stage: StageStatus): string {
  // Determine who the stage is pending with
  if (stage.status === 'Complete') {
    return 'N/A';
  } else if (stage.actionPendingWith) {
    return stage.actionPendingWith;
  } else if (stage.tncAccepted) {
    return 'User';
  } else {
    return 'Vendor';
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
}