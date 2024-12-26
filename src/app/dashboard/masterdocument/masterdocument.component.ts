import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environment/environment';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

@Component({
  selector: 'app-masterdocument',
  standalone: false,
  templateUrl: './masterdocument.component.html',
  styleUrls: ['./masterdocument.component.css'],
})
export class MasterdocumentComponent {
  documentTypeForm!: FormGroup;
  userId: string | null = null;
  rowData: any[] = [];
  isSubmitting = false;

   public modules: Module[] = [ClientSideRowModelModule];

  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', filter: 'agNumberColumnFilter' },
    { field: 'documentName', headerName: 'Document Type', filter: 'agTextColumnFilter' },
    { field: 'createdAt', headerName: 'Created At', filter: 'agDateColumnFilter' },
    { field: 'createdBy', headerName: 'Created By', filter: 'agNumberColumnFilter' },
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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.documentTypeForm = this.fb.group({
      documentName: ['', [Validators.required, Validators.minLength(3)]],
    });

    this.authService.getUserId().subscribe(
      (response) => {
        this.userId = response.id; // Assuming the API response contains an `id` field
      },
      (error) => {
        console.error('Failed to fetch user ID:', error);
      }
    );

    this.fetchDocumentTypes();
  }

  fetchDocumentTypes(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(`${environment.apiUrl}/v1/DocumentType`, { headers }).subscribe({
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
        documentType: this.documentTypeForm.value.documentName,
        createdAt: new Date().toISOString(),
        createdBy: this.userId ? parseInt(this.userId, 10) : null,
        updatedAt: new Date().toISOString(),
        updatedBy: this.userId ? parseInt(this.userId, 10) : null,
        isDeleted: false,
      };

      this.http.post(`${environment.apiUrl}/v1/DocumentType`, payload, { headers }).subscribe({
        next: (response) => {
          console.log('Document Created:', response);
          this.documentTypeForm.reset();
          this.fetchDocumentTypes();
        },
        error: (err) => {
          console.error('Error creating document:', err);
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    }
  }

  onCancel(): void {
    this.documentTypeForm.reset();
  }
}
