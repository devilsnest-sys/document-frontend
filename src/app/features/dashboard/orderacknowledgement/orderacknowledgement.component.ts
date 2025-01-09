import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ColDef, Module } from '@ag-grid-community/core';
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
  public modules: Module[] = [ClientSideRowModelModule];
  
  
  columnDefs: ColDef[] = [
    { field: 'poDescription', headerName: 'PO Description' },
    { field: 'poType', headerName: 'PO Type' },
    { field: 'incoterms', headerName: 'Incoterms' },
    { field: 'shipmentDate', headerName: 'Shipment Date' },
    { field: 'proofOfDelivery', headerName: 'Proof of Delivery' },
    { field: 'contactPersonName', headerName: 'Contact Person Name' },
    { field: 'contactPersonEmail', headerName: 'Contact Person Email' },
    { field: 'alternateEmailId', headerName: 'Alternate Email ID' },
  ];

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


  onSubmit(): void {
    if (this.poForm.valid && this.selectedFile) {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      
      const formData = new FormData();
      formData.append('PoFilePath', this.selectedFile, this.selectedFile.name);
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
  
}
