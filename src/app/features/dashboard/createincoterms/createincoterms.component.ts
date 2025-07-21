import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environment/environment';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-createincoterms',
  standalone: false,

  templateUrl: './createincoterms.component.html',
  styleUrl: './createincoterms.component.css',
})
export class CreateincotermsComponent {
  incotermsForm!: FormGroup;
  userId: string | null | undefined;
  rowData: any[] = [];
  isSubmitting = false;

  public modules: Module[] = [ClientSideRowModelModule];

  columnDefs: ColDef[] = [
    { field: 'sno', headerName: 'S No', valueGetter: 'node.rowIndex + 1' },
    {
      field: 'incoTermsName',
      headerName: 'Incoterms',
      filter: 'agTextColumnFilter',
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
    private authService: AuthService,
    private ToastserviceService: ToastserviceService
  ) {}

  ngOnInit(): void {
    this.incotermsForm = this.fb.group({
      incoTermsName: ['', [Validators.required, Validators.minLength(2)]],
    });
    this.userId = this.authService.getUserId();
    this.fetchIncoterms();
  }

  fetchIncoterms(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .get<any[]>(`${environment.apiUrl}/v1/incoterms`, { headers })
      .subscribe({
        next: (data) => {
          this.rowData = data;
          console.log('Incoterms fetched successfully:', data);
        },
        error: (error) => {
          console.error('Error fetching incoterms:', error);
        },
      });
  }

  onSubmit(): void {
    if (this.incotermsForm.valid) {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.isSubmitting = true;

      const payload = {
        id: 0,
        incoTermsName: this.incotermsForm.value.incoTermsName?.trim(),
      };

      this.http
        .post(`${environment.apiUrl}/v1/incoterms`, payload, { headers })
        .subscribe({
          next: (response) => {
            console.log('Incoterm Created:', response);
            this.incotermsForm.reset();
            this.fetchIncoterms();
            this.ToastserviceService.showToast(
              'success',
              'Incoterm Created Successfully'
            );
          },
          error: (err) => {
            console.error('Error creating incoterm:', err);
            this.ToastserviceService.showToast(
              'error',
              'Incoterm Creation Failed'
            );
          },
          complete: () => {
            this.isSubmitting = false;
          },
        });
    }
  }

  openEditPopup(incoterm: any): void {
    Swal.fire({
      title: 'Edit Incoterm',
      html: `
        <input appTrimInput id="incotermId" class="swal2-input" type="text" value="${incoterm.id}" disabled placeholder="Incoterm ID">
        <input appTrimInput id="incoTermsName" class="swal2-input" type="text" value="${incoterm.incoTermsName}" placeholder="Incoterm Name">`,
      focusConfirm: false,
      preConfirm: () => {
        const incoTermsNameInput = Swal.getPopup()?.querySelector('#incoTermsName') as HTMLInputElement;
  
        if (!incoTermsNameInput?.value) {
          Swal.showValidationMessage('Incoterm Name is required');
          return null;
        }
  
        return { incoTermsName: incoTermsNameInput.value };
      },
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.updateIncoterm(incoterm.id, result.value);
      }
    });
  }

  updateIncoterm(
    incotermId: number,
    updatedData: { incoTermsName: string }
  ): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

    const payload = {
      id: incotermId,
      incoTermsName: updatedData.incoTermsName,
    };

    this.http
      .put(`${environment.apiUrl}/v1/incoterms/${incotermId}`, payload, {
        headers,
      })
      .subscribe({
        next: () => {
          this.ToastserviceService.showToast(
            'success',
            'Incoterm Updated Successfully'
          );
          this.fetchIncoterms();
        },
        error: (error) => {
          console.error('Error updating Incoterm:', error);
          this.ToastserviceService.showToast('error', 'Incoterm Update Failed');
        },
      });
  }

  confirmDelete(incotermId: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteIncoterm(incotermId);
      }
    });
  }

  deleteIncoterm(incotermId: number): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .delete(`${environment.apiUrl}/v1/incoterms/${incotermId}`, {
        headers,
      })
      .subscribe({
        next: () => {
          this.ToastserviceService.showToast(
            'success',
            'Incoterm Deleted Successfully'
          );
          this.fetchIncoterms();
        },
        error: (error) => {
          console.error('Error deleting Incoterm:', error);
          this.ToastserviceService.showToast(
            'error',
            'Incoterm Deletion Failed'
          );
        },
      });
  }

  onCancel(): void {
    this.incotermsForm.reset();
  }
}
