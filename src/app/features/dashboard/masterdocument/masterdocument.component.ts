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
  selector: 'app-masterdocument',
  standalone: false,
  templateUrl: './masterdocument.component.html',
  styleUrls: ['./masterdocument.component.css'],
})
export class MasterdocumentComponent {
  documentTypeForm!: FormGroup;
  userId: string | null | undefined;
  rowData: any[] = [];
  isSubmitting = false;

  public modules: Module[] = [ClientSideRowModelModule];

  columnDefs: ColDef[] = [
    // { field: 'id', headerName: 'ID', filter: 'agNumberColumnFilter' },
    { field: 'sno', headerName: 'S No', valueGetter: 'node.rowIndex + 1' },
    {
      field: 'documentName',
      headerName: 'Document Type',
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
    this.documentTypeForm = this.fb.group({
      documentName: ['', [Validators.required, Validators.minLength(3)]],
    });
    this.userId = this.authService.getUserId();
    // console.log(this.userId);
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

  onSubmit(): void {
    if (this.documentTypeForm.valid) {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.isSubmitting = true;

      const payload = {
        id: 0,
        documentName: this.documentTypeForm.value.documentName?.trim(),
        createdAt: new Date().toISOString(),
        createdBy: this.userId,
        updatedAt: new Date().toISOString(),
        updatedBy: this.userId,
        isDeleted: false,
      };

      this.http
        .post(`${environment.apiUrl}/v1/DocumentType`, payload, { headers })
        .subscribe({
          next: (response) => {
            console.log('Document Created:', response);
            this.documentTypeForm.reset();
            this.fetchDocumentTypes();
            this.ToastserviceService.showToast(
              'success',
              'Document Created Successfully'
            );
          },
          error: (err) => {
            console.error('Error creating document:', err);
            this.ToastserviceService.showToast(
              'error',
              'Document Creation Failed'
            );
          },
          complete: () => {
            this.isSubmitting = false;
          },
        });
    }
  }

  openEditPopup(document: any): void {
    Swal.fire({
      title: 'Edit Document',
      html: `
        <input appTrimInput id="documentId" class="swal2-input" type="text" value="${document.id}" disabled placeholder="Document ID">
        <input appTrimInput id="documentName" class="swal2-input" type="text" value="${document.documentName}" placeholder="Document Name">
        <input appTrimInput id="createdAt" class="swal2-input" type="text" value="${document.createdAt}" disabled placeholder="Created At">
        <input appTrimInput id="createdBy" class="swal2-input" type="text" value="${document.createdBy}" disabled placeholder="Created By">
      `,
      focusConfirm: false,
      preConfirm: () => {
        const documentNameInput = Swal.getPopup()?.querySelector('#documentName') as HTMLInputElement;
  
        if (!documentNameInput?.value) {
          Swal.showValidationMessage('Document Name is required');
          return null;
        }
  
        return { documentName: documentNameInput.value };
      },
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        // console.log('Updating document with data:', result.value);
        this.updateDocument(document.id, result.value);
      } else {
        // console.log('Edit canceled or no data provided'); // Debugging
      }
    });
  }
  

  updateDocument(
    documentId: number,
    updatedData: { documentName: string }
  ): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

    const payload = {
      id: documentId,
      documentName: updatedData.documentName,
      createdAt: new Date().toISOString(), // Use current date if required
      createdBy: this.userId,
      updatedAt: new Date().toISOString(),
      updatedBy: this.userId,
      isDeleted: false,
    };

    this.http
      .put(`${environment.apiUrl}/v1/DocumentType/${documentId}`, payload, {
        headers,
      })
      .subscribe({
        next: () => {
          this.ToastserviceService.showToast(
            'success',
            'Document Updated Successfully'
          );
          this.fetchDocumentTypes(); // Refresh data after update
        },
        error: (error) => {
          console.error('Error updating Document:', error);
          this.ToastserviceService.showToast('error', 'Document Update Failed');
        },
      });
  }

  confirmDelete(documentId: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteDocument(documentId);
      }
    });
  }

  deleteDocument(documentId: number): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .delete(`${environment.apiUrl}/v1/DocumentType/${documentId}`, {
        headers,
      })
      .subscribe({
        next: () => {
          this.ToastserviceService.showToast(
            'success',
            'Document Deleted Successfully'
          );
          this.fetchDocumentTypes(); // Refresh data after deletion
        },
        error: (error) => {
          console.error('Error deleting Document:', error);
          this.ToastserviceService.showToast(
            'error',
            'Document Deletion Failed'
          );
        },
      });
  }

  onCancel(): void {
    this.documentTypeForm.reset();
  }
}
