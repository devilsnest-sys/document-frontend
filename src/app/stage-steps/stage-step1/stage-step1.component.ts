import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { ColDef, GridOptions, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ToastserviceService } from '../../core/services/toastservice.service';
import { DocumentUploadComponent } from '../../shared/components/document-upload/document-upload.component';

declare global {
  interface Window {
    angularCallback: (rowIndex: string, event: Event) => void;
    angularCallbackForSubmit: (rowIndex: string, event: Event) => void;
  }
}


@Component({
  selector: 'app-stage-step1',
  standalone: false,

  templateUrl: './stage-step1.component.html',
  styleUrl: './stage-step1.component.css',
})
export class StageStep1Component implements OnInit {
  poData: any[] = [];
  displayedColumns: string[] = [
    'pO_NO',
    'poDescription',
    'actualDeliveryDate',
    'contractualDeliveryDate',
    'contactPersonName',
    'contactPersonEmailId',
    'contactNo',
    'incoterms',
    'poType',
  ];
  public modules: Module[] = [ClientSideRowModelModule];
  rowData: any[] = [];
  gridApi: any;

  onGridReady(params: any): void {
    this.gridApi = params.api;
  }

  frameworkComponents = {
    fileUploadRenderer: DocumentUploadComponent,
  };

  columnDefs: ColDef[] = [
    { headerName: 'S.No', field: 'sno', valueGetter: 'node.rowIndex + 1' },
    {
      headerName: 'Doc Type',
      field: 'documentName',
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Upload Doc',
      field: 'uploaddoc',
      cellRenderer: this.actionCellRenderer.bind(this),
    },
    { headerName: 'Doc Name', field: 'docname', sortable: true, filter: true },
    {
      headerName: 'Action',
      field: 'action',
      cellRenderer: this.actionCellRenderer2.bind(this),
    },
    { headerName: 'Status', field: 'status', sortable: true, filter: true },
    {
      headerName: 'Reviewed By',
      field: 'reviewby',
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Review Date',
      field: 'reviewdate',
      sortable: true,
      filter: true,
    },
    { headerName: 'Remark', field: 'remark', sortable: true, filter: true },
    {
      headerName: 'Submit',
      field: 'submit',
      cellRenderer: this.submitCellRenderer.bind(this),
      sortable: true,
      filter: true,
    },
  ];

  defaultColDef = {
    flex: 1,
    minWidth: 50,
    resizable: true,
  };

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit(): void {
    window['angularCallback'] = this.onFileSelected.bind(this);
    window['angularCallbackForSubmit'] = this.onSubmit.bind(this);
    const poNumber = this.route.snapshot.paramMap.get('poNumber');
    this.fetchPurchaseOrderData(poNumber);
    this.fetchDocumentTypes();
  }

  onFileSelected(rowIndex: string, event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      const fileName = fileInput.files[0].name;
      const rowIndexNumber = parseInt(rowIndex, 10);
      const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndexNumber);
      if (rowNode) {
        rowNode.setDataValue('docname', fileName);
      }
    }
  }

  fetchDocumentTypes(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .get<any[]>(`${environment.apiUrl}/v1/DocumentType`, { headers })
      .subscribe({
        next: (data) => {
          this.rowData = data;
          console.log('Document Types fetched successfully:', data);
        },
        error: (error) => {
          console.error('Error fetching document types:', error);
        },
      });
  }

  fetchPurchaseOrderData(poNumber: string | null): void {
    if (!poNumber) {
      console.error('PO Number is missing!');
      return;
    }

    const token = localStorage.getItem('authToken');
    const url = `${environment.apiUrl}/v1/PurchaseOrder/${poNumber}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'text/plain',
    };

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        console.log('API Response:', response);

        if (
          response &&
          typeof response === 'object' &&
          !Array.isArray(response)
        ) {
          this.poData = [response];
        } else if (Array.isArray(response)) {
          this.poData = response;
        } else {
          console.error('Unexpected API response format:', response);
          this.poData = [];
        }
      },
      error: (err) => {
        console.error('Error fetching PO data:', err);
        this.poData = [];
      },
    });
  }

  onSubmit(rowIndex: string): void {
    const rowNode = this.gridApi.getDisplayedRowAtIndex(parseInt(rowIndex, 10));
    if (rowNode) {
      const rowData = rowNode.data;
  
      // Find matching document type by `documentName`
      const documentType = this.rowData.find(doc => doc.documentName === rowData.documentName);
      const documentTypeId = documentType ? documentType.id : null;
      if (!documentTypeId) {
        console.error('Document Type ID not found for the selected document.');
        return;
      }
  
      if (!this.poData || this.poData.length === 0) {
        console.error('Purchase Order data not loaded or empty.');
        return;
      }
  
      const poDetails = this.poData[0];
  
      const payload = {
        Id: 0, // Assuming new submission
        PoId: poDetails.id, // Use ID from PO data
        StageId: rowData.stageId || 1, // Provide a default StageId if not available
        DocumentTypeId: documentTypeId, // ID from document type
        DocumentName: rowData.docname, // Document Name from grid data
        UploadedBy: poDetails.createdBy, // Use CreatedBy from PO data
        UploadedDate: new Date().toISOString(), // Current date-time
        ReviewedBy: rowData.reviewedBy || 1, // Default Reviewer ID
        DocReviewDate: rowData.reviewDate || new Date().toISOString(),
        Status: rowData.status || 'Pending',
        ReviewRemark: rowData.remark || 'No remarks',
      };
  
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
  
      this.http
        .post(`${environment.apiUrl}/v1/UploadedDocument`, payload, { headers })
        .subscribe({
          next: (response) => {
            console.log('Submit successful:', response);
            // Optionally update the grid to show success
          },
          error: (error) => {
            console.error('Error submitting document:', error);
            console.log(payload);
          },
        });
    } else {
      console.error('Row data not found for submission');
    }
  }
  

  submitCellRenderer(params: any): string {
    return `
      <button 
        type="button" 
        class="btn btn-info btn-sm" 
        onclick="angularCallbackForSubmit('${params.node.id}')">
        Submit
      </button>`;
  }

  actionCellRenderer(params: any): string {
    return `
      <div class="upload-container">
        <input 
          type="file" 
          id="fileInput-${params.node.id}" 
          style="display: none;"
          onchange="angularCallback('${params.node.id}', event)"
        />
        <button class="btn-action upload-btn" onclick="document.getElementById('fileInput-${params.node.id}').click()">
          <span class="material-icons">upload</span>
        </button>
      </div>
    `;
  }


  actionCellRenderer2(params: any) {
    const documentUrl = params.data.documentUrl;
    return `
      <div class="action-buttons">
        <button class="btn-action view-btn" 
                onclick="window.open('${documentUrl}', '_blank')"
                ${!documentUrl ? 'disabled' : ''}>
          <span class="material-icons">visibility</span>
        </button>
        <button class="btn-action download-btn"
                onclick="this.downloadDocument('${documentUrl}', '${params.data.docname}')"
                ${!documentUrl ? 'disabled' : ''}>
          <span class="material-icons">download</span>
        </button>
      </div>
    `;
  }
}
