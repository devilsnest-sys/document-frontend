import { Component, OnInit } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { catchError, finalize } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import Swal from 'sweetalert2';
import { ActivatedRoute } from '@angular/router';

interface DocumentType {
  id: number;
  documentName: string;
}

interface StageDocuments {
  [stageId: string]: DocumentType[];
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

interface StageGroup {
  stageId: number;
  stageName: string;
  documents: DocumentGroupWithUploads[];
}

interface DocumentGroupWithUploads {
  documentType: DocumentType;
  uploadedDocuments: UploadedDocument[];
}

@Component({
  selector: 'app-all-stages-documents',
  standalone: false,
  templateUrl: './all-stages-documents.component.html',
  styleUrls: ['./all-stages-documents.component.css'],
})
export class AllStagesDocumentsComponent implements OnInit {
  stageDocuments: StageDocuments = {};
  uploadedDocuments: UploadedDocument[] = [];
  stageGroups: StageGroup[] = [];
  expandedStages: { [key: number]: boolean } = {};
  expandedDocuments: { [key: string]: boolean } = {};
  isLoading: boolean = false;
  errorMessage: string = '';
  userType: string | null = '';
  selectedFile: File | null = null;
  poID: string | null = null;
  poNumber: string = '';

  // Stage names mapping
  stageNames: { [key: number]: string } = {
    1: 'Stage 1 - Initial Documents',
    2: 'Stage 2 - Bank Guarantee',
    3: 'Stage 3 - Certificates',
    4: 'Stage 4 - Transport Documents',
    5: 'Stage 5 - Technical Documents',
    6: 'Stage 6 - Quality Documents',
    7: 'Stage 7 - Delivery Documents',
  };

  constructor(
    private http: HttpClient,
    private toastService: ToastserviceService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userType = localStorage.getItem('userType');
    this.poID = this.route.snapshot.paramMap.get('poNumber');
    console.log('PO ID:', this.poID);
    this.fetchPoDetails();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  fetchPoDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http
      .get<any>(`${environment.apiUrl}/v1/PurchaseOrder/${this.poID}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError(this.handleError.bind(this)),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          console.log('Fetched PO details:', response);
          this.poNumber = response.pO_NO;
          console.log('PO Number:', this.poNumber);
          this.fetchAllStageDocuments();
        },
      });
  }

  fetchAllStageDocuments(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http
      .get<StageDocuments>(
        `${environment.apiUrl}/v1/document-selection/documents-by-po-Group?poNo=${this.poNumber}`,
        { headers: this.getHeaders() }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.stageDocuments = {};
            this.stageGroups = [];
            return of({});
          }
          return this.handleError(error);
        }),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (stageDocuments) => {
          console.log('Fetched stage documents:', stageDocuments);
          this.stageDocuments = stageDocuments;
          
          // Initialize expanded states
          Object.keys(stageDocuments).forEach((stageId) => {
            this.expandedStages[parseInt(stageId)] = false;
          });

          this.fetchAllUploadedDocuments();
        },
        error: (error) => {
          console.error('Error fetching stage documents:', error);
        },
      });
  }

  fetchAllUploadedDocuments(): void {
    this.isLoading = true;

    // Create an array of all stage IDs
    const stageIds = Object.keys(this.stageDocuments).map((id) => parseInt(id));

    // Fetch uploaded documents for all stages
    const requests = stageIds.map((stageId) => {
      const payload = {
        stageId: stageId,
        PoId: this.poID,
      };

      return this.http
        .post<UploadedDocument[]>(
          `${environment.apiUrl}/v1/UploadedDocument/GetDocumentFlows`,
          payload,
          { headers: this.getHeaders() }
        )
        .pipe(catchError(() => of([])));
    });

    // Wait for all requests to complete
    Promise.all(requests.map((req) => req.toPromise())).then((results) => {
      // Flatten all uploaded documents
      this.uploadedDocuments = results.flat().filter((doc): doc is UploadedDocument => doc !== undefined);
      console.log('All uploaded documents:', this.uploadedDocuments);
      this.groupDocumentsByStage();
      this.isLoading = false;
    });
  }

  private groupDocumentsByStage(): void {
    this.stageGroups = [];

    Object.keys(this.stageDocuments).forEach((stageIdStr) => {
      const stageId = parseInt(stageIdStr);
      const documentTypes = this.stageDocuments[stageIdStr];

      const documentGroups: DocumentGroupWithUploads[] = documentTypes.map(
        (docType) => {
          const matchingDocs = this.uploadedDocuments.filter(
            (doc) =>
              doc.documentTypeId === docType.id && doc.stageId === stageId
          );

          return {
            documentType: docType,
            uploadedDocuments: matchingDocs,
          };
        }
      );

      this.stageGroups.push({
        stageId: stageId,
        stageName: this.stageNames[stageId] || `Stage ${stageId}`,
        documents: documentGroups,
      });
    });

    // Sort by stage ID
    this.stageGroups.sort((a, b) => a.stageId - b.stageId);
    console.log('Grouped documents by stage:', this.stageGroups);
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

  toggleStage(stageId: number): void {
    this.expandedStages[stageId] = !this.expandedStages[stageId];
  }

  isStageExpanded(stageId: number): boolean {
    return this.expandedStages[stageId] === true;
  }

  toggleDocument(stageId: number, documentId: number): void {
    const key = `${stageId}-${documentId}`;
    this.expandedDocuments[key] = !this.expandedDocuments[key];
  }

  isDocumentExpanded(stageId: number, documentId: number): boolean {
    const key = `${stageId}-${documentId}`;
    return this.expandedDocuments[key] === true;
  }

  getDocumentCount(stageId: number, documentId: number): number {
    const stage = this.stageGroups.find((s) => s.stageId === stageId);
    if (!stage) return 0;

    const docGroup = stage.documents.find(
      (d) => d.documentType.id === documentId
    );
    return docGroup ? docGroup.uploadedDocuments.length : 0;
  }

  isGroupVisible(stageId: number, group: DocumentGroupWithUploads): boolean {
    if (group.uploadedDocuments.some((doc) => doc.isApproved)) {
      return false;
    }

    return (
      group.uploadedDocuments.some((doc) => doc.isRejected) ||
      (group.uploadedDocuments.length === 0 &&
        this.isDocumentExpanded(stageId, group.documentType.id))
    );
  }

  hasApprovedDocument(group: DocumentGroupWithUploads): boolean {
    return group.uploadedDocuments.some((doc) => doc.isApproved);
  }

  handleFileSelect(event: Event, stageId: number, documentTypeId: number): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;

    if (this.selectedFile) {
      this.confirmUpload(stageId, documentTypeId);
    }
  }

  async uploadDocument(
    stageId: number,
    documentTypeId: number,
    reviewRemark: string = ''
  ): Promise<void> {
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

      formData.append('isApproved', 'false');
      formData.append('isDocSubmited', 'true');
      formData.append('isRejected', 'false');
      formData.append('uploadedDocumentName', this.selectedFile.name);
      formData.append('uploadedDate', currentDate);
      formData.append(
        'docUploadedBy',
        localStorage.getItem('userType')?.toString() || ''
      );
      formData.append('documentTypeId', documentTypeId.toString());
      formData.append('status', 'Pending');
      formData.append('uploadedBy', currentUser);
      formData.append('stageId', stageId.toString());
      formData.append('poId', this.poID || '');
      formData.append('id', '0');
      formData.append('reviewRemark', reviewRemark);

      const headers = new HttpHeaders().set(
        'Authorization',
        `Bearer ${localStorage.getItem('authToken')}`
      );

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
            this.selectedFile = null;
            const fileInputs = document.querySelectorAll('input[type="file"]');
            fileInputs.forEach((input: Element) => {
              (input as HTMLInputElement).value = '';
            });
          })
        )
        .subscribe({
          next: (response) => {
            console.log('Upload successful:', response);
            this.toastService.showToast('success', 'Document Uploaded');
            this.fetchAllUploadedDocuments();
          },
          error: (error) => {
            console.error('Upload error:', error);
            Swal.fire({
              title: 'Error',
              text: 'Failed to upload document. Please try again.',
              icon: 'error',
            });
          },
        });
    } catch (error) {
      console.error('Document upload failed:', error);
      this.errorMessage = 'Failed to upload document. Please try again.';
      this.isLoading = false;
    }
  }

  confirmUpload(stageId: number, documentTypeId: number): void {
    if (!this.selectedFile) {
      console.error('No file selected');
      return;
    }

    const fileName = this.selectedFile?.name || 'Unknown file';
    const fileSize = this.selectedFile
      ? this.formatFileSize(this.selectedFile.size)
      : '0 Bytes';

    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
    let fileIcon = 'file';

    if (['pdf'].includes(fileExt)) fileIcon = 'file-pdf';
    else if (['doc', 'docx'].includes(fileExt)) fileIcon = 'file-word';
    else if (['xls', 'xlsx'].includes(fileExt)) fileIcon = 'file-excel';
    else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt))
      fileIcon = 'file-image';

    Swal.fire({
      title: 'Document Upload',
      html: `
        <div style="display: flex; align-items: center; margin: 1rem 0; padding: 1rem; background-color: #f8f9fa; border-radius: 8px; border: 1px dashed #dee2e6;">
          <div style="font-size: 2rem; margin-right: 1rem; color: #3085d6;">
            <i class="fas fa-${fileIcon}"></i>
          </div>
          <div>
            <div style="font-weight: bold; margin-bottom: 0.25rem;">${fileName}</div>
            <div style="color: #6c757d; font-size: 0.9rem;">${fileSize}</div>
          </div>
        </div>
        <p>Please confirm you want to upload this document</p>
      `,
      input: 'text',
      inputLabel: 'Review Notes',
      inputPlaceholder: 'Add any relevant notes about this document...',
      showCancelButton: true,
      confirmButtonText: 'Upload',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.selectedFile) {
          this.uploadDocument(stageId, documentTypeId, result.value || '');

          Swal.fire({
            icon: 'success',
            title: 'Document Uploaded',
            text: `${fileName} has been successfully uploaded.`,
            timer: 2000,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: 'No file was selected for upload.',
            timer: 2000,
          });
        }
      } else {
        this.selectedFile = null;
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input: Element) => {
          (input as HTMLInputElement).value = '';
        });
      }
    });
  }

  async reviewDocument(
    document: UploadedDocument,
    isApproved: boolean,
    reviewRemark: string = ''
  ): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      const currentUser = localStorage.getItem('userId') || '1';
      const currentUserType = localStorage.getItem('userType') || null;

      const finalReviewRemark =
        reviewRemark || (isApproved ? 'Document approved' : 'Document rejected');

      const payload = {
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

      this.groupDocumentsByStage();
    } catch (error) {
      console.error('Error reviewing document:', error);
      this.errorMessage = 'Failed to review document. Please try again.';
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
        await this.reviewDocument(
          document,
          true,
          result.value || 'Document approved'
        );
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

  viewDocument(documentId: number): void {
    const documentUrl = `${environment.apiUrl}/v1/UploadedDocument/view/${encodeURIComponent(documentId)}`;

    fetch(documentUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      })
      .catch((error) => console.error('Error fetching document:', error));
  }

  downloadDocument(documentId: number): void {
    const documentUrl = `${environment.apiUrl}/v1/UploadedDocument/download/${encodeURIComponent(documentId)}`;

    const link = document.createElement('a');
    link.href = documentUrl;
    link.setAttribute('download', `document_${documentId}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}