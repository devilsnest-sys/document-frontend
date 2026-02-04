import { Component, OnInit, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { BehaviorSubject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { environment } from '../../../../environment/environment';
import { UtilService } from '../../../core/services/util.service';

interface DocumentTypeRow {
  id: number;
  documentName: string;
  [key: `stage${number}`]: boolean;
}

interface PurchaseOrder {
  id: number;
  pO_NO: string;
  poDescription: string;
  poType: number;
  incoterms: number;
  poTypeName: string;
  incotermName: string;
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
  stageStatuses: any[];
}

interface Vendor {
  id: number;
  vendorCode: string;
  companyName: string;
}

// Updated Stage interface to match API response
interface Stage {
  id: number;
  sequence: number;
  stageName: string;
  stageStatuses: any[];
}

// New interface for stage status
interface StageStatus {
  stageId: number;
  quantityId: number | null;
  status: 'Complete' | 'InProgress' | 'InComplete';
}

@Component({
  selector: 'app-documentselection',
  standalone: false,
  templateUrl: './documentselection.component.html',
  styleUrls: ['./documentselection.component.css'],
})
export class DocumentselectionComponent implements OnInit {
  public modules: Module[] = [ClientSideRowModelModule];
  userId: string | null = null;
  
  // Vendor related properties
  vendors: Vendor[] = [];
  selectedVendor: Vendor | null = null;
  vendorControl = new FormControl<Vendor | null>(null);
  filteredVendors$ = new BehaviorSubject<Vendor[]>([]);
  
  // PO related properties
  selectedPoNumber: string = '';
  selectedPoId: number | null = null;
  purchaseOrders: PurchaseOrder[] = [];
  poControl = new FormControl('');
  filteredPOs$ = new BehaviorSubject<PurchaseOrder[]>([]);
  
  // Stage status tracking
  stageStatuses: StageStatus[] = [];
  completedStages: Set<number> = new Set();
  
  responseData: Array<{
    id: number;
    createdUserId: number;
    updatedUserId: number;
    stageId: number;
    documentId: number;
    createdAt: string;
    updatedAt: string;
    isDelete: number;
    pono?: string;
  }> = [];
  
  rowData: DocumentTypeRow[] = [];
  columnDefs: ColDef[] = [];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  };

  constructor(
    private http: HttpClient,
    private utilService: UtilService,
    private ngZone: NgZone
  ) {}
  
  allStages: Stage[] = [];
  allDocumentTypes: any;

  ngOnInit(): void {
    this.fetchStages();
    this.loadVendors();
    this.setupVendorFilter();
    this.setupPOFilter();
    this.userId = localStorage.getItem('userId');
    
    // Auto-set vendor for vendor users
    setTimeout(() => this.checkUserTypeAndSetVendor(), 500);
  }

  private setupVendorFilter(): void {
    this.vendorControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const filterValue = value || '';
        return this.filterVendors(filterValue.toString());
      })
    ).subscribe(filtered => this.filteredVendors$.next(filtered));
  }

  private setupPOFilter(): void {
    this.poControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterPOs(value))
    ).subscribe(filtered => this.filteredPOs$.next(filtered));
  }

  private filterPOs(value: string | null): PurchaseOrder[] {
    if (!value) return this.purchaseOrders;
    const filterValue = value.toString().toLowerCase();
    return this.purchaseOrders.filter(po =>
      po.pO_NO?.toLowerCase().includes(filterValue) ||
      po.poDescription?.toLowerCase().includes(filterValue)
    );
  }

  showAllPOs(): void {
    this.filteredPOs$.next(this.purchaseOrders);
  }

  onPOSelect(event: any): void {
    const selectedPONumber = event.option.value;
    const selectedPO = this.purchaseOrders.find(p => p.pO_NO === selectedPONumber);
  
    if (selectedPO) {
      this.selectedPoNumber = selectedPO.pO_NO;
      this.selectedPoId = selectedPO.id;
      this.poControl.setValue(selectedPO.pO_NO, { emitEvent: false });
      this.onPoSelectionChange();
    }
  }

  displayPO(po: string | PurchaseOrder): string {
    if (typeof po === 'string') {
      return po;
    }
    return po && po.pO_NO ? po.pO_NO : '';
  }

  private loadVendors(): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    this.http.get<Vendor[]>(`${environment.apiUrl}/v1/vendors`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: vendors => {
        this.vendors = vendors;
        this.filteredVendors$.next(this.vendors);
      },
      error: err => {
        console.error('Error fetching vendors:', err);
      }
    });
  }

  private filterVendors(value: string): Vendor[] {
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
      this.selectedVendor = selectedVendor;
      this.vendorControl.setValue(selectedVendor);
      this.onVendorChange(selectedVendor.vendorCode);

      // Reset PO selection and stage statuses
      this.selectedPoNumber = '';
      this.selectedPoId = null;
      this.poControl.setValue('', { emitEvent: false });
      this.rowData = [];
      this.responseData = [];
      this.stageStatuses = [];
      this.completedStages.clear();
    }
  }

  displayVendor(vendor: Vendor): string {
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
    this.filteredPOs$.next([]);

    this.http.get<PurchaseOrder[]>(url, { headers }).subscribe({
      next: response => {
        this.purchaseOrders = response.map(item => ({
          ...item,
          contractualDeliveryDate: item.contractualDeliveryDate ? new Date(item.contractualDeliveryDate).toLocaleDateString() : '',
          actualDeliveryDate: item.actualDeliveryDate ? new Date(item.actualDeliveryDate).toLocaleDateString() : '',
          createdAt: new Date(item.createdAt).toLocaleDateString(),
          updatedAt: new Date(item.updatedAt).toLocaleDateString()
        }));
        this.filteredPOs$.next(this.purchaseOrders);
      },
      error: err => {
        console.error('Error fetching purchase orders:', err);
      }
    });
  }

  private loadVendorById(vendorId: number): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const url = `${environment.apiUrl}/v1/vendors/${vendorId}`;
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<Vendor>(url, { headers }).subscribe({
      next: vendor => {
        if (vendor) {
          this.selectedVendor = vendor;
          this.vendorControl.setValue(vendor);
          this.onVendorChange(vendor.vendorCode);
        }
      },
      error: err => {
        console.error('Error fetching vendor:', err);
      }
    });
  }

  private checkUserTypeAndSetVendor(): void {
    const userType = localStorage.getItem('userType');
    const vendorId = localStorage.getItem('userId');

    if (userType === 'vendor' && vendorId) {
      this.loadVendorById(parseInt(vendorId, 10));
    }
  }

  onPoSelectionChange(): void {
    if (this.selectedPoNumber && this.selectedPoId && this.allStages) {
      this.fetchStageStatusForPO(this.selectedPoId);
    } else {
      this.rowData = [];
      this.responseData = [];
      this.stageStatuses = [];
      this.completedStages.clear();
    }
  }

  /**
   * Fetch stage status for the selected PO
   */
  fetchStageStatusForPO(poId: number): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    const url = `${environment.apiUrl}/v1/StageStatus/StageStatusPo/${poId}`;
    
    this.http.get<StageStatus[]>(url, { headers }).subscribe({
      next: (response) => {
        this.stageStatuses = response;
        
        // Track completed stages
        this.completedStages.clear();
        response.forEach(status => {
          if (status.status === 'Complete') {
            this.completedStages.add(status.stageId);
          }
        });
        
        console.log('Stage statuses loaded:', this.stageStatuses);
        console.log('Completed stages:', Array.from(this.completedStages));
        
        // Now fetch document selection data
        this.fetchDocumentSelectionData();
      },
      error: (error) => {
        console.error('Error fetching stage status:', error);
        this.stageStatuses = [];
        this.completedStages.clear();
        // Continue with document selection even if stage status fails
        this.fetchDocumentSelectionData();
      },
    });
  }

  fetchDocumentSelectionData(): void {
    if (!this.selectedPoNumber) {
      return;
    }

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    const url = `${environment.apiUrl}/v1/document-selection?poNumber=${encodeURIComponent(this.selectedPoNumber)}`;
    
    this.http.get(url, { headers }).subscribe({
      next: (response: any) => {
        this.responseData = response;
        if (this.allStages) {
          this.fetchDocumentTypes(this.allStages);
        }
      },
      error: (error) => {
        console.error('Error fetching document selection data:', error);
        this.responseData = [];
      },
    });
  }

  fetchStages(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<Stage[]>(`${environment.apiUrl}/v1/stages`, { headers }).subscribe({
      next: (stages) => {
        this.allStages = stages;
        this.setupGridColumns(stages);
        if (this.selectedPoNumber && this.selectedPoId) {
          this.fetchStageStatusForPO(this.selectedPoId);
        }
      },
      error: (error) => {
        console.error('Error fetching stages:', error);
      },
    });
  }

  setupGridColumns(stages: Stage[]): void {
    this.columnDefs = [
      { field: 'id', headerName: 'Sr. No', valueGetter: 'node.rowIndex + 1', sortable: false },
      { field: 'documentName', headerName: 'Document Name', filter: 'agTextColumnFilter' },
    ];

    stages.forEach((stage) => {
      this.columnDefs.push({
        headerName: stage.stageName,
        field: `stage${stage.id}`,
        cellRenderer: this.checkboxRenderer,
        editable: false,
        cellRendererParams: {
          checkboxCallback: this.onCheckboxChange.bind(this),
          stageId: stage.id,
        },
      });
    });
  }

  fetchDocumentTypes(stages: Stage[]): void {
    if (!this.selectedPoNumber) {
      console.warn('No PO selected');
      return;
    }

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<DocumentTypeRow[]>(`${environment.apiUrl}/v1/DocumentType`, { headers }).subscribe({
      next: (data) => {
        this.allDocumentTypes = data;

        this.http.get<any[]>(`${environment.apiUrl}/v1/document-selection?poNumber=${encodeURIComponent(this.selectedPoNumber)}`, { headers }).subscribe({
          next: (selections) => {
            const filteredSelections = selections.filter(sel => sel.pono === this.selectedPoNumber);
            
            this.rowData = data.map((item) => {
              const stagesData: { [key: string]: boolean } = {};
              stages.forEach((stage) => {
                const selection = filteredSelections.find(
                  (sel) =>
                    sel.stageId === stage.id &&
                    sel.documentId === item.id &&
                    sel.isDelete === 0
                );
                stagesData[`stage${stage.id}`] = !!selection;
              });
              return { ...item, ...stagesData };
            });
          },
          error: (error) => {
            console.error('Error fetching document selections:', error);
          },
        });
      },
      error: (error) => {
        console.error('Error fetching document types:', error);
      },
    });
  }

  /**
   * Check if a stage is completed
   */
  isStageCompleted(stageId: number): boolean {
    return this.completedStages.has(stageId);
  }

  onCheckboxChange(params: any): void {
    if (!this.selectedPoNumber) {
      alert('Please select a PO number first');
      return;
    }

    const { data, colDef, value } = params;
    const stageField = colDef.field as string;
    const stageId = Number(stageField.replace('stage', ''));
    const documentId = data.id;

    // Check if stage is completed - if yes, prevent modification
    if (this.isStageCompleted(stageId)) {
      alert('This stage is completed. No modifications are allowed.');
      // Revert checkbox state
      params.value = !value;
      const checkbox = params.eGridCell.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !value;
      }
      return;
    }

    const targetRecord = this.responseData.find(
      (item) => item.stageId === stageId && 
                item.documentId === documentId
    );

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    

    if (!targetRecord) {
      if (value) {
        const payload = {
          createdUserId: Number(this.userId),
          updatedUserId: Number(this.userId),
          stageId: stageId,
          documentId: documentId,
          isDelete: 0,
          pono: this.selectedPoNumber
        };

        const url = `${environment.apiUrl}/v1/document-selection`;

        this.http.post(url, payload, { headers }).subscribe({
          next: (response: any) => {
            console.log('New document selection created successfully:', response);
            this.responseData.push({
              id: response.id,
              createdUserId: Number(this.userId),
              updatedUserId: Number(this.userId),
              stageId: stageId,
              documentId: documentId,
              createdAt: this.utilService.getISTISOString(),
              updatedAt: this.utilService.getISTISOString(),
              isDelete: 0,
              pono: this.selectedPoNumber
            });
          },
          error: (error) => {
            console.error('Error creating new document selection:', error);
            params.value = false;
            const checkbox = params.eGridCell.querySelector('input[type="checkbox"]');
            if (checkbox) {
              checkbox.checked = false;
            }
          },
        });
      }
      return;
    }

    const recordId = targetRecord.id;
    const payload = {
      updatedUserId: Number(this.userId),
      isDelete: value ? 0 : 1,
      pono: this.selectedPoNumber
    };

    const url = `${environment.apiUrl}/v1/document-selection/${recordId}`;

    this.http.patch(url, payload, { headers }).subscribe({
      next: (response) => {
        console.log('Checkbox state updated successfully:', response);
        if (targetRecord) {
          targetRecord.isDelete = value ? 0 : 1;
          targetRecord.updatedUserId = Number(this.userId);
        }
      },
      error: (error) => {
        console.error('Error updating checkbox state:', error);
        params.value = !value;
        const checkbox = params.eGridCell.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = !value;
        }
      },
    });
  }

  checkboxRenderer = (params: any): HTMLElement => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = params.value;
    
    // Get stageId from cellRendererParams
    const stageId = params.colDef.cellRendererParams?.stageId;
    
    // Disable checkbox if stage is completed
    if (stageId && this.isStageCompleted(stageId)) {
      input.disabled = true;
      input.style.cursor = 'not-allowed';
      input.title = 'This stage is completed and cannot be modified';
    }
    
    input.addEventListener('change', () => {
      // Double-check if stage is completed before allowing change
      if (stageId && this.isStageCompleted(stageId)) {
        input.checked = params.value;
        return;
      }
      
      this.ngZone.run(() => {
        params.value = input.checked;
        params.colDef.cellRendererParams.checkboxCallback(params);
      });
    });
    
    return input;
  }
}