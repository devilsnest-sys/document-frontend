import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { BehaviorSubject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { environment } from '../../../../environment/environment';
import { AuthService } from '../../../core/services/auth.service';

interface AdditionalFieldRow {
  id: number;
  additionalFieldName: string;
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

@Component({
  selector: 'app-additionalfieldselection',
  standalone: false,
  templateUrl: './additionalfieldselection.component.html',
  styleUrls: ['./additionalfieldselection.component.css'],
})
export class AdditionalfieldselectionComponent implements OnInit {
  public modules: Module[] = [ClientSideRowModelModule];
  userId: string | null = null;
  
  // Vendor related properties
  vendors: Vendor[] = [];
  selectedVendor: Vendor | null = null;
  //vendorControl = new FormControl<string>('');
  vendorControl = new FormControl<Vendor | null>(null);
  filteredVendors$ = new BehaviorSubject<Vendor[]>([]);
  
  // PO related properties
  selectedPoNumber: string = '';
  purchaseOrders: PurchaseOrder[] = [];
  
  responseData: Array<{
    id: number;
    createdUserId: number;
    updatedUserId: number;
    stageId: number;
    additionalFieldId: number;
    createdAt: string;
    updatedAt: string;
    isDelete: number;
    pono?: string;
  }> = [];
  
  rowData: AdditionalFieldRow[] = [];
  columnDefs: ColDef[] = [];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  };

  constructor(private http: HttpClient, private authService: AuthService) {}
  
  allStages: any;
  allAdditionalfield: any;

  ngOnInit(): void {
    this.fetchStages();
    this.loadVendors();
    this.setupVendorFilter();
    this.userId = this.authService.getUserId();
    
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
    this.vendorControl.setValue(selectedVendor); // ✅ vendor object
    this.onVendorChange(selectedVendor.vendorCode);

    this.selectedPoNumber = '';
    this.rowData = [];
    this.responseData = [];
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

    this.http.get<PurchaseOrder[]>(url, { headers }).subscribe({
      next: response => {
        this.purchaseOrders = response.map(item => ({
          ...item,
          contractualDeliveryDate: item.contractualDeliveryDate ? new Date(item.contractualDeliveryDate).toLocaleDateString() : '',
          actualDeliveryDate: item.actualDeliveryDate ? new Date(item.actualDeliveryDate).toLocaleDateString() : '',
          createdAt: new Date(item.createdAt).toLocaleDateString(),
          updatedAt: new Date(item.updatedAt).toLocaleDateString()
        }));
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
          // const displayString = this.displayVendor(vendor);
          // this.vendorControl.setValue(displayString, { emitEvent: false });
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
    if (this.selectedPoNumber && this.allStages) {
      this.fetchAdditionalFieldSelectionData();
    } else {
      this.rowData = [];
      this.responseData = [];
    }
  }

  fetchAdditionalFieldSelectionData(): void {
    if (!this.selectedPoNumber) {
      return;
    }

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    const url = `${environment.apiUrl}/v1/additional-field-selection?poNumber=${encodeURIComponent(this.selectedPoNumber)}`;
    
    this.http.get(url, { headers }).subscribe({
      next: (response: any) => {
        this.responseData = response;
        if (this.allStages) {
          this.fetchAdditionalFields(this.allStages);
        }
      },
      error: (error) => {
        console.error('Error fetching additional field selection data:', error);
        this.responseData = [];
      },
    });
  }

  fetchStages(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/v1/stages`, { headers }).subscribe({
      next: (stages) => {
        this.allStages = stages;
        this.setupGridColumns(stages);
        if (this.selectedPoNumber) {
          this.fetchAdditionalFieldSelectionData();
          this.fetchAdditionalFields(stages);
        }
      },
      error: (error) => {
        console.error('Error fetching stages:', error);
      },
    });
  }

  setupGridColumns(stages: { id: number; name: string }[]): void {
    this.columnDefs = [
      { field: 'id', headerName: 'Sr. No', valueGetter: 'node.rowIndex + 1', sortable: false },
      { field: 'additionalFieldName', headerName: 'Additional Field Name', filter: 'agTextColumnFilter' },
    ];

    stages.forEach((stage) => {
      this.columnDefs.push({
        headerName: stage.name,
        field: `stage${stage.id}`,
        cellRenderer: this.checkboxRenderer,
        editable: false,
        cellRendererParams: {
          checkboxCallback: this.onCheckboxChange.bind(this),
        },
      });
    });
  }

  fetchAdditionalFields(stages: { id: number; name: string }[]): void {
    if (!this.selectedPoNumber) {
      console.warn('No PO selected');
      return;
    }

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<AdditionalFieldRow[]>(`${environment.apiUrl}/v1/AdditionalField`, { headers }).subscribe({
      next: (data) => {
        this.allAdditionalfield = data;

        this.http.get<any[]>(`${environment.apiUrl}/v1/additional-field-selection?poNumber=${encodeURIComponent(this.selectedPoNumber)}`, { headers }).subscribe({
          next: (selections) => {
            // Filter selections by selected PO number
            const filteredSelections = selections.filter(sel => sel.pono === this.selectedPoNumber);
            
            this.rowData = data.map((item) => {
              const stagesData: { [key: string]: boolean } = {};
              stages.forEach((stage) => {
                const selection = filteredSelections.find(
                  (sel) =>
                    sel.stageId === stage.id &&
                    sel.additionalFieldId === item.id &&
                    sel.isDelete === 0
                );
                stagesData[`stage${stage.id}`] = !!selection;
              });
              return { ...item, ...stagesData };
            });
          },
          error: (error) => {
            console.error('Error fetching additional field selections:', error);
          },
        });
      },
      error: (error) => {
        console.error('Error fetching additional fields:', error);
      },
    });
  }

  onCheckboxChange(params: any): void {
    if (!this.selectedPoNumber) {
      alert('Please select a PO number first');
      return;
    }

    const { data, colDef, value } = params;
    const stageField = colDef.field as string;
    const stageId = Number(stageField.replace('stage', ''));
    const additionalFieldId = data.id;

    const targetRecord = this.responseData.find(
      (item) => item.stageId === stageId && 
                item.additionalFieldId === additionalFieldId
    );

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    if (!targetRecord) {
      // Create new record if it doesn't exist
      if (value) { // Only create if checkbox is being checked
        const payload = {
          createdUserId: Number(this.userId),
          updatedUserId: Number(this.userId),
          stageId: stageId,
          additionalFieldId: additionalFieldId,
          isDelete: 0,
          pono: this.selectedPoNumber
        };

        const url = `${environment.apiUrl}/v1/additional-field-selection`;

        this.http.post(url, payload, { headers }).subscribe({
          next: (response: any) => {
            console.log('New additional field selection created successfully:', response);
            // Add the new record to local responseData
            this.responseData.push({
              id: response.id,
              createdUserId: Number(this.userId),
              updatedUserId: Number(this.userId),
              stageId: stageId,
              additionalFieldId: additionalFieldId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDelete: 0,
              pono: this.selectedPoNumber
            });
          },
          error: (error) => {
            console.error('Error creating new additional field selection:', error);
            // Revert checkbox state on error
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

    // Update existing record
    const recordId = targetRecord.id;
    const payload = {
      updatedUserId: Number(this.userId),
      isDelete: value ? 0 : 1,
      pono: this.selectedPoNumber
    };

    const url = `${environment.apiUrl}/v1/additional-field-selection/${recordId}`;

    this.http.patch(url, payload, { headers }).subscribe({
      next: (response) => {
        console.log('Additional field checkbox state updated successfully:', response);
        // Update local responseData to reflect the change
        if (targetRecord) {
          targetRecord.isDelete = value ? 0 : 1;
          targetRecord.updatedUserId = Number(this.userId);
        }
      },
      error: (error) => {
        console.error('Error updating additional field checkbox state:', error);
        // Revert checkbox state on error
        params.value = !value;
        const checkbox = params.eGridCell.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = !value;
        }
      },
    });
  }

  checkboxRenderer(params: any): HTMLElement {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = params.value;
    input.addEventListener('change', () => {
      params.value = input.checked;
      params.colDef.cellRendererParams.checkboxCallback(params);
    });
    return input;
  }
}