import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { environment } from '../../../../environment/environment';

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

@Component({
  selector: 'app-documentselection',
  standalone: false,
  templateUrl: './documentselection.component.html',
  styleUrls: ['./documentselection.component.css'],
})
export class DocumentselectionComponent implements OnInit {
  public modules: Module[] = [ClientSideRowModelModule];
  userId: string | null = null;
  selectedPoNumber: string = '';
  purchaseOrders: PurchaseOrder[] = [];
  
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

  constructor(private http: HttpClient) {}
  
  allStages: any;
  allDocumentTypes: any;

  ngOnInit(): void {
    this.fetchStages();
    this.fetchPo();
    this.userId = localStorage.getItem('userId');
    // Note: Initial document selection data will be fetched when PO is selected
  }

  fetchPo(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.get<PurchaseOrder[]>(`${environment.apiUrl}/v1/PurchaseOrder`, { headers }).subscribe({
      next: (data) => {
        this.purchaseOrders = data.map(item => ({
          ...item,
          // Format dates properly if needed for display
          contractualDeliveryDate: item.contractualDeliveryDate ? new Date(item.contractualDeliveryDate).toLocaleDateString() : '',
          actualDeliveryDate: item.actualDeliveryDate ? new Date(item.actualDeliveryDate).toLocaleDateString() : '',
          createdAt: new Date(item.createdAt).toLocaleDateString(),
          updatedAt: new Date(item.updatedAt).toLocaleDateString()
        }));
      },
      error: (error) => {
        console.error('Error fetching purchase orders:', error);
      },
    });
  }

  onPoSelectionChange(): void {
    // Refresh document selection data when PO is changed
    if (this.selectedPoNumber && this.allStages) {
      // First fetch document selection data, then fetch document types
      this.fetchDocumentSelectionData();
    } else {
      // Clear data if no PO is selected
      this.rowData = [];
      this.responseData = [];
    }
  }

  fetchDocumentSelectionData(): void {
    if (!this.selectedPoNumber) {
      return;
    }

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    // Add poNumber as query parameter
    const url = `${environment.apiUrl}/v1/document-selection?poNumber=${encodeURIComponent(this.selectedPoNumber)}`;
    
    this.http.get(url, { headers }).subscribe({
      next: (response: any) => {
        this.responseData = response;
        // After getting document selection data, fetch document types and build the grid
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

    this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/v1/stages`, { headers }).subscribe({
      next: (stages) => {
        this.allStages = stages;
        this.setupGridColumns(stages);
        if (this.selectedPoNumber) {
          this.fetchDocumentSelectionData();
          this.fetchDocumentTypes(stages);
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
      { field: 'documentName', headerName: 'Document Name', filter: 'agTextColumnFilter' },
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

  fetchDocumentTypes(stages: { id: number; name: string }[]): void {
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
            // Filter selections by selected PO number
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

  onCheckboxChange(params: any): void {
    if (!this.selectedPoNumber) {
      alert('Please select a PO number first');
      return;
    }

    const { data, colDef, value } = params;
    const stageField = colDef.field as string;
    const stageId = Number(stageField.replace('stage', ''));
    const documentId = data.id;

    const targetRecord = this.responseData.find(
      (item) => item.stageId === stageId && 
                item.documentId === documentId
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
          documentId: documentId,
          isDelete: 0,
          pono: this.selectedPoNumber
        };

        const url = `${environment.apiUrl}/v1/document-selection`;

        this.http.post(url, payload, { headers }).subscribe({
          next: (response: any) => {
            console.log('New document selection created successfully:', response);
            // Add the new record to local responseData
            this.responseData.push({
              id: response.id, // Assuming the API returns the created record with ID
              createdUserId: Number(this.userId),
              updatedUserId: Number(this.userId),
              stageId: stageId,
              documentId: documentId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDelete: 0,
              pono: this.selectedPoNumber
            });
          },
          error: (error) => {
            console.error('Error creating new document selection:', error);
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

    const url = `${environment.apiUrl}/v1/document-selection/${recordId}`;

    this.http.patch(url, payload, { headers }).subscribe({
      next: (response) => {
        console.log('Checkbox state updated successfully:', response);
        // Update local responseData to reflect the change
        if (targetRecord) {
          targetRecord.isDelete = value ? 0 : 1;
          targetRecord.updatedUserId = Number(this.userId);
        }
      },
      error: (error) => {
        console.error('Error updating checkbox state:', error);
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