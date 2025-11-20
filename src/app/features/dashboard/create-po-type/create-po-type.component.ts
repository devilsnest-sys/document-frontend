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
  selector: 'app-create-po-type',
  standalone: false,
  
  templateUrl: './create-po-type.component.html',
  styleUrl: './create-po-type.component.css'
})
export class CreatePoTypeComponent {
  poType!: FormGroup;
  userId: string | null | undefined;
  rowData: any[] = [];
  isSubmitting = false;

  public modules: Module[] = [ClientSideRowModelModule];

  columnDefs: ColDef[] = [
    { field: 'sno', headerName: 'S No', valueGetter: 'node.rowIndex + 1' },
    {
      field: 'poTypeName',
      headerName: 'PO Type',
      filter: 'agTextColumnFilter',
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      filter: 'agDateColumnFilter',
    },
    {
      field: 'createdByUsername',
      headerName: 'Created By',
      filter: 'agNumberColumnFilter',
    },
    {
      field: 'action',
      headerName: 'Action',
      cellRenderer: (params: any) => {
        return `
        <button class="btn-action edit-btn" title="Edit">
          <span class="material-icons">edit</span>
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
    this.poType = this.fb.group({
      potypeName: ['', [Validators.required, Validators.minLength(2)]],
    });
    this.userId = this.authService.getUserId();
    this.fetchpotypes();
  }

  fetchpotypes(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .get<any[]>(`${environment.apiUrl}/v1/potype`, { headers })
      .subscribe({
        next: (data) => {
          this.rowData = data;
          console.log('potypes fetched successfully:', data);
        },
        error: (error) => {
          console.error('Error fetching potypes:', error);
        },
      });
  }

  onSubmit(): void {
    if (this.poType.valid) {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.isSubmitting = true;

      const payload = {
        id: 0,
        potypeName: this.poType.value.potypeName?.trim(),
        createdBy: this.userId, 
      createdAt: new Date().toISOString(),
      };

      this.http
        .post(`${environment.apiUrl}/v1/potype`, payload, { headers })
        .subscribe({
          next: (response) => {
            console.log('potype Created:', response);
            this.poType.reset();
            this.fetchpotypes();
           
            this.ToastserviceService.showToast(
              'success',
              'potype Created Successfully'
            );
          },
          error: (err) => {
            console.error('Error creating potype:', err);
            this.ToastserviceService.showToast(
              'error',
              'potype Creation Failed'
            );
          },
          complete: () => {
            this.isSubmitting = false;
          },
        });
    }
  }

  openEditPopup(potype: any): void {
    Swal.fire({
      title: 'Edit Potype',
      html: `
        <input appTrimInput id="potypeName" class="swal2-input" type="text" value="${potype.poTypeName}" placeholder="potype Name">`,
      focusConfirm: false,
      preConfirm: () => {
        const potypeNameInput = Swal.getPopup()?.querySelector('#potypeName') as HTMLInputElement;
  
        if (!potypeNameInput?.value) {
          Swal.showValidationMessage('potype Name is required');
          return null;
        }
  
        return { potypeName: potypeNameInput.value };
      },
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.updatepotype(potype.id, result.value);
      }
    });
  }

  updatepotype(
    potypeId: number,
    updatedData: { potypeName: string }
  ): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

    const payload = {
      id: potypeId,
      potypeName: updatedData.potypeName,
      createdBy: this.userId, 
      createdAt: new Date().toISOString(),
    };

    this.http
      .put(`${environment.apiUrl}/v1/potype/${potypeId}`, payload, {
        headers,
      })
      .subscribe({
        next: () => {
          this.ToastserviceService.showToast(
            'success',
            'potype Updated Successfully'
          );
          this.fetchpotypes();
        },
        error: (error) => {
          console.error('Error updating potype:', error);
          this.ToastserviceService.showToast('error', 'potype Update Failed');
        },
      });
  }

  confirmDelete(potypeId: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deletepotype(potypeId);
      }
    });
  }

  deletepotype(potypeId: number): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .delete(`${environment.apiUrl}/v1/potype/${potypeId}`, {
        headers,
      })
      .subscribe({
        next: () => {
          this.ToastserviceService.showToast(
            'success',
            'potype Deleted Successfully'
          );
          this.fetchpotypes();
        },
        error: (error) => {
          console.error('Error deleting potype:', error);
          this.ToastserviceService.showToast(
            'error',
            'potype Deletion Failed'
          );
        },
      });
  }

  onCancel(): void {
    this.poType.reset();
  }
}
