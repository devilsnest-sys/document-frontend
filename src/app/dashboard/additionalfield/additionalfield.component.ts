import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'; 
import Swal from 'sweetalert2';

@Component({
  selector: 'app-additionalfield',
  standalone: false,
  templateUrl: './additionalfield.component.html',
  styleUrls: ['./additionalfield.component.css'],
})
export class AdditionalfieldComponent {
  additionalFieldForm!: FormGroup;
  isSubmitting = false;
 public modules: Module[] = [ClientSideRowModelModule];
  rowData: any[] = [];

  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', filter: 'agNumberColumnFilter' },
    { field: 'additionalFieldName', headerName: 'Field Name', filter: 'agTextColumnFilter' },
    { field: 'additionalFieldRequiredDataType', headerName: 'Data Type', filter: 'agTextColumnFilter' },
    { field: 'createdAt', headerName: 'Created At', filter: 'agDateColumnFilter' },
    { field: 'updatedAt', headerName: 'Updated At', filter: 'agDateColumnFilter' },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  };

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.additionalFieldForm = this.fb.group({
      additionalFieldName: ['', [Validators.required, Validators.minLength(3)]],
      additionalFieldRequiredDataType: ['', [Validators.required, Validators.minLength(3)]],
    });
    this.fetchAdditionalFields();
  }

  fetchAdditionalFields(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(`${environment.apiUrl}/v1/AdditionalField`, { headers }).subscribe({
      next: (data) => {
        this.rowData = data;
        console.log('Additional fields fetched successfully:', data);
      },
      error: (error) => {
        console.error('Error fetching additional fields:', error);
      },
    });
  }

  onSubmit(): void {
    if (this.additionalFieldForm.valid) {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.isSubmitting = true;
      const payload = {
        id: 0,
        additionalFieldRequiredDataType: this.additionalFieldForm.value.additionalFieldRequiredDataType,
        additionalFieldName: this.additionalFieldForm.value.additionalFieldName,
        createdAt: new Date().toISOString(),
        createdBy: 0, // Replace with actual user ID
        updatedAt: new Date().toISOString(),
        updatedBy: 0, // Replace with actual user ID
        isDeleted: false,
      };

      this.http.post(`${environment.apiUrl}/v1/AdditionalField`, payload, { headers }).subscribe({
        next: (response) => {
          console.log('Additional field created successfully:', response);
          this.additionalFieldForm.reset();
          this.fetchAdditionalFields();
          Swal.fire({
            icon: 'success',
            title: 'Created Successfully:',
            text: 'Additional field created successfully:',
            timerProgressBar: true,
            showConfirmButton: false,
            timer: 1500,
          })
        },
        error: (error) => {
          console.error('Error creating additional field:', error);
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    }
  }

  onCancel(): void {
    this.additionalFieldForm.reset();
  }
}
