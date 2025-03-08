import { Component, Input, OnInit } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import Swal from 'sweetalert2';

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
  userNameAccToUploadDoc: string;
  vendorNameAccToReviewDoc: string;
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
  styleUrls: ['./document-upload.component.css'],
})
export class DocumentUploadComponent implements OnInit {
  @Input() stageNumber!: number;

  documentTypes: DocumentType[] = [];
  uploadedDocuments: UploadedDocument[] = [];
  groupedDocuments: DocumentGroup[] = [];
  expandedGroups: { [key: number]: boolean } = {};
  isLoading: boolean = false;
  errorMessage: string = '';
  userType: string | null = '';
  selectedFile: File | null = null;
  
  constructor(private http: HttpClient, private toasService : ToastserviceService) {}

  ngOnInit(): void {
    this.userType = localStorage.getItem('userType');
    this.fetchDocumentTypes();
    console.log('this is stage number',this.stageNumber);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }
  isGroupVisible(group: any): boolean {
    // Return false if any document is approved
    if (
      group.uploadedDocuments.some(
        (doc: { isApproved: boolean }) => doc.isApproved
      )
    ) {
      return false;
    }

    // Return true if any document is rejected or group has no documents and is expanded
    return (
      group.uploadedDocuments.some(
        (doc: { isRejected: boolean }) => doc.isRejected
      ) ||
      (group.uploadedDocuments.length === 0 &&
        this.isGroupExpanded(group.documentType.id))
    );
  }
  fetchDocumentTypes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http
      .get<DocumentType[]>(
        `${environment.apiUrl}/v1/document-selection/document/${this.stageNumber}`,
        { headers: this.getHeaders() }
      )
      .pipe(
        catchError(this.handleError.bind(this)),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (documentTypes) => {
          console.log('Fetched document types:', documentTypes);
          this.documentTypes = documentTypes;
          // Initialize expanded state for each document type
          this.documentTypes.forEach((docType) => {
            this.expandedGroups[docType.id] = false;
          });
          this.fetchUploadedDocuments();
        },
      });
  }

  fetchUploadedDocuments(): void { 
    this.isLoading = true;
    
    // Constructing the payload with stageId and documentId
    const payload = {
      stageId: this.stageNumber,  // Using the @Input() stageNumber
      // documentId: this.selectedDocumentId // Ensure this is set somewhere
    };
  
    this.http
      .post<UploadedDocument[]>(
        `${environment.apiUrl}/v1/UploadedDocument/GetDocumentFlows`,
        payload,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (uploadedDocs) => {
          console.log('Fetched uploaded documents:', uploadedDocs);
          this.uploadedDocuments = uploadedDocs;
          this.groupDocuments();
        },
      });
  }
  

  private groupDocuments(): void {
    // Reset grouped documents
    this.groupedDocuments = [];

    // Create a group for each document type
    this.documentTypes.forEach((docType) => {
      // Filter uploaded documents that match this document type's id
      const matchingDocs = this.uploadedDocuments.filter(
        (doc) => doc.documentTypeId === docType.id
      );

      this.groupedDocuments.push({
        documentType: docType,
        uploadedDocuments: matchingDocs,
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
    const group = this.groupedDocuments.find(
      (g) => g.documentType.id === documentId
    );
    return group ? group.uploadedDocuments.length : 0;
  }

  async reviewDocument(
    document: UploadedDocument,
    isApproved: boolean,
    reviewRemark: string = ''
  ): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      const currentUser = localStorage.getItem('userId') || '1'; // Get actual user ID from your auth service
      const currentUserName = localStorage.getItem('userName') || '1'; // Get actual username
      const currentUserType = localStorage.getItem('userType') || null;
      
      // Use provided review remark or default based on approval status
      const finalReviewRemark = reviewRemark || (isApproved ? 'Document approved' : 'Document rejected');
      
      const payload: DocumentReviewPayload = {
        id: document.id,
        isApproved: isApproved,
        isRejected: !isApproved,
        reviewedBy: parseInt(currentUser),
        docReviewedBy: currentUserType!,
        status: isApproved ? 'Approved' : 'Rejected',
        reviewRemark: finalReviewRemark,
        docReviewDate: new Date().toISOString(),
      };

      await this.http
        .patch(
          `${environment.apiUrl}/v1/UploadedDocument/${document.id}`,
          payload,
          { headers: this.getHeaders() }
        )
        .pipe(
          catchError(this.handleError.bind(this)),
          finalize(() => (this.isLoading = false))
        )
        .toPromise();

      // Update local state
      const updatedDoc = this.uploadedDocuments.find(
        (doc) => doc.id === document.id
      );
      if (updatedDoc) {
        Object.assign(updatedDoc, {
          isApproved: payload.isApproved,
          isRejected: payload.isRejected,
          status: payload.status,
          reviewedBy: payload.reviewedBy,
          docReviewedBy: payload.docReviewedBy,
          reviewRemark: payload.reviewRemark,
          docReviewDate: payload.docReviewDate,
        });
      }
      this.fetchDocumentTypes();
      // Refresh the document list
      this.groupDocuments();
    } catch (error) {
      console.error('Error reviewing document:', error);
      this.errorMessage = 'Failed to review document. Please try again.';
    }
  }

  handleFileSelect(event: Event, documentTypeId: number): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
    
    if (this.selectedFile) {
      this.confirmUpload(documentTypeId);
    }
  }

  async uploadDocument(documentTypeId: number, reviewRemark: string = ''): Promise<void> {
    if (!this.selectedFile) {
      console.error('No file selected');
      return;
    }
  
    try {
      this.isLoading = true;
      this.errorMessage = '';
  
      const formData = new FormData();
      formData.append('file', this.selectedFile);
  
      const currentUser = localStorage.getItem('userId') || '1';
      const currentDate = new Date().toISOString();
  
      const siteUrl = window.location.href;
      const regex = /\/stages\/(\d+)\/(\d+)/;
      const match = siteUrl.match(regex);
      let value1 = '';
      let value2 = '';
      if (match) {
        value1 = match[1];
        value2 = match[2];
      }
  
      formData.append('isApproved', 'false');
      formData.append('isDocSubmited', 'true');
      formData.append('isRejected', 'false');
      formData.append('uploadedDocumentName', this.selectedFile.name);
      formData.append('uploadedDate', currentDate);
      formData.append('docUploadedBy', localStorage.getItem('userType')?.toString() || '');
      formData.append('documentTypeId', documentTypeId.toString());
      formData.append('status', 'Pending');
      formData.append('uploadedBy', currentUser);
      formData.append('stageId', value1);
      formData.append('poId', value2);
      formData.append('id', '0');
      formData.append('reviewRemark', reviewRemark); // Add the review remark
  
      const headers = new HttpHeaders().set(
        'Authorization',
        `Bearer ${localStorage.getItem('authToken')}`
      );
  
      // Fixed subscription handling
      this.http
        .post(
          `${environment.apiUrl}/v1/UploadedDocument/CreateUploadDocFlow`,
          formData,
          { headers }
        )
        .pipe(
          catchError((error) => {
            console.error('Upload error:', error);
            this.errorMessage = 'Failed to upload document. Please try again.';
            return throwError(() => error);
          }),
          finalize(() => {
            this.isLoading = false;
            // Reset the selected file
            this.selectedFile = null;
            // Reset any file input elements
            const fileInputs = document.querySelectorAll('input[type="file"]');
            fileInputs.forEach((input: Element) => {
              (input as HTMLInputElement).value = '';
            });
          })
        )
        .subscribe({
          next: (response) => {
            console.log('Upload successful:', response);
            this.toasService.showToast("success","Document Uploaded")
            this.fetchUploadedDocuments();
          },
          error: (error) => {
            console.error('Upload error:', error);
            Swal.fire({
              title: 'Error',
              text: 'Failed to upload document. Please try again.',
              icon: 'error'
            });
          }
        });
  
    } catch (error) {
      console.error('Document upload failed:', error);
      this.errorMessage = 'Failed to upload document. Please try again.';
      this.isLoading = false;
    }
  }
  
  async approveDocument(document: UploadedDocument): Promise<void> {
    Swal.fire({
      title: 'Approve Document',
      text: `Are you sure you want to approve ${document.uploadedDocumentName}?`,
      icon: 'question',
      input: 'text',
      inputLabel: 'Review Remark',
      inputPlaceholder: 'Enter your review remark (optional)',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        await this.reviewDocument(document, true, result.value || 'Document approved');
      }
    });
  }

  async rejectDocument(document: UploadedDocument): Promise<void> {
    Swal.fire({
      title: 'Reject Document',
      text: `Are you sure you want to reject ${document.uploadedDocumentName}?`,
      icon: 'warning',
      input: 'text',
      inputLabel: 'Review Remark',
      inputPlaceholder: 'Enter your reason for rejection',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to provide a reason for rejection!';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Reject',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        await this.reviewDocument(document, false, result.value);
      }
    });
  }

  submit(document: UploadedDocument): void {
    console.log('Submitting document:', document);
    // Implement your submit logic here
  }

  viewDocument(documentName: number): void {
    const documentUrl = `${environment.apiUrl}/v1/UploadedDocument/view/${encodeURIComponent(documentName)}`;
  
    fetch(documentUrl)
      .then(response => response.blob()) // Convert response to Blob
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob); // Create a URL for the blob
        window.open(blobUrl, '_blank'); // Open the file in a new tab
      })
      .catch(error => console.error('Error fetching document:', error));
  }
  
  downloadDocument(documentName: number): void {
    const documentUrl = `${
      environment.apiUrl
    }/v1/UploadedDocument/download/${encodeURIComponent(documentName)}`;

    // Create an invisible anchor element to trigger the download
    const link = document.createElement('a');
    link.href = documentUrl;
    link.setAttribute('download', `document_${document}`); // Set a generic filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // Clean up
  }

  confirmUpload(documentTypeId: number): void {
    if (!this.selectedFile) {
      console.error('No file selected');
      return;
    }
    
    console.log('confirmUpload called', documentTypeId);
    
    Swal.fire({
      title: 'Upload Confirmation',
      text: `Are you sure you want to upload ${this.selectedFile.name}?`,
      icon: 'question',
      input: 'text',
      inputLabel: 'Review Remark',
      inputPlaceholder: 'Enter a review remark (optional)',
      showCancelButton: true,
      confirmButtonText: 'Upload',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Confirmation accepted with remark:', result.value);
        this.uploadDocument(documentTypeId, result.value);
      } else {
        console.log('Confirmation rejected');
        this.selectedFile = null;
        // Reset any file input elements
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input: Element) => {
          (input as HTMLInputElement).value = '';
        });
      }
    });
  }
}