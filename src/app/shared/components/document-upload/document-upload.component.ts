import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface DocumentType {
  id: number;
  documentName: string;
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
  isDeleted: boolean;
}

interface UploadedDocument {
  id: number;
  poId: number;
  stageId: number;
  documentTypeId: number;
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

interface DocumentGroup {
  documentType: DocumentType;
  uploadedDocuments: UploadedDocument[];
}

interface DocumentReviewPayload {
  id: number;
  isApproved: boolean;
  isRejected: boolean;
  reviewedBy: number;
  docReviewedBy: string;
  status: string;
  reviewRemark: string;
  docReviewDate: string;
}

@Component({
  selector: 'app-document-upload',
  standalone: false,
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.css']
})
export class DocumentUploadComponent implements OnInit {
  documentTypes: DocumentType[] = [];
  uploadedDocuments: UploadedDocument[] = [];
  groupedDocuments: DocumentGroup[] = [];
  expandedGroups: { [key: number]: boolean } = {};
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchDocumentTypes();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  fetchDocumentTypes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<DocumentType[]>(`${environment.apiUrl}/v1/DocumentType`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError.bind(this)),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (documentTypes) => {
          console.log('Fetched document types:', documentTypes);
          this.documentTypes = documentTypes;
          // Initialize expanded state for each document type
          this.documentTypes.forEach(docType => {
            this.expandedGroups[docType.id] = false;
          });
          this.fetchUploadedDocuments();
        }
      });
  }

  fetchUploadedDocuments(): void {
    this.isLoading = true;
    const payload = {};

    this.http.post<UploadedDocument[]>(
      `${environment.apiUrl}/v1/UploadedDocument/GetDocumentFlows`,
      payload,
      { headers: this.getHeaders() }
    )
    .pipe(
      catchError(this.handleError.bind(this)),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: (uploadedDocs) => {
        console.log('Fetched uploaded documents:', uploadedDocs);
        this.uploadedDocuments = uploadedDocs;
        this.groupDocuments();
      }
    });
  }

  private groupDocuments(): void {
    // Reset grouped documents
    this.groupedDocuments = [];

    // Create a group for each document type
    this.documentTypes.forEach(docType => {
      // Filter uploaded documents that match this document type's id
      const matchingDocs = this.uploadedDocuments.filter(doc => 
        doc.documentTypeId === docType.id
      );

      this.groupedDocuments.push({
        documentType: docType,
        uploadedDocuments: matchingDocs
      });
    });

    console.log('Grouped documents:', this.groupedDocuments);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMsg = 'An error occurred. Please try again later.';
    if (error.error instanceof ErrorEvent) {
      errorMsg = `Error: ${error.error.message}`;
    } else {
      errorMsg = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    this.errorMessage = errorMsg;
    return throwError(() => new Error(errorMsg));
  }

  toggleGroup(documentId: number): void {
    this.expandedGroups[documentId] = !this.expandedGroups[documentId];
  }

  isGroupExpanded(documentId: number): boolean {
    return this.expandedGroups[documentId] === true;
  }

  getDocumentCount(documentId: number): number {
    const group = this.groupedDocuments.find(g => g.documentType.id === documentId);
    return group ? group.uploadedDocuments.length : 0;
  }

  async reviewDocument(document: UploadedDocument, isApproved: boolean): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      const currentUser = localStorage.getItem('userId') || '1'; // Get actual user ID from your auth service
      const currentUserName = localStorage.getItem('userName') || '1'; // Get actual username

      const payload: DocumentReviewPayload = {
        id: document.id,
        isApproved: isApproved,
        isRejected: !isApproved,
        reviewedBy: parseInt(currentUser),
        docReviewedBy: currentUserName,
        status: isApproved ? 'Approved' : 'Rejected',
        reviewRemark: isApproved ? 'Document approved' : 'Document rejected',
        docReviewDate: new Date().toISOString()
      };

      await this.http.patch(
        `${environment.apiUrl}/v1/UploadedDocument/${document.id}`,
        payload,
        { headers: this.getHeaders() }
      ).pipe(
        catchError(this.handleError.bind(this)),
        finalize(() => this.isLoading = false)
      ).toPromise();

      // Update local state
      const updatedDoc = this.uploadedDocuments.find(doc => doc.id === document.id);
      if (updatedDoc) {
        Object.assign(updatedDoc, {
          isApproved: payload.isApproved,
          isRejected: payload.isRejected,
          status: payload.status,
          reviewedBy: payload.reviewedBy,
          docReviewedBy: payload.docReviewedBy,
          reviewRemark: payload.reviewRemark,
          docReviewDate: payload.docReviewDate
        });
      }

      // Refresh the document list
      this.groupDocuments();

    } catch (error) {
      console.error('Error reviewing document:', error);
      this.errorMessage = 'Failed to review document. Please try again.';
    }
  }

  async uploadDocument(event: Event, documentTypeId: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      console.error('No file selected');
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';

      // Prepare form data for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Populate other required fields from local storage or default values
      const currentUser = localStorage.getItem('userId') || '1';
      const currentDate = new Date().toISOString();

      formData.append('isApproved', 'false');
      formData.append('isDocSubmited', 'false');
      formData.append('isRejected', 'false');
      formData.append('docReviewedBy', currentUser);
      formData.append('uploadedDocumentName', file.name);
      formData.append('uploadedDocLocation', 'new');
      formData.append('reviewedBy', currentUser);
      formData.append('uploadedDate', currentDate);
      formData.append('docUploadedBy', currentUser);
      formData.append('documentTypeId', documentTypeId.toString());
      formData.append('status', 'Pending');
      formData.append('uploadedBy', currentUser);
      formData.append('reviewRemark', 'Initial upload');
      formData.append('stageId', '2'); // Default stage, adjust as needed
      formData.append('poId', '3'); // Default PO ID, adjust as needed
      formData.append('id', '0');
      formData.append('docReviewDate', currentDate);

      // Get headers (note: for file upload, do not set Content-Type manually)
      const headers = new HttpHeaders()
        .set('Authorization', `Bearer ${localStorage.getItem('authToken')}`);

      // Upload document
      await this.http.post(
        `${environment.apiUrl}/v1/UploadedDocument/CreateUploadDocFlow`,
        formData,
        { headers }
      ).pipe(
        catchError(this.handleError.bind(this)),
        finalize(() => this.isLoading = false)
      ).toPromise();

      // Refresh document list after successful upload
      this.fetchUploadedDocuments();

      // Optional: show success message
      alert('Document uploaded successfully');

    } catch (error) {
      console.error('Document upload failed:', error);
      this.errorMessage = 'Failed to upload document. Please try again.';
    }
  }

  async approveDocument(document: UploadedDocument): Promise<void> {
    await this.reviewDocument(document, true);
  }

  async rejectDocument(document: UploadedDocument): Promise<void> {
    await this.reviewDocument(document, false);
  }

  submit(document: UploadedDocument): void {
    console.log('Submitting document:', document);
    // Implement your submit logic here
  }
}