import { Component, OnInit, Input } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import Swal from 'sweetalert2';

interface DocumentRow {
  id: string;
  documentName: string;
  files: File[];
  isUploading: boolean;
  uploadProgress: number;
}

interface UploadedDocument {
  id: number;
  poId: number;
  stageId: number;
  documentTypeId: string;
  uploadedDocumentName: string;
  uploadedBy: number;
  uploadedDate: string;
  reviewedBy: number;
  docReviewDate: string;
  status: string;
  reviewRemark: string;
  uploadedDocLocation: string;
  isApproved: boolean;
  isRejected: boolean;
  isDocSubmited: boolean;
  docUploadedBy: string;
  docReviewedBy: string;
}

@Component({
  selector: 'app-other-doc-upload',
  standalone: false,
  templateUrl: './other-doc-upload.component.html',
  styleUrl: './other-doc-upload.component.css'
})
export class OtherDocUploadComponent implements OnInit {
  @Input() poId: string | null = null;
  @Input() stageId: number = 16; // Fixed stage ID as per requirement
  
  documentRows: DocumentRow[] = [];
  uploadedDocuments: UploadedDocument[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  userType: string | null = '';

  constructor(
    private http: HttpClient,
    private toastService: ToastserviceService
  ) {}

  ngOnInit(): void {
    this.userType = localStorage.getItem('userType');
    console.log('OtherDocUpload initialized with PO ID:', this.poId, 'Stage ID:', this.stageId);
    console.log('Current User Type:', this.userType);
    
    if (this.poId) {
      this.fetchUploadedDocuments();
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Add new document row
  addNewDocumentRow(): void {
    const newRow: DocumentRow = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentName: '',
      files: [],
      isUploading: false,
      uploadProgress: 0
    };
    this.documentRows.push(newRow);
  }

  // Remove document row
  removeDocumentRow(rowId: string): void {
    Swal.fire({
      title: 'Remove Document Row',
      text: 'Are you sure you want to remove this document row?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.documentRows = this.documentRows.filter(row => row.id !== rowId);
        this.toastService.showToast('success', 'Document row removed');
      }
    });
  }

  // Handle file selection
  onFilesSelected(event: Event, rowId: string): void {
    const input = event.target as HTMLInputElement;
    const row = this.documentRows.find(r => r.id === rowId);
    
    if (input.files && row) {
      const filesArray = Array.from(input.files);
      row.files = [...row.files, ...filesArray];
      
      this.toastService.showToast('success', `${filesArray.length} file(s) added`);
    }
  }

  // Remove specific file from row
  removeFile(rowId: string, fileIndex: number): void {
    const row = this.documentRows.find(r => r.id === rowId);
    if (row) {
      row.files.splice(fileIndex, 1);
      this.toastService.showToast('error', 'File removed');
    }
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Upload all documents
  async uploadAllDocuments(): Promise<void> {
    // Validation
    if (this.documentRows.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Documents',
        text: 'Please add at least one document row.',
      });
      return;
    }

    const invalidRows = this.documentRows.filter(row => !row.documentName.trim() || row.files.length === 0);
    if (invalidRows.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Information',
        text: 'Please provide document name and select files for all rows.',
      });
      return;
    }

    // Confirmation
    const result = await Swal.fire({
      title: 'Upload Documents',
      html: `
        <p>You are about to upload <strong>${this.documentRows.length}</strong> document(s) with a total of <strong>${this.getTotalFilesCount()}</strong> file(s).</p>
        <p>Do you want to proceed?</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Upload All',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
    });

    if (!result.isConfirmed) return;

    // Upload each document row
    this.isLoading = true;
    let successCount = 0;
    let failCount = 0;

    for (const row of this.documentRows) {
      row.isUploading = true;
      
      try {
        await this.uploadDocumentRow(row);
        successCount++;
        row.uploadProgress = 100;
      } catch (error) {
        console.error(`Error uploading ${row.documentName}:`, error);
        failCount++;
      } finally {
        row.isUploading = false;
      }
    }

    this.isLoading = false;

    // Show results
    if (failCount === 0) {
      Swal.fire({
        icon: 'success',
        title: 'Upload Complete',
        text: `All ${successCount} document(s) uploaded successfully!`,
      }).then(() => {
        this.documentRows = [];
        this.fetchUploadedDocuments();
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Upload Partially Complete',
        html: `
          <p>Success: ${successCount} document(s)</p>
          <p>Failed: ${failCount} document(s)</p>
        `,
      }).then(() => {
        this.documentRows = this.documentRows.filter(row => row.isUploading || row.uploadProgress < 100);
        this.fetchUploadedDocuments();
      });
    }
  }

  // Upload single document row with multiple files
  private async uploadDocumentRow(row: DocumentRow): Promise<void> {
    for (const file of row.files) {
      const formData = new FormData();
      formData.append('file', file);

      const currentUser = localStorage.getItem('userId') || '1';
      const currentDate = new Date().toISOString();

      formData.append('isApproved', 'false');
      formData.append('isDocSubmited', 'true');
      formData.append('isRejected', 'false');
      formData.append('uploadedDocumentName', `${row.documentName} - ${file.name}`);
      formData.append('uploadedDate', currentDate);
      formData.append('docUploadedBy', this.userType || '');
      formData.append('documentTypeId', '3');
      formData.append('status', 'Pending');
      formData.append('uploadedBy', currentUser);
      formData.append('stageId', this.stageId.toString());
      formData.append('poId', this.poId || '');
      formData.append('id', '0');
      formData.append('reviewRemark', row.documentName);

      const headers = new HttpHeaders().set(
        'Authorization',
        `Bearer ${localStorage.getItem('authToken')}`
      );

      await this.http
        .post(
          `${environment.apiUrl}/v1/UploadedDocument/CreateUploadDocFlow`,
          formData,
          { headers }
        )
        .pipe(
          catchError((error) => {
            console.error('Upload error:', error);
            return throwError(() => error);
          })
        )
        .toPromise();
    }
  }

  // Get total files count
  getTotalFilesCount(): number {
    return this.documentRows.reduce((sum, row) => sum + row.files.length, 0);
  }

  // Fetch uploaded documents with role-based filtering
  fetchUploadedDocuments(): void {
    if (!this.poId) return;

    this.isLoading = true;

    const payload = {
      stageId: this.stageId,
      PoId: this.poId,
    };

    this.http
      .post<UploadedDocument[]>(
        `${environment.apiUrl}/v1/UploadedDocument/GetDocumentFlows`,
        payload,
        { headers: this.getHeaders() }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching documents:', error);
          return throwError(() => error);
        }),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (documents) => {
          // Apply role-based filtering
          this.uploadedDocuments = this.filterDocumentsByRole(documents);
          console.log('Fetched and filtered documents:', this.uploadedDocuments);
        },
        error: (error) => {
          console.error('Error:', error);
          this.toastService.showToast('error', 'Failed to fetch documents');
        },
      });
  }

  // Filter documents based on user role
  private filterDocumentsByRole(documents: UploadedDocument[]): UploadedDocument[] {
    const currentUserType = this.userType?.toLowerCase();
    
    if (!currentUserType) {
      return documents;
    }

    return documents.filter(doc => {
      const uploadedByType = doc.docUploadedBy?.toLowerCase();
      
      // If current user is 'user' (admin/user)
      if (currentUserType === 'user' || currentUserType === 'admin') {
        return true; // Users can see all documents
      }
      
      // If current user is 'vendor'
      if (currentUserType === 'vendor') {
        // Vendors can only see documents uploaded by vendors
        // Documents uploaded by 'user' should be hidden from vendors
        return uploadedByType === 'vendor';
      }
      
      return true; // Default: show all
    });
  }

  // Optional: Add a method to check if document should be visible
  canViewDocument(doc: UploadedDocument): boolean {
    const currentUserType = this.userType?.toLowerCase();
    const uploadedByType = doc.docUploadedBy?.toLowerCase();
    
    // Users can see everything
    if (currentUserType === 'user' || currentUserType === 'admin') {
      return true;
    }
    
    // Vendors can only see vendor-uploaded documents
    if (currentUserType === 'vendor') {
      return uploadedByType === 'vendor';
    }
    
    return true;
  }

  // Get document visibility label for UI
  getDocumentVisibilityLabel(doc: UploadedDocument): string {
    const uploadedByType = doc.docUploadedBy?.toLowerCase();
    
    if (uploadedByType === 'user' || uploadedByType === 'admin') {
      return 'Internal Document';
    } else if (uploadedByType === 'vendor') {
      return 'Vendor Document';
    }
    
    return 'Document';
  }

  // View document
  viewDocument(documentId: number): void {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      this.toastService.showToast('error', 'Please log in to view documents');
      return;
    }

    const documentUrl = `${environment.apiUrl}/v1/PurchaseOrder/view/${encodeURIComponent(documentId)}`;

    fetch(documentUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const newWindow = window.open(blobUrl, '_blank');
        
        if (!newWindow) {
          this.toastService.showToast('error', 'Please allow popups to view the document');
          URL.revokeObjectURL(blobUrl);
          return;
        }
        
        newWindow.addEventListener('load', () => {
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        });
      })
      .catch(error => {
        console.error('Error viewing document:', error);
        this.toastService.showToast('error', 'Error viewing document');
      });
  }

  // Download document
  downloadDocument(documentId: number, fileName: string): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/octet-stream',
    });

    const url = `${environment.apiUrl}/v1/PurchaseOrder/download/${documentId}`;

    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = fileName || `document_${documentId}`;
        a.click();
        URL.revokeObjectURL(objectUrl);
        
        this.toastService.showToast('success', 'Document downloaded');
      },
      error: (err) => {
        console.error('Error downloading document:', err);
        this.toastService.showToast('error', 'Failed to download document');
      },
    });
  }

  // Delete uploaded document
  deleteDocument(doc: UploadedDocument): void {
    Swal.fire({
      title: 'Delete Document',
      text: `Are you sure you want to delete "${doc.uploadedDocumentName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        // Implement delete API call here if available
        this.toastService.showToast('error', 'Delete functionality to be implemented');
      }
    });
  }

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'badge-success';
      case 'rejected':
        return 'badge-danger';
      case 'pending':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  // Format date
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}