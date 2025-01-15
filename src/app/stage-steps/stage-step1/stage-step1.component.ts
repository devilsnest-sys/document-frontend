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
  isLoading = true;
  public modules: Module[] = [ClientSideRowModelModule];
  rowData: any[] = [];

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
      cellRenderer: DocumentUploadComponent,
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

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  submitCellRenderer(params: any): string {
    return `
    <button type="button" class="btn btn-info btn-sm">Info</button>`;
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

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching PO data:', err);
        this.poData = [];
        this.isLoading = false;
      },
    });
  }
}
