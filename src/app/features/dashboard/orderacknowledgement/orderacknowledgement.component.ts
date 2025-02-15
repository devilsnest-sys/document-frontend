import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ColDef, ICellRendererParams, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'; 
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-orderacknowledgement',
  standalone: false,  
  templateUrl: './orderacknowledgement.component.html',
  styleUrl: './orderacknowledgement.component.css'
})
export class OrderacknowledgementComponent {
  poForm: FormGroup;
  rowData: any[] = [];
  vendorId: string | null = null;
  selectedFile: File | null = null;
  filteredRowData: any[] = [];
  poSearchText: string = ''; 
  incotermsList: any[] = []; 
  poTypeList: any[] = [];
  public modules: Module[] = [ClientSideRowModelModule];

  bulkPoFile: File | null = null;
  bulkPoFileName: string = '';
  
  
  columnDefs: ColDef[] = [
    { field: 'poDescription', headerName: 'PO Description' },
    { field: 'poType', headerName: 'PO Type' },
    { field: 'incoterms', headerName: 'Incoterms' },
    { field: 'actualDeliveryDate', headerName: 'Shipment Date' },
    { field: 'contactPersonName', headerName: 'Contact Person Name' },
    { field: 'contactPersonEmailId', headerName: 'Contact Person Email' },
    {
      field: 'actions',
      headerName: 'Actions',
      cellRenderer: (params: ICellRendererParams) => {
        const eDiv = document.createElement('div');
        
        // Create view button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn-action upload-btn';
        viewBtn.innerHTML = '<span class="material-icons">visibility</span>';
        viewBtn.addEventListener('click', () => this.viewDocument(params.data.id));
        
        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn-action upload-btn';
        downloadBtn.innerHTML = '<span class="material-icons">download</span>';
        downloadBtn.addEventListener('click', () => this.downloadDocument(params.data.id));
        
        eDiv.appendChild(viewBtn);
        eDiv.appendChild(downloadBtn);
        return eDiv;
      },
      width: 150,
    },
  ];

  gridOptions = {
    context: {
      viewDocument: this.viewDocument.bind(this),
      downloadDocument: this.downloadDocument.bind(this)
    }
  };

  defaultColDef: ColDef = {
    sortable: true,
    filter: true, 
    resizable: true, 
    flex: 1, 
    minWidth: 100,
  };

  constructor(private fb: FormBuilder, private http: HttpClient, private authService: AuthService) {
    this.poForm = this.fb.group({
      poDescription: ['', Validators.required],
      poType: ['', Validators.required],
      incoterms: ['', Validators.required],
      contractualDeliveryDate: ['', Validators.required],
      actualDeliveryDate: ['', Validators.required],
      contactPersonName: ['', Validators.required],
      contactPersonEmailId: ['', [Validators.required]],
      contactNumber: ['', Validators.required],
      poFilePath: [null, Validators.required],
      poNo: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.fetchPo();
    this.fetchIncoterms();
    this.fetchpotypes();
    this.vendorId = this.authService.getUserId();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.poForm.patchValue({ poFilePath: this.selectedFile });
    }
  }

  fetchPo(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.get<any[]>(`${environment.apiUrl}/v1/PurchaseOrder`, { headers }).subscribe({
      next: (data) => {
        this.rowData = data.map(item => ({
          ...item,
          shipmentDate: new Date(item.shipmentDate).toLocaleDateString(), 
          createdAt: new Date(item.createdAt).toLocaleDateString(),
          updatedAt: new Date(item.updatedAt).toLocaleDateString()
        }));
  
        this.filteredRowData = this.rowData;
      },
      error: (error) => {
        console.error('Error fetching stages:', error);
      },
    });
  }

  fetchpotypes(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .get<any[]>(`${environment.apiUrl}/v1/potype`, { headers })
      .subscribe({
        next: (data) => {
          this.poTypeList = data;
          console.log('potypes fetched successfully:', data);
        },
        error: (error) => {
          console.error('Error fetching potypes:', error);
        },
      });
  }

  fetchIncoterms(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.get<any[]>(`${environment.apiUrl}/v1/incoterms`, { headers }).subscribe({
      next: (data) => {
        this.incotermsList = data;
        console.log('Incoterms fetched successfully:', data);
      },
      error: (error) => {
        console.error('Error fetching incoterms:', error);
      },
    });
  }
  
  onSubmit(): void {
    if (this.poForm.valid && this.selectedFile) {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      
      const formData = new FormData();
      formData.append('file', this.selectedFile, this.selectedFile.name);
      formData.append('ContactPersonName', this.poForm.value.contactPersonName);
      formData.append('PO_NO', this.poForm.value.poNo);
      formData.append('ContactNumber', this.poForm.value.contactNumber);
      formData.append('ContactPersonEmailId', this.poForm.value.contactPersonEmailId);
      formData.append('VendorId', this.vendorId ?? '');
      formData.append('UpdatedAt', new Date().toISOString());
      formData.append('IsDeleted', 'false');
      formData.append('ContractualDeliveryDate', this.poForm.value.contractualDeliveryDate.toISOString());
      formData.append('ActualDeliveryDate', this.poForm.value.actualDeliveryDate.toISOString());
      formData.append('UpdatedBy', this.vendorId ?? ''); 
      formData.append('Incoterms', this.poForm.value.incoterms.toString());
      formData.append('PoType', this.poForm.value.poType.toString());
      formData.append('CreatedAt', new Date().toISOString());
      formData.append('PoDescription', this.poForm.value.poDescription);
      formData.append(
        'StageStatuses',
        JSON.stringify([])
      );
      formData.append('CreatedBy', '1'); // Hardcoded
  
      this.http.post<any>(`${environment.apiUrl}/v1/PurchaseOrder`, formData, { headers }).subscribe({
        next: (response) => {
          console.log('PO submitted successfully:', response);
          this.poForm.reset();
          this.selectedFile = null;
        },
        error: (error) => {
          console.error('Error submitting PO:', error);
        },
      });
    } else {
      console.log('Form is invalid or file not selected');
    }
  }
  
  
  onSearchPO(): void {
    if (this.poSearchText.trim()) {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.get<any>(`${environment.apiUrl}/v1/PurchaseOrder/${this.poSearchText.trim()}`, { headers }).subscribe({
        next: (data) => {

          this.filteredRowData = [data];
          console.log('PO found:', data);
        },
        error: (error) => {
          console.error('Error fetching PO:', error);

          this.filteredRowData = [];
        },
      });
    } else {
      this.filteredRowData = [...this.rowData]; 
    }
  }

  triggerBulkFileInput() {
    const fileInput = document.getElementById('bulkPoFileInput') as HTMLInputElement;
    fileInput.click();
  }
  
  onBulkFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.bulkPoFile = input.files[0];
      this.bulkPoFileName = this.bulkPoFile.name;
    }
  }
  
  onBulkPoUpload(): void {
    if (this.bulkPoFile) {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
      const formData = new FormData();
      formData.append('ExcelFile', this.bulkPoFile, this.bulkPoFile.name); // Change 'file' to 'ExcelFile'
      formData.append('VendorId', this.vendorId ?? '');
  
      this.http.post<any>(`${environment.apiUrl}/v1/PurchaseOrder/upload`, formData, { headers }).subscribe({
        next: (response) => {
          console.log('Bulk PO uploaded successfully:', response);
          this.bulkPoFile = null;
          this.bulkPoFileName = '';
          this.fetchPo(); // Refresh the PO list
        },
        error: (error) => {
          console.error('Error uploading bulk PO:', error);
        },
      });
    } else {
      console.log('No bulk PO file selected');
    }
  }

  viewDocument(documentId: number): void {
    const token = localStorage.getItem('authToken');
    const documentUrl = `${environment.apiUrl}/v1/PurchaseOrder/view/${encodeURIComponent(documentId)}`;
  
    fetch(documentUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const newWindow = window.open(blobUrl, '_blank');
        if (newWindow) {
          newWindow.addEventListener('unload', () => {
            URL.revokeObjectURL(blobUrl);
          });
        }
      })
      .catch(error => {
        console.error('Error viewing document:', error);
        // You might want to add a user-friendly error message here
        alert('Error viewing document. Please ensure you are logged in and try again.');
      });
  }
  

  downloadDocument(documentName: number): void {
    const documentUrl = `${environment.apiUrl}/v1/PurchaseOrder/download/${encodeURIComponent(documentName)}`;
  
    fetch(documentUrl)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `document_${documentName}.pdf`; // Add appropriate extension
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl); // Clean up the blob URL
      })
      .catch(error => {
        console.error('Error downloading document:', error);
        // Add appropriate error handling/user notification here
      });
  }
  
  
}
