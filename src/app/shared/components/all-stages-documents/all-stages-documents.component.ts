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
import { ActivatedRoute, Router } from '@angular/router';
import { UtilService } from '../../../core/services/util.service';

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

interface Stage {
  id: number;
  sequence: number;
  stageName: string;
  stageStatuses: any[];
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
  stepStatuses: { [key: number]: string } = {};
  stageNames: { [key: number]: string } = {};
allowedStageId: number[] = [];

constructor(
  
    private http: HttpClient,
    private toastService: ToastserviceService,
    private route: ActivatedRoute,
    private router: Router,
    private utilService: UtilService
  ) {}

  ngOnInit(): void {
    this.userType = localStorage.getItem('userType');
    const stageStr = localStorage.getItem('userForStage');
  this.allowedStageId = stageStr
    ? stageStr.split(',').map(s => Number(s.trim()))
    : [];

  console.log('User allowed stage:', this.allowedStageId);
    this.poID = this.route.snapshot.paramMap.get('poNumber');
    console.log('PO ID:', this.poID);
    console.log('User Type from localStorage:', this.userType);
    
    this.fetchStageNames();
    this.fetchPoDetails();
    this.fetchStepStatuses();
  }

canAccessStage(stageId: number): boolean {
    // ✅ Vendor has access to all stages
  if (this.isVendor()) {
    return true;
  }
  return this.allowedStageId.includes(stageId);
}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  fetchStageNames(): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const stageRequests = Array.from({ length: 10 }, (_, i) => i + 1).map(stageId =>
      this.http.get<Stage>(`${environment.apiUrl}/v1/stages/${stageId}`, { headers })
        .pipe(catchError(() => of(null)))
    );

    Promise.all(stageRequests.map(req => req.toPromise())).then((results) => {
      results.forEach((stage) => {
        if (stage && stage.id && stage.stageName) {
          this.stageNames[stage.id] = stage.stageName;
        }
      });
      console.log('Fetched stage names:', this.stageNames);
    });
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

    const stageIds = Object.keys(this.stageDocuments).map((id) => parseInt(id));

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

    Promise.all(requests.map((req) => req.toPromise())).then((results) => {
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
      const currentDate = this.utilService.getISTISOString();

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
      const currentUserType = localStorage.getItem('userType') || '';
      
      const finalReviewRemark = reviewRemark || (isApproved ? 'Document approved' : 'Document rejected');
      
      const payload: DocumentReviewPayload = {
        id: document.id,
        isApproved: isApproved,
        isRejected: !isApproved,
        reviewedBy: parseInt(currentUser),
        docReviewedBy: currentUserType,
        status: isApproved ? 'Approved' : 'Rejected',
        reviewRemark: finalReviewRemark,
        docReviewDate: this.utilService.getISTISOString(),
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

      this.fetchAllUploadedDocuments();
      
      this.toastService.showToast(
        'success', 
        isApproved ? 'Document Approved Successfully' : 'Document Rejected'
      );

    } catch (error) {
      console.error('Error reviewing document:', error);
      this.errorMessage = 'Failed to review document. Please try again.';
      this.toastService.showToast('error', 'Failed to review document');
    }
  }

  async approveDocument(document: UploadedDocument): Promise<void> {
    Swal.fire({
      title: 'Approve Document',
      text: `Are you sure you want to approve "${document.uploadedDocumentName}"?`,
      icon: 'question',
      input: 'text',
      inputLabel: 'Review Remark',
      inputPlaceholder: 'Enter your review remark (optional)',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
    }).then(async (result) => {
      if (result.isConfirmed) {
        await this.reviewDocument(document, true, result.value || 'Document approved');
      }
    });
  }

  async rejectDocument(document: UploadedDocument): Promise<void> {
    Swal.fire({
      title: 'Reject Document',
      text: `Are you sure you want to reject "${document.uploadedDocumentName}"?`,
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Rejection Reason (Required)',
      inputPlaceholder: 'Enter your reason for rejection...',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return 'You must provide a reason for rejection!';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Reject',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then(async (result) => {
      if (result.isConfirmed) {
        await this.reviewDocument(document, false, result.value);
      }
    });
  }

// viewDocument(documentId: number): void {
//   const token = localStorage.getItem('authToken');
  
//   if (!token) {
//     alert('Please log in to view documents.');
//     return;
//   }

//   const documentUrl = `${environment.apiUrl}/v1/PurchaseOrder/view/${encodeURIComponent(documentId)}`;

//   fetch(documentUrl, {
//     headers: {
//       'Authorization': `Bearer ${token}`
//     }
//   })
//     .then(response => {
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       return response.blob();
//     })
//     .then(blob => {
//       const blobUrl = URL.createObjectURL(blob);
//       const newWindow = window.open(blobUrl, '_blank');
      
//       if (!newWindow) {
//         alert('Please allow popups to view the document.');
//         URL.revokeObjectURL(blobUrl);
//         return;
//       }
      
//       // Revoke the blob URL after the new window loads
//       newWindow.addEventListener('load', () => {
//         setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
//       });
//     })
//     .catch(error => {
//       console.error('Error viewing document:', error);
//       alert('Error viewing document. Please try again.');
//     });
// }
viewDocument(documentId: number): void {
  const token = localStorage.getItem('authToken');

  if (!token) {
    alert('Please log in to view documents.');
    return;
  }

  // ✅ OPEN WINDOW FIRST (sync → popup allowed)
  const newWindow = window.open('', '_blank');

  if (!newWindow) {
    alert('Please allow popups to view the document.');
    return;
  }

  const documentUrl =
    `${environment.apiUrl}/v1/PurchaseOrder/view-uploaded-document/${encodeURIComponent(documentId)}`;

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

      // ✅ Navigate already-opened window
      newWindow.location.href = blobUrl;

      // cleanup
      newWindow.addEventListener('load', () => {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 500);
      });
    })
    .catch(error => {
      console.error('Error viewing document:', error);
      newWindow.close();
      alert('Error viewing document. Please try again.');
    });
}

downloadDocument(documentId: number): void {
  const token = localStorage.getItem('authToken');

  if (!token) {
    alert('Please log in to view documents.');
    return;
  }

  const documentUrl = `${environment.apiUrl}/v1/PurchaseOrder/download-stage/${documentId}`;

  this.http.get(documentUrl, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${token}`
    }),
    responseType: 'blob' // <--- important
  })
  .subscribe({
    next: (fileBlob) => {
      const blobUrl = window.URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `document_${documentId}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    },
    error: (err) => {
      console.error('Download failed:', err);
      alert('Error downloading document');
    }
  });
}


  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  submitStage(stageId: number): void {
    // BUG FIX: Check if user is allowed to submit
    if (!this.canAccessStage(stageId)) {
    Swal.fire({
      icon: 'error',
      title: 'Unauthorized',
      text: 'You are not allowed to submit this stage.'
    });
    return;
  }

    if (this.userType?.toLowerCase() !== 'user') {
      Swal.fire({
        icon: 'error',
        title: 'Unauthorized',
        text: 'Only users with "user" role can submit stages.',
      });
      return;
    }

    // BUG FIX: Check if stage is already complete
    if (this.getStageStatus(stageId) === 'Complete') {
      Swal.fire({
        icon: 'info',
        title: 'Already Submitted',
        text: 'This stage has already been submitted.',
      });
      return;
    }

    Swal.fire({
      title: 'Submit Stage',
      text: `Are you sure you want to submit Stage ${stageId}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Submit Stage',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.performStageSubmission(stageId, true);
      }
    });
  }

  private performStageSubmission(stageId: number, tncAccepted: boolean): void {
    if (!this.poID || isNaN(+this.poID) || !stageId || isNaN(stageId)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Input',
        text: 'Invalid PO Number or Stage Number.',
      });
      return;
    }

    this.isLoading = true;

    this.http.get(
  `${environment.apiUrl}/v1/StageStatus/validate-submission` +
  `?poId=${this.poID}` +
  `&stageId=${stageId}` +
  `&TncSelected=${tncAccepted}`,
      { headers: this.getHeaders() }
    )
    .pipe(
      catchError(this.handleError.bind(this)),
      finalize(() => (this.isLoading = false))
    )
    .subscribe({
      next: (response: any) => {
        if (response?.canSubmit) {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: response.Message || 'Stage submitted successfully.',
            confirmButtonText: 'OK'
          }).then(() => {
            // BUG FIX: Refresh stage statuses after submission
            this.fetchStepStatuses();
            this.fetchAllUploadedDocuments();
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: response.Message || 'Stage cannot be submitted.',
          });
        }
      },
      error: (error) => {
        console.error('Validation error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Error validating the submission. Please try again.',
        });
      }
    });
  }

  private fetchStepStatuses(): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const poNumber = this.route.snapshot.paramMap.get('poNumber');
    const url = `${environment.apiUrl}/v1/StageStatus/StageStatusPo/${poNumber}`;
    
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        this.stepStatuses = response.reduce((acc: { [x: string]: any; }, stage: { stageId: string | number; status: any; }) => {
          acc[stage.stageId] = stage.status;
          return acc;
        }, {} as { [key: number]: string });
        console.log("Stage statuses:", this.stepStatuses);
      },
      error: (err) => {
        console.error('Error fetching step statuses:', err);
      }
    });
  }

  getStageStatus(stageId: number): string {
    return this.stepStatuses[stageId] || 'Pending';
  }

  getStepClass(i: number): string {
    const stepNumber = i + 1;
    const status = this.stepStatuses[stepNumber];
  
    if (status === 'Complete') {
      return 'completed';
    } else if (status === 'InProgress') {
      return 'current';
    } else {
      return 'pending';
    }
  }

  canSubmitStage(stageId: number): boolean {
    const stage = this.stageGroups.find(s => s.stageId === stageId);
    if (!stage) return false;

    // BUG FIX: Check if stage has documents
    if (stage.documents.length === 0) return false;

    // BUG FIX: All document types must have at least one approved document
    return stage.documents.every(docGroup => 
      docGroup.uploadedDocuments.some(doc => doc.isApproved)
    );
  }

  // BUG FIX: Helper method to determine submit button text
  getSubmitButtonText(stageId: number): string {
    const status = this.getStageStatus(stageId);
    return status === 'Complete' ? 'Submitted' : 'Submit';
  }

  // BUG FIX: Helper method to determine if submit button should be disabled
  isSubmitDisabled(stageId: number): boolean {
    const status = this.getStageStatus(stageId);
    return status === 'Complete' || !this.canSubmitStage(stageId) || this.isLoading;
  }

  // BUG FIX: Check if user can perform vendor actions
  isVendor(): boolean {
    return this.userType?.toLowerCase() === 'vendor';
  }

  // BUG FIX: Check if user can perform user actions
  isUser(): boolean {
    return this.userType?.toLowerCase() === 'user';
  }

  // Add this method to your component
canReviewDocument(doc: UploadedDocument): boolean {
  const currentUserType = this.userType?.toLowerCase();
  const uploaderType = doc.docUploadedBy?.toLowerCase();

  // Document must be pending (not already approved or rejected)
  if (doc.isApproved || doc.isRejected) {
    return false;
  }

  // ✅ Vendor can approve documents uploaded by User
  if (currentUserType === 'vendor' && uploaderType === 'user') {
    return true;
  }

  // ✅ User can approve documents uploaded by Vendor (only in their assigned stages)
  if (currentUserType === 'user' && uploaderType === 'vendor') {
    return this.allowedStageId.includes(doc.stageId);
  }

  return false;
}

canRejectDocument(doc: UploadedDocument): boolean {
  const currentUserType = this.userType?.toLowerCase();

  // Document must be pending (not already approved or rejected)
  if (doc.isApproved || doc.isRejected) {
    return false;
  }

  // ✅ Vendor can reject ANY pending document
  if (currentUserType === 'vendor') {
    return true;
  }

  // ✅ User can reject documents in their assigned stages
  if (currentUserType === 'user') {
    return this.allowedStageId.includes(doc.stageId);
  }

  return false;
}


}