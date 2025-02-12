import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-additional-field-flow',
  standalone: false,
  
  templateUrl: './additional-field-flow.component.html',
  styleUrl: './additional-field-flow.component.css'
})
export class AdditionalFieldFlowComponent {
  rowData: any[] | undefined;
  

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private ToastserviceService: ToastserviceService, private route : ActivatedRoute
  ) {}

  

  public modules: Module[] = [ClientSideRowModelModule];

  ngOnInit(): void {
    const poNumber = this.route.snapshot.paramMap.get('poNumber');
    this.fetchAdditionalFieldsFlow(poNumber);
  }

  columnDefs: ColDef[] = [
    { field: 'poId', editable: true },
    { field: 'stageId', editable: true },
    { field: 'additionalFieldId', editable: true },
    { field: 'initAddFieldValue', editable: true },
    { field: 'finalAddFieldValue', editable: true },
    { field: 'status', editable: true },
    { field: 'reviewRemark', editable: true },
    { field: 'isMandatory', editable: true, cellRenderer: (params: { value: any; }) => params.value ? 'Yes' : 'No' },
    { field: 'isApproved', editable: true, cellRenderer: (params: { value: any; }) => params.value ? 'Yes' : 'No' },
    { field: 'isRejected', editable: true, cellRenderer: (params: { value: any; }) => params.value ? 'Yes' : 'No' },
    { field: 'isDocSubmited', editable: true, cellRenderer: (params: { value: any; }) => params.value ? 'Yes' : 'No' },
  ];

  fetchAdditionalFieldsFlow(poNumber: string | null): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .get<any[]>(`${environment.apiUrl}/v1/UploadedAdditionalFieldFlow/${poNumber}`, { headers })
      .subscribe({
        next: (data) => {
          this.rowData = data;
          console.log('Additional fields fetched successfully:', data);
        },
        error: (error) => {
          console.error('Error fetching additional fields:', error);
        },
      });
  }

  onSubmit() {
    const payload = this.rowData; // Assuming single record for now
    fetch(`${environment.apiUrl}/v1/UploadedAdditionalFieldFlow/Create`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => console.log("Success:", data))
    .catch(error => console.error("Error:", error));
  }

}
