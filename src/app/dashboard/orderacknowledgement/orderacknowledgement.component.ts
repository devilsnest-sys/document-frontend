import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'; 
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-orderacknowledgement',
  standalone: false,  
  templateUrl: './orderacknowledgement.component.html',
  styleUrl: './orderacknowledgement.component.css'
})
export class OrderacknowledgementComponent {
  poForm: FormGroup;
  rowData: any[] = [];
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

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.poForm = this.fb.group({
      poDescription: ['', Validators.required],
      poType: ['', Validators.required],
      incoterms: ['', Validators.required],
      shipmentDate: ['', Validators.required],
      proofOfDelivery: ['', Validators.required],
      contactPersonName: ['', Validators.required],
      contactPersonEmailId: ['', [Validators.required, Validators.email]],
      alternateEmailId: ['', Validators.email],
    });
  }

  ngOnInit(): void {
    this.fetchPo();
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
    if (this.poForm.valid) {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      const payload = {
        id: 0,
        pO_NO: 0,
        poDescription: this.poForm.value.poDescription,
        poType: parseInt(this.poForm.value.poType, 10),
        incoterms: parseInt(this.poForm.value.incoterms, 10),
        shipmentDate: this.poForm.value.shipmentDate,
        proofOfDelivery: this.poForm.value.proofOfDelivery,
        contactPersonName: this.poForm.value.contactPersonName,
        contactPersonEmailId: this.poForm.value.contactPersonEmailId,
        alternateEmailId: this.poForm.value.alternateEmailId,
        createdAt: new Date().toISOString(),
        createdBy: 0,
        updatedAt: new Date().toISOString(),
        updatedBy: 0,
        isDeleted: false,
        vendorId: 0,
        stageStatuses: [],
      };

      this.http.post<any>(`${environment.apiUrl}/v1/PurchaseOrder`, payload, { headers }).subscribe({
        next: (response) => {
          console.log('PO submitted successfully:', response);
          this.poForm.reset();
        },
        error: (error) => {
          console.error('Error submitting PO:', error);
        },
      });
    } else {
      console.log('Form is invalid');
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
