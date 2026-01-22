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
  totalassignedstages: number;
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
  cpbgDueDate?: string;
  dlpDueDate?: string;
  shippingDate?: string;
  orderValue: string;
  remainingDays: string;
  daysComplete: number;
  isClosed: boolean;
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

// Report 4: ALL VENDORS LIST
interface AllVendorsReportData {
  vendorCode: string;
  companyName: string;
  contactNameTitle: string;
  contactEmail: string;
  contactPhone1: string;
  telephone: string;
  email: string;
  mailingAddress: string;
  website: string;
  generalDetails: string;
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
  allVendorsRowData: AllVendorsReportData[] = [];
  
  selectedPoData: PurchaseOrderData | null = null;
  reportTypes = [
    { value: 'po_stage', label: 'STATUS OF PO STAGE' },
    { value: 'all_pos', label: 'STATUS OF All POs' },
    { value: 'stage_wise', label: 'VENDOR WISE ACTIONS' },
    { value: 'all_vendors', label: 'ALL VENDORS LIST' }
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
        return `${params.data.vendorName} (${params.data.vendorCode})`;
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
      headerName: 'Shipping/Receive Date',
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
    // {
    //   headerName: 'Date of Receipt',
    //   field: 'dateOfReceipt',
    //   minWidth: 130,
    //   width: 150,
    //   headerTooltip: 'Shipping document date - when document type is receipt and approved'
    // },
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

  // Column definitions for Report 4: ALL VENDORS LIST
  allVendorsColumnDefs: ColDef[] = [
    {
      headerName: 'Vendor Code',
      field: 'vendorCode',
      minWidth: 120,
      width: 140,
      pinned: 'left'
    },
    {
      headerName: 'Company Name',
      field: 'companyName',
      minWidth: 200,
      width: 250,
      pinned: 'left'
    },
    {
      headerName: 'Contact Person',
      field: 'contactNameTitle',
      minWidth: 150,
      width: 180
    },
    {
      headerName: 'Vendor Registration Email',
      field: 'contactEmail',
      minWidth: 200,
      width: 220
    },
    {
      headerName: 'Contact Phone',
      field: 'contactPhone1',
      minWidth: 150,
      width: 170
    },
    {
      headerName: 'Office Phone',
      field: 'telephone',
      minWidth: 150,
      width: 170
    },
    {
      headerName: 'Company Email',
      field: 'email',
      minWidth: 200,
      width: 220
    },
    {
      headerName: 'Address',
      field: 'mailingAddress',
      minWidth: 250,
      width: 300
    },
    {
      headerName: 'Website',
      field: 'website',
      minWidth: 200,
      width: 220
    },
    {
      headerName: 'Details',
      field: 'generalDetails',
      minWidth: 200,
      width: 250
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
    // Implement based on your user type logic
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
    const currentVendor = this.reportForm.get('vendor')?.value;
    
    if (reportType === 'po_stage') {
      this.reportForm.patchValue({ fromDate: '', toDate: '' });
    } else if (reportType === 'all_pos' || reportType === 'stage_wise') {
      this.reportForm.patchValue({ po: '' });
      if (currentVendor) {
        this.fetchAllPurchaseOrdersData(currentVendor.vendorCode);
      }
    } else if (reportType === 'all_vendors') {
      this.fetchAllVendorsData();
    }
  }

  private clearAllData(): void {
    this.poStageRowData = [];
    this.allPosRowData = [];
    this.stageWiseRowData = [];
    this.allVendorsRowData = [];
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

  private fetchPurchaseOrderData(poId: number): void {
  const token = localStorage.getItem('authToken');
  if (!token) {
    this.toastService.showToast('error', 'Authentication token not found');
    return;
  }

  const vendor = this.reportForm.get('vendor')?.value;
  const fromDate = this.reportForm.get('fromDate')?.value;
  const toDate = this.reportForm.get('toDate')?.value;

  // Build query parameters
  const params: any = {};
  
  if (vendor?.id) {
    params.vendorId = vendor.id;
  }
  
  if (fromDate) {
    params.startDate = new Date(fromDate).toISOString();
  }
  
  if (toDate) {
    params.endDate = new Date(toDate).toISOString();
  }

  // Construct URL with query parameters
  const queryString = new URLSearchParams(params).toString();
  const url = `${environment.apiUrl}/v1/PurchaseOrder/FilterPoData/${poId}${queryString ? '?' + queryString : ''}`;
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

  private fetchAllPurchaseOrdersData(vendorCode: string): void {
  const token = localStorage.getItem('authToken');
  if (!token) {
    this.toastService.showToast('error', 'Authentication token not found');
    return;
  }

  const vendor = this.reportForm.get('vendor')?.value;
  const fromDate = this.reportForm.get('fromDate')?.value;
  const toDate = this.reportForm.get('toDate')?.value;
  const reportType = this.reportForm.get('reportType')?.value;

  // Build query parameters
  const params: any = {};
  
  if (vendor?.id) {
    params.vendorId = vendor.id;
  }
  
  if (reportType) {
    params.FlterType = reportType; // Note: keeping the typo from backend parameter name
  }
  
  if (fromDate) {
    params.startDate = new Date(fromDate).toISOString();
  }
  
  if (toDate) {
    params.endDate = new Date(toDate).toISOString();
  }

  // Construct URL with query parameters
  const queryString = new URLSearchParams(params).toString();
  const url = `${environment.apiUrl}/v1/PurchaseOrder/FilterPoData/0${queryString ? '?' + queryString : ''}`;
  const headers = { Authorization: `Bearer ${token}` };

  this.http.get<PurchaseOrderData[]>(url, { headers }).subscribe({
    next: response => {
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
private buildHttpParams(vendor: any, fromDate: string, toDate: string, filterType?: string): any {
  let params: any = {};
  
  if (vendor?.id) {
    params['vendorId'] = vendor.id.toString();
  }
  
  if (filterType) {
    params['FlterType'] = filterType;
  }
  
  if (fromDate) {
    params['startDate'] = new Date(fromDate).toISOString();
  }
  
  if (toDate) {
    params['endDate'] = new Date(toDate).toISOString();
  }
  
  return params;
}

  private fetchAllVendorsData(): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.toastService.showToast('error', 'Authentication token not found');
      return;
    }

    const url = `${environment.apiUrl}/v1/vendors`;
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any[]>(url, { headers }).subscribe({
      next: response => {
        this.processAllVendorsData(response);
      },
      error: err => {
        console.error('Error fetching vendors data:', err);
        this.toastService.showToast('error', 'Error loading vendors data');
        this.allVendorsRowData = [];
      }
    });
  }

  private processPoStageData(poData: PurchaseOrderData): void {
    const vendor = this.reportForm.get('vendor')?.value;
    
    const actualDeliveryDate = new Date(poData.actualDeliveryDate);
    const today = new Date();
    const shippingDate = poData.shippingDate ? new Date(poData.shippingDate) : null;
    const dlpDate = poData.dlpDueDate ? new Date(poData.dlpDueDate) : null;
    
    const daysDifference = Math.floor((today.getTime() - actualDeliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let remainingDaysText = 'N/A';
    if (shippingDate) {
      const remainingDays = Math.floor((shippingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      remainingDaysText = remainingDays < 0 ? `Delayed by ${Math.abs(remainingDays)} days` : `${remainingDays} days remaining`;
    }
    
    const completedStages = poData.stageStatuses?.filter(stage => stage.status === 'Complete').length || 0;
    const totalStages = poData.stageStatuses?.length || 0;
    
    const cpbgStatus = poData.cpbgDueDate ? 'Received' : 'Not Received';
    const shippingStatus = this.calculateShippingDocumentStatus(poData.stageStatuses, poData.uploadedDocumentFlow);
    const dlpDueDateText = poData.dlpDueDate ? this.formatDate(poData.dlpDueDate) : 'N/A';
    const orderStatus = completedStages === poData.totalassignedstages ? 'Completed' : 'In Progress';

    const reportData: PoStageReportData = {
      vendorName: vendor?.companyName || 'N/A',
      vendorCode: poData.vendorCode || 'N/A',
      poNumber: poData.pO_NO || 'N/A',
      orderValue: poData.orderValue,
      stageCompleted: totalStages > 0 ? `Stage ${completedStages} of ${poData.totalassignedstages}` : 'No stages',
      acdCcd: this.formatDate(poData.actualDeliveryDate),
      numberOfDaysComplete: poData.daysComplete,
      remainingDays: poData.remainingDays,
      cpbgDueDate: poData.cpbgDueDate
  ? this.formatDate(poData.cpbgDueDate)
  : 'N/A',
      receiptOfShipping: poData.shippingDate
  ? this.formatDate(poData.shippingDate)
  : 'N/A',
      dlpDueDate: poData.dlpDueDate
  ? this.formatDate(poData.dlpDueDate)
  : 'N/A',
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
      
      const daysDifference = Math.floor((today.getTime() - actualDeliveryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let remainingDaysText = 'N/A';
      if (shippingDate) {
        const remainingDays = Math.floor((shippingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        remainingDaysText = remainingDays < 0 ? `Delayed by ${Math.abs(remainingDays)} days` : `${remainingDays} days remaining`;
      }
      
      const completedStages = poData.stageStatuses?.filter(stage => stage.status === 'Complete').length || 0;
      const totalStages = poData.stageStatuses?.length || 0;
     // const orderStatus = this.calculateOrderStatus(dlpDate);
      const orderStatus = poData.isClosed ? 'Closed' : 'Open';
      const vendorName = this.getVendorNameByCode(poData.vendorCode) || poData.vendName || 'N/A';

      return {
        vendorName: vendorName,
        vendorCode: poData.vendorCode || 'N/A',
        purchaseOrders: poData.pO_NO || 'N/A',
        orderValue: poData.orderValue,
        stageCompleted: totalStages > 0 ? `Stage ${completedStages} of ${totalStages}` : 'No stages',
        acdCcd: this.formatDate(poData.actualDeliveryDate),
        numberOfDaysComplete: poData.daysComplete,
        remainingDays: poData.remainingDays,
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
      
      const daysDifference = Math.floor((today.getTime() - actualDeliveryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let remainingDaysText = 'N/A';
      if (shippingDate) {
        const remainingDays = Math.floor((shippingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        remainingDaysText = remainingDays < 0 ? `Delayed by ${Math.abs(remainingDays)} days` : `${remainingDays} days remaining`;
      }
      
      const completedStages = poData.stageStatuses?.filter(stage => stage.status === 'Complete').length || 0;
      const totalStages = poData.stageStatuses?.length || 0;
      //const orderStatus = this.calculateOrderStatus(dlpDate);
      const orderStatus = poData.isClosed ? 'Completed' : 'Open';
      const vendorName = this.getVendorNameByCode(poData.vendorCode) || poData.vendName || 'N/A';

      poData.stageStatuses?.forEach(stage => {
        const stageAction = this.getStageAction(stage);
        const pendingWith = this.getPendingWith(stage);
        const returnInfo = this.getReturnInformation(stage, poData.uploadedDocumentFlow);
        const receiptDate = this.getReceiptDate(stage, poData.uploadedDocumentFlow);
        
        stageWiseData.push({
          vendorName: vendorName,
          vendorCode: poData.vendorCode || 'N/A',
          purchaseOrders: poData.pO_NO || 'N/A',
          orderValue: poData.orderValue,
          statusOfStage: this.getStageTypeName(stage.stageId),
          action: stageAction,
          pendingWith: pendingWith,
          dateOfReturnByUser: returnInfo.userReturn,
          dateOfReturnByVendor: returnInfo.vendorReturn,
          dateOfReceipt: receiptDate,
          acdCcd: this.formatDate(poData.actualDeliveryDate),
          numberOfDaysComplete: poData.daysComplete,
          remainingDays: poData.remainingDays,
          orderStatus: orderStatus
        });
      });
    });
    
    this.stageWiseRowData = stageWiseData;
  }

  private processAllVendorsData(vendorsData: any[]): void {
    this.allVendorsRowData = vendorsData.map(vendor => ({
      vendorCode: vendor.vendorCode || 'N/A',
      companyName: vendor.companyName || 'N/A',
      contactNameTitle: vendor.contactNameTitle || 'N/A',
      contactEmail: vendor.contactEmail || 'N/A',
      contactPhone1: vendor.contactPhone1 || 'N/A',
      telephone: vendor.telephone || 'N/A',
      email: vendor.email || 'N/A',
      mailingAddress: vendor.mailingAddress || 'N/A',
      website: vendor.website || 'N/A',
      generalDetails: vendor.generalDetails || 'N/A'
    }));
  }

  private calculateOrderStatus(dlpDate: Date | null): string {
    if (!dlpDate) return 'Open';
    const today = new Date();
    return dlpDate <= today ? 'Closed' : 'Open';
  }

  private calculateShippingDocumentStatus(stageStatuses: StageStatus[], uploadedDocuments: any[]): string {
    const shippingStages = stageStatuses?.filter(stage => 
      stage.stageId >= 8 && stage.stageId <= 12
    ) || [];
    
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

  private getReceiptDate(stage: StageStatus, uploadedDocuments: any[]): string {
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
    };
    return stageNames[stageId] || `Stage ${stageId}`;
  }

  private getStageAction(stage: StageStatus): string {
    if (stage.status === 'Complete') {
      return 'Completed';
    } else if (stage.status === 'InProgress') {
      return 'In Progress - Pending approval';
    } else {
      return 'Draft document returned for correction';
    }
  }

  private getPendingWith(stage: StageStatus): string {
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
