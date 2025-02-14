import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ToastserviceService } from '../../../core/services/toastservice.service';
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
    // { field: 'id', headerName: 'ID', filter: 'agNumberColumnFilter' },
    { field: 'sno', headerName: 'S No', valueGetter: 'node.rowIndex + 1' },
    {
      field: 'additionalFieldName',
      headerName: 'Field Name',
      filter: 'agTextColumnFilter',
    },
    {
      field: 'additionalFieldRequiredDataType',
      headerName: 'Data Type',
      filter: 'agTextColumnFilter',
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      filter: 'agDateColumnFilter',
    },
    {
      field: 'updatedAt',
      headerName: 'Updated At',
      filter: 'agDateColumnFilter',
    },
    {
      field: 'action',
      headerName: 'Action',
      cellRenderer: (params: any) => {
        return `
        <button class="btn-action edit-btn" title="Edit">
        <span class="material-icons">edit</span>
      </button>
      <button class="btn-action delete-btn" title="Delete">
        <span class="material-icons">delete</span>
      </button>
        `;
      },
      onCellClicked: (params: any) => {
        if (params.event.target.closest('.edit-btn')) {
          this.openEditPopup(params.data);
        } else if (params.event.target.closest('.delete-btn')) {
          this.confirmDelete(params.data.id);
        }
      },
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private ToastserviceService: ToastserviceService
  ) {}

  ngOnInit(): void {
    this.additionalFieldForm = this.fb.group({
      additionalFieldName: ['', [Validators.required, Validators.minLength(3)]],
      additionalFieldRequiredDataType: [false, Validators.required],
    });
    this.fetchAdditionalFields();
  }

  fetchAdditionalFields(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .get<any[]>(`${environment.apiUrl}/v1/AdditionalField`, { headers })
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

      this.http
        .post(`${environment.apiUrl}/v1/AdditionalField`, payload, { headers })
        .subscribe({
          next: (response) => {
            console.log('Additional field created successfully:', response);
            this.additionalFieldForm.reset();
            this.fetchAdditionalFields();
            this.ToastserviceService.showToast(
              'success',
              'Field Created Successfully'
            );
          },
          error: (error) => {
            this.ToastserviceService.showToast(
              'error',
              'Field Creation Failed'
            );
          },
          complete: () => {
            this.isSubmitting = false;
          },
        });
    }
  }

  updateAdditionalField(payload: any): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

    this.http
      .put(`${environment.apiUrl}/v1/AdditionalField/${payload.id}`, payload, {
        headers,
      })
      .subscribe({
        next: (response) => {
          console.log('Additional field updated successfully:', response);
          this.fetchAdditionalFields();
          this.ToastserviceService.showToast(
            'success',
            'Field Updated Successfully'
          );
        },
        error: (error) => {
          console.error('Error updating additional field:', error);
          this.ToastserviceService.showToast('error', 'Field Update Failed');
        },
      });
  }

  deleteAdditionalField(id: number): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .delete(`${environment.apiUrl}/v1/AdditionalField/${id}`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Additional field deleted successfully:', response);
          this.fetchAdditionalFields();
          this.ToastserviceService.showToast(
            'success',
            'Field Deleted Successfully'
          );
        },
        error: (error) => {
          console.error('Error deleting additional field:', error);
          this.ToastserviceService.showToast('error', 'Field Deletion Failed');
        },
      });
  }

  confirmDelete(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteAdditionalField(id);
      }
    });
  }

  openEditPopup(additionalField: any) {
    Swal.fire({
      title: 'Edit Additional Field',
      html: `
        <input id="additionalFieldName" class="swal2-input" value="${additionalField.additionalFieldName}" placeholder="Field Name">
        <div class="swal2-checkbox-container">
          <input type="checkbox" id="additionalFieldRequiredDataType" class="swal2-checkbox" 
            ${additionalField.additionalFieldRequiredDataType ? 'checked' : ''}>
          <label for="additionalFieldRequiredDataType">Required Data Type</label>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const additionalFieldName = (
          document.getElementById('additionalFieldName') as HTMLInputElement
        ).value;
        const additionalFieldRequiredDataType = (
          document.getElementById(
            'additionalFieldRequiredDataType'
          ) as HTMLInputElement
        ).checked;

        if (!additionalFieldName) {
          Swal.showValidationMessage('Field name is required');
          return null;
        }

        return {
          id: additionalField.id,
          additionalFieldName,
          additionalFieldRequiredDataType,
          createdAt: additionalField.createdAt,
          createdBy: additionalField.createdBy,
          updatedAt: new Date().toISOString(),
          updatedBy: 0, // Replace with actual user ID
          isDeleted: additionalField.isDeleted,
        };
      },
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.updateAdditionalField(result.value);
      }
    });
  }

  onCancel(): void {
    this.additionalFieldForm.reset();
  }
}
