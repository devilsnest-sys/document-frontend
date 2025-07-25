import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { ColDef, GridOptions, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ToastserviceService } from '../../core/services/toastservice.service';
import { DocumentUploadComponent } from '../../shared/components/document-upload/document-upload.component';
@Component({
  selector: 'app-stage-step11',
  standalone: false,
  
  templateUrl: './stage-step11.component.html',
  styleUrl: './stage-step11.component.css'
})
export class StageStep11Component {poData: any[] = [];
  stageStatus: any;
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
  selectedPoId: any;
  selectedDocumentId: any;
  selectedStageId: any;
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient, private route: ActivatedRoute, private toastservice: ToastserviceService) { }

  ngOnInit(): void {
    const poNumber = this.route.snapshot.paramMap.get('poNumber');
    console.log(poNumber);
    this.fetchPurchaseOrderData(poNumber);
    this.getStageStatus(poNumber!);
  }
  getStageStatus(poNumber: string): void {
    const token = localStorage.getItem('authToken');
    const url = `${environment.apiUrl}/v1/StageStatus/get-stage-status/${poNumber}/1`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        this.stageStatus = response;
      },
      error: (err) => {
        console.error('Error fetching Stage Status data:', err);
      },
    });
  }

  get shouldShowStageSubmit(): boolean {
    return this.stageStatus?.status !== 'Complete';
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
        // console.log('API Response:', response);

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

    viewPoFile(poId: number): void {
  const token = localStorage.getItem('authToken');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
    Accept: 'application/octet-stream',
  });

  const url = `${environment.apiUrl}/v1/PurchaseOrder/view/${poId}`;

  this.http.get(url, { headers, responseType: 'blob' }).subscribe({
    next: (blob) => {
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL); // Opens in a new tab
    },
    error: (err) => {
      console.error('Error viewing PO file:', err);
      this.toastservice.showToast('error','Failed to view PO file');
    },
  });
  }

  downloadPoFile(poId: number): void {
  const token = localStorage.getItem('authToken');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
    Accept: 'application/octet-stream',
  });

  const url = `${environment.apiUrl}/v1/PurchaseOrder/download/${poId}`;

  this.http.get(url, { headers, responseType: 'blob' }).subscribe({
    next: (blob) => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;

      const filename = this.poData[0]?.poFilePath?.split('\\').pop() || `PO_${poId}.pdf`;
      a.download = filename;

      a.click();
      URL.revokeObjectURL(objectUrl);
    },
    error: (err) => {
      console.error('Error downloading PO file:', err);
      this.toastservice.showToast('error','Failed to download PO file');
    },
  });
  }
}
