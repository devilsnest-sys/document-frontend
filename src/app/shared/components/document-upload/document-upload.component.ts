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

  submit(document: UploadedDocument): void {
    console.log('Submitting document:', document);
    // Implement your submit logic here
  }
}