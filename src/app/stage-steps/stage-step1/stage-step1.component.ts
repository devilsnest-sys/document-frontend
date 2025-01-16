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
    { field: 'file', headerName: 'File', hide: true },
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
      const file = fileInput.files[0];
      const rowIndexNumber = parseInt(rowIndex, 10);
      const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndexNumber);
      if (rowNode) {
        const updatedData = { ...rowNode.data, docname: file.name, file };
        rowNode.setData(updatedData); 
        // console.log('Row updated:', updatedData);
      } else {
        console.error('Row node not found for index:', rowIndex);
      }
    } else {
      console.error('No file provided for upload.');
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
  
      // Retrieve the file from row data
      const file = rowData.file; // Ensure the file object is available
      if (!file) {
        console.error('No file provided for upload.');
        return;
      }
  
      // Create form data object
      const formData = new FormData();
      formData.append('DocumentName', rowData.docname);
      formData.append('ReviewedBy', rowData.reviewedBy || '1'); // Default Reviewer ID
      formData.append('UploadedDate', new Date().toISOString());
      formData.append('DocumentTypeId', documentTypeId.toString());
      formData.append('Status', rowData.status || 'Pending');
      formData.append('UploadedBy', poDetails.createdBy.toString());
      formData.append('ReviewRemark', rowData.remark || 'No remarks');
      formData.append('StageId', rowData.stageId || '1'); // Default Stage ID
      formData.append('PoId', poDetails.id.toString());
      formData.append('Id', '0'); // Assuming new submission
      formData.append('DocReviewDate', rowData.reviewDate || new Date().toISOString());
      formData.append('file', file, file.name); // Append the file object
  
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
  
      this.http
        .post(`${environment.apiUrl}/v1/UploadedDocument/CreateUploadDocFlow`, formData, { headers })
        .subscribe({
          next: (response) => {
            console.log('Submit successful:', response);
            // Optionally update the grid to show success
          },
          error: (error) => {
            console.error('Error submitting document:', error);
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
