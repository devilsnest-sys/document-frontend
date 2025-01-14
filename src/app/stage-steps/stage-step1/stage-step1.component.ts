import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { ColDef, GridOptions, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ToastserviceService } from '../../core/services/toastservice.service';
import Swal from 'sweetalert2';
import { DocumentUploadComponent } from '../../shared/components/document-upload/document-upload.component';
import { AgGridModule } from '@ag-grid-community/angular';


@Component({
  selector: 'app-stage-step1',
  standalone: false,
  
  templateUrl: './stage-step1.component.html',
  styleUrl: './stage-step1.component.css'
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
  isLoading = true;
  public modules: Module[] = [ClientSideRowModelModule];
  rowData: any[] = [];
  // rowData = [
  //   {
  //     sno: 1,
  //     documentName: 'Document 1',
  //     docs: [
  //       { uploaddoc: 'Upload Button', docname: 'Uploaded Document Name' },
  //       { uploaddoc: 'Upload Button', docname: 'Uploaded Document Name 2' },
  //     ],
  //   },
  //   {
  //     sno: 2,
  //     documentName: 'Document 2',
  //     docs: [
  //       { uploaddoc: 'Upload Button', docname: 'Uploaded Document 2 Name' },
  //       { uploaddoc: 'Upload Button', docname: 'Uploaded Document 2 Name 2' },
  //     ],
  //   },
  // ];
  

  frameworkComponents = {
    fileUploadRenderer: DocumentUploadComponent,
  };

  columnDefs: ColDef[] = [
    { headerName: 'S.No', field: 'sno', valueGetter: 'node.rowIndex + 1' },
    { headerName: 'Doc Type', field: 'documentName', sortable: true, filter: true },
    {
      headerName: 'Upload Doc',
      field: 'uploaddoc',
      cellRenderer: DocumentUploadComponent, // Use the renderer
    },
    { headerName: 'Doc Name', field: 'docname', sortable: true, filter: true },
    {
      headerName: 'Action',
      field: 'action',
      cellRenderer: this.actionCellRenderer2.bind(this),
    },
    { headerName: 'Status', field: 'status', sortable: true, filter: true },
    { headerName: 'Reviewed By', field: 'reviewby', sortable: true, filter: true },
    { headerName: 'Review Date', field: 'reviewdate', sortable: true, filter: true },
    { headerName: 'Remark', field: 'remark', sortable: true, filter: true },
  ];

  defaultColDef = {
    flex: 1,
    minWidth: 150,
    resizable: true,
  };

  gridOptions: GridOptions = {
    context: {
      componentParent: this, // Reference to the parent component
    },
  };
  

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

actionCellRenderer(params: any): string {
  return `
    <div class="upload-container">
      <input type="file" id="upload_${params.rowIndex}" style="display: none;"
             (change)="uploadFile($event, ${params.rowIndex})" />
      <button class="btn-action upload-btn" 
              (click)="document.getElementById('upload_${params.rowIndex}').click()">
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

  ngOnInit(): void {
    const poNumber = this.route.snapshot.paramMap.get('poNumber');
    this.fetchPurchaseOrderData(poNumber);
    this.fetchDocumentTypes();
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
      this.isLoading = false;
      return;
    }
  
    const token = localStorage.getItem('authToken'); // Get token from local storage
    const url = `${environment.apiUrl}/v1/PurchaseOrder/${poNumber}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'text/plain',
    };
  
    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        console.log('API Response:', response); // Log the API response for debugging
        
        // Wrap the response in an array if it's a single object
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          this.poData = [response]; // Convert object to array
        } else if (Array.isArray(response)) {
          this.poData = response; // Assign directly if already an array
        } else {
          console.error('Unexpected API response format:', response);
          this.poData = []; // Fallback to empty array
        }
  
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching PO data:', err);
        this.poData = []; // Ensure poData is initialized to an empty array
        this.isLoading = false;
      },
    });
  }
    
}
