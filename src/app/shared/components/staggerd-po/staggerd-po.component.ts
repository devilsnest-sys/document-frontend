import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import Swal from 'sweetalert2';
import { catchError, finalize } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { UtilService } from '../../../core/services/util.service';

interface StaggeredData {
  id: number;
  quantity: number;
  deliveryDateOfQuantity: string;
  poId: number;
}

interface DocumentType {
  id: number;
  documentName: string;
}

interface UploadedDocument {
  id: number;
  poId: number;
  stageId: number;
  quantityId: number;
  documentTypeId: number;
  uploadedDocumentName: string;
  isApproved: boolean;
  isRejected: boolean;
  status: string;
  reviewRemark: string;
  uploadedDate: string;
  docUploadedBy: string;
  docReviewedBy: string;
  userNameAccToUploadDoc: string;
  vendorNameAccToReviewDoc: string;
}

interface Stage {
  id: number;
  stageName: string;
}

interface DocumentGroup {
  documentType: DocumentType;
  uploadedDocuments: UploadedDocument[];
}

interface StageGroup {
  stageId: number;
  stageName: string;
  stageStatus: 'Complete' | 'Pending' | 'InProgress';
  documents: DocumentGroup[];
}

interface QuantityRowData {
  sn: number;
  quantity: number;
  dateDeliver: string;
  quantityId: number;
  submitted: boolean;
  stages: StageGroup[];
  expandedStages: { [stageId: number]: boolean };
  expandedDocuments: { [key: string]: boolean };
}

@Component({
  selector: 'app-staggerd-po',
  standalone: false,
  templateUrl: './staggerd-po.component.html',
  styleUrl: './staggerd-po.component.css'
})
export class StaggerdPoComponent implements OnInit, OnChanges {
  @Input() poId!: number;
  @Input() poNumber = '';

  staggeredData: StaggeredData[] = [];
  tableData: QuantityRowData[] = [];
  stageNames: { [key: number]: string } = {};
  stageDocuments: { [stageId: string]: DocumentType[] } = {};
  allUploadedDocuments: UploadedDocument[] = [];
  stepStatuses: { [key: string]: string } = {};
  loading = false;
  error: string | null = null;
  userType = localStorage.getItem('userType');
  selectedFile: File | null = null;
  userForStages: number[] = [];

  constructor(
    private http: HttpClient,
    private toastservice: ToastserviceService,
    private utilService: UtilService
  ) { }

  ngOnInit(): void {
    this.userType = localStorage.getItem('userType');
    const stageStr = localStorage.getItem('userForStage');
    this.userForStages = stageStr
      ? stageStr.split(',').map(s => Number(s.trim()))
      : [];
    if (this.poId && this.poNumber) {
      this.loadAllData();
    }
    console.log("Staggered PO - poId:", this.poId, "poNumber:", this.poNumber);
  }

  canAccessStage(stageId: number): boolean {
    if (this.isVendor()) {
      return true;
    }
    return this.userForStages.includes(stageId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['poId'] || changes['poNumber']) && this.poId && this.poNumber) {
      this.loadAllData();
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': '*/*'
    });
  }

  loadAllData(): void {
    this.loading = true;
    this.error = null;

    Promise.all([
      this.fetchStageNames(),
      this.fetchStaggeredData(),
      this.fetchStageDocuments(),
      this.fetchStepStatuses()
    ]).then(() => {
      return this.fetchAllUploadedDocuments();
    }).then(() => {
      this.combineAllData();
      this.loading = false;
    }).catch((error) => {
      console.error('Error loading staggered PO data:', error);
      this.error = 'Failed to load staggered PO data';
      this.loading = false;
    });
  }

  private fetchStageNames(): Promise<void> {
    const token = localStorage.getItem('authToken');
    if (!token) return Promise.resolve();

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const stageRequests = Array.from({ length: 10 }, (_, i) => i + 1).map(stageId =>
      this.http.get<Stage>(`${environment.apiUrl}/v1/stages/${stageId}`, { headers })
        .pipe(catchError(() => of(null))).toPromise()
    );

    return Promise.all(stageRequests).then((results) => {
      results.forEach((stage) => {
        if (stage && stage.id && stage.stageName) {
          this.stageNames[stage.id] = stage.stageName;
        }
      });
    });
  }

  private fetchStaggeredData(): Promise<void> {
    const url = `${environment.apiUrl}/v1/staggered-data/staggered/search?poId=${this.poId}`;
    return this.http.get<StaggeredData[]>(url, { headers: this.getHeaders() })
      .toPromise()
      .then(data => {
        this.staggeredData = data || [];
      });
  }

  private fetchStageDocuments(): Promise<void> {
    return this.http.get<{ [stageId: string]: DocumentType[] }>(
      `${environment.apiUrl}/v1/document-selection/documents-by-po-Group?poNo=${this.poNumber}`,
      { headers: this.getHeaders() }
    )
    .pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of({});
        }
        throw error;
      })
    )
    .toPromise()
    .then(data => {
      this.stageDocuments = data || {};
    });
  }

  private fetchAllUploadedDocuments(): Promise<void> {
    const stageIds = Object.keys(this.stageDocuments).map(id => parseInt(id));
    const quantityIds = this.staggeredData.map(s => s.id);

    const requests = stageIds.flatMap(stageId =>
      quantityIds.map(quantityId => {
        const payload = {
          stageId: stageId,
          PoId: this.poId,
          quantityId: quantityId
        };

        return this.http.post<UploadedDocument[]>(
          `${environment.apiUrl}/v1/UploadedDocument/GetDocumentFlows`,
          payload,
          { headers: this.getHeaders() }
        ).pipe(catchError(() => of([]))).toPromise();
      })
    );

    return Promise.all(requests).then((results) => {
      this.allUploadedDocuments = results
        .flat()
        .filter((doc): doc is UploadedDocument => doc !== undefined)
        .filter((doc, index, self) =>
          index === self.findIndex(d => d.id === doc.id)
        );
    });
  }

  private fetchStepStatuses(): Promise<void> {
    const url = `${environment.apiUrl}/v1/StageStatus/StageStatusPo/${this.poId}`;

    return this.http.get<any[]>(url, { headers: this.getHeaders() })
      .toPromise()
      .then((response: any[] | undefined) => {
        this.stepStatuses = {};

        if (!response || response.length === 0) {
          console.log('[STEP STATUS] No data returned');
          return;
        }

        response.forEach(stage => {
          const key = `${stage.stageId}_${stage.quantityId}`;
          this.stepStatuses[key] = stage.status;

          console.log(
            '[STEP STATUS]',
            'Key:', key,
            'Status:', stage.status
          );
        });
      })
      .catch(err => {
        console.error('[STEP STATUS] API failed', err);
        this.stepStatuses = {};
      });
  }

  private combineAllData(): void {
    console.log('=== COMBINE ALL DATA START ===');

    this.tableData = this.staggeredData.map((staggered, index) => {
      const stages: StageGroup[] = Object.keys(this.stageDocuments).map(stageIdStr => {
        const stageId = Number(stageIdStr);
        const key = `${stageId}_${staggered.id}`;
        const dbStatus = this.stepStatuses[key];

        console.log(
          '[STAGE STATUS RESOLVE]',
          'Qty:', staggered.id,
          'Stage:', stageId,
          'Key:', key,
          'DB Status:', dbStatus
        );

        return {
          stageId,
          stageName: this.stageNames[stageId] || `Stage ${stageId}`,
          stageStatus: dbStatus === 'Complete' ? 'Complete' : 'Pending',
          documents: this.stageDocuments[stageIdStr].map(docType => ({
            documentType: docType,
            uploadedDocuments: this.allUploadedDocuments.filter(
              doc =>
                doc.stageId === stageId &&
                doc.quantityId === staggered.id &&
                doc.documentTypeId === docType.id
            )
          }))
        };
      });

      return {
        sn: index + 1,
        quantity: staggered.quantity,
        dateDeliver: this.formatDate(staggered.deliveryDateOfQuantity),
        quantityId: staggered.id,
        submitted: stages.every(s => s.stageStatus === 'Complete'),
        stages,
        expandedStages: {},
        expandedDocuments: {}
      };
    });

    console.log('FINAL TABLE DATA:', this.tableData);
    console.log('=== COMBINE ALL DATA END ===');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  getRelativeDate(dateString: string): string {
    const now = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `${diffDays} days away`;
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return 'Unknown';
  }

  // Toggle methods
  expandedQuantities: { [quantityId: number]: boolean } = {};

  toggleQuantity(quantityId: number): void {
    this.expandedQuantities[quantityId] = !this.expandedQuantities[quantityId];
  }

  isQuantityExpanded(quantityId: number): boolean {
    return this.expandedQuantities[quantityId] === true;
  }

  toggleStage(row: QuantityRowData, stageId: number): void {
    row.expandedStages[stageId] = !row.expandedStages[stageId];
  }

  isStageExpanded(row: QuantityRowData, stageId: number): boolean {
    return row.expandedStages[stageId] === true;
  }

  toggleDocument(row: QuantityRowData, stageId: number, documentId: number): void {
    const key = `${stageId}-${documentId}`;
    row.expandedDocuments[key] = !row.expandedDocuments[key];
  }

  isDocumentExpanded(row: QuantityRowData, stageId: number, documentId: number): boolean {
    const key = `${stageId}-${documentId}`;
    return row.expandedDocuments[key] === true;
  }

  // Document upload
  handleFileSelect(event: Event, row: QuantityRowData, stageId: number, documentTypeId: number): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;

    if (this.selectedFile) {
      this.confirmUpload(row, stageId, documentTypeId);
    }
  }

  confirmUpload(row: QuantityRowData, stageId: number, documentTypeId: number): void {
    if (!this.selectedFile) return;

    const fileName = this.selectedFile.name;
    const fileSize = this.formatFileSize(this.selectedFile.size);

    Swal.fire({
      title: 'Document Upload',
      html: `
        <div style="text-align: left; padding: 1rem;">
          <p><strong>File:</strong> ${fileName}</p>
          <p><strong>Size:</strong> ${fileSize}</p>
          <p><strong>Quantity:</strong> ${row.quantity}</p>
          <p><strong>Stage:</strong> ${this.stageNames[stageId]}</p>
        </div>
      `,
      input: 'text',
      inputLabel: 'Review Notes',
      inputPlaceholder: 'Add notes...',
      showCancelButton: true,
      confirmButtonText: 'Upload',
      confirmButtonColor: '#28a745'
    }).then((result) => {
      if (result.isConfirmed) {
        this.uploadDocument(row, stageId, documentTypeId, result.value || '');
      }
    });
  }

  uploadDocument(row: QuantityRowData, stageId: number, documentTypeId: number, reviewRemark: string): void {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('quantityId', row.quantityId.toString());
    formData.append('stageId', stageId.toString());
    formData.append('documentTypeId', documentTypeId.toString());
    formData.append('poId', this.poId.toString());
    formData.append('uploadedDocumentName', this.selectedFile.name);
    formData.append('uploadedBy', localStorage.getItem('userId') || '1');
    formData.append('docUploadedBy', localStorage.getItem('userType') || '');
    formData.append('uploadedDate', this.utilService.getISTISOString());
    formData.append('status', 'Pending');
    formData.append('isApproved', 'false');
    formData.append('isRejected', 'false');
    formData.append('isDocSubmited', 'true');
    formData.append('reviewRemark', reviewRemark);
    formData.append('id', '0');

    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('authToken')}`);

    this.http.post(`${environment.apiUrl}/v1/UploadedDocument/CreateUploadDocFlow`, formData, { headers })
      .subscribe({
        next: () => {
          this.toastservice.showToast('success', 'Document uploaded successfully');
          this.selectedFile = null;
          this.loadAllData();
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.toastservice.showToast('error', 'Failed to upload document');
        }
      });
  }

  // Document review
  async approveDocument(doc: UploadedDocument): Promise<void> {
    const result = await Swal.fire({
      title: 'Approve Document',
      text: `Approve "${doc.uploadedDocumentName}"?`,
      icon: 'question',
      input: 'text',
      inputLabel: 'Review Remark',
      inputPlaceholder: 'Enter remark...',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      confirmButtonColor: '#28a745'
    });

    if (result.isConfirmed) {
      await this.reviewDocument(doc, true, result.value || 'Approved');
    }
  }

  async rejectDocument(doc: UploadedDocument): Promise<void> {
    const result = await Swal.fire({
      title: 'Reject Document',
      text: `Reject "${doc.uploadedDocumentName}"?`,
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Rejection Reason (Required)',
      inputPlaceholder: 'Enter reason...',
      inputValidator: (value) => !value ? 'Reason required!' : null,
      showCancelButton: true,
      confirmButtonText: 'Reject',
      confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
      await this.reviewDocument(doc, false, result.value);
    }
  }

  private async reviewDocument(doc: UploadedDocument, isApproved: boolean, reviewRemark: string): Promise<void> {
    const payload = {
      id: doc.id,
      isApproved: isApproved,
      isRejected: !isApproved,
      reviewedBy: parseInt(localStorage.getItem('userId') || '1'),
      docReviewedBy: localStorage.getItem('userType') || '',
      status: isApproved ? 'Approved' : 'Rejected',
      reviewRemark: reviewRemark,
      docReviewDate: this.utilService.getISTISOString()
    };

    try {
      await this.http.patch(`${environment.apiUrl}/v1/UploadedDocument/${doc.id}`, payload, { headers: this.getHeaders() }).toPromise();
      this.toastservice.showToast('success', isApproved ? 'Document approved' : 'Document rejected');
      this.loadAllData();
    } catch (error) {
      this.toastservice.showToast('error', 'Failed to review document');
    }
  }

  // Document actions
  viewDocument(documentId: number): void {
    const token = localStorage.getItem('authToken');
    const newWindow = window.open('', '_blank');
    
    if (!newWindow) {
      alert('Please allow popups');
      return;
    }

    fetch(`${environment.apiUrl}/v1/PurchaseOrder/view-uploaded-document/${documentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      newWindow.location.href = blobUrl;
    })
    .catch(err => {
      console.error('View error:', err);
      newWindow.close();
    });
  }

  downloadDocument(documentId: number): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get(`${environment.apiUrl}/v1/PurchaseOrder/download-stage/${documentId}`, {
      headers: headers,
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document_${documentId}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Download error:', err);
      }
    });
  }

  // Stage submission
  submitStage(row: QuantityRowData, stageId: number): void {
    if (!this.canAccessStage(stageId)) {
      Swal.fire({
        icon: 'error',
        title: 'Unauthorized',
        text: 'You are not allowed to submit this stage.'
      });
      return;
    }
    if (!this.canSubmitStage(row, stageId)) {
      Swal.fire({
        icon: 'error',
        title: 'Cannot Submit',
        text: 'All documents must be approved before submission'
      });
      return;
    }

    Swal.fire({
      title: 'Submit Stage',
      text: `Submit ${this.stageNames[stageId]} for quantity ${row.quantity}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      confirmButtonColor: '#28a745'
    }).then((result) => {
      if (result.isConfirmed) {
        this.performStageSubmission(row, stageId);
      }
    });
  }

  private performStageSubmission(row: QuantityRowData, stageId: number): void {
    const quantityParam = row.quantityId
      ? `&quantityId=${row.quantityId}`
      : '';

    const url =
      `${environment.apiUrl}/v1/StageStatus/validate-submission` +
      `?poId=${this.poId}` +
      `&stageId=${stageId}` +
      `${quantityParam}` +
      `&TncSelected=true`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        const canSubmit =
          res?.canSubmit === true ||
          res?.canSubmit === 'true';

        if (canSubmit) {
          Swal.fire({
            icon: 'success',
            title: 'Stage Submitted',
            text: res.Message,
            timer: 2000,
            showConfirmButton: false
          });
          this.loadAllData();
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Cannot Submit',
            text: res.Message
          });
        }
      },
      error: (err) => {
        console.error('Stage submission error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: 'Please try again'
        });
      }
    });
  }

  // Helper methods
  canSubmitStage(row: QuantityRowData, stageId: number): boolean {
    const stage = row.stages.find(s => s.stageId === stageId);

    console.log(
      '[CAN SUBMIT CHECK]',
      'Qty:', row.quantityId,
      'Stage:', stageId,
      'StageObj:', stage
    );

    if (!stage) {
      console.log('❌ Stage not found');
      return false;
    }

    if (stage.stageStatus === 'Complete') {
      console.log('❌ Stage already COMPLETE — disabling button');
      return false;
    }

    const allDocsApproved = stage.documents.every(docGroup =>
      docGroup.uploadedDocuments.some(doc => doc.isApproved)
    );

    console.log(
      '[DOC APPROVAL CHECK]',
      'Qty:', row.quantityId,
      'Stage:', stageId,
      'AllApproved:', allDocsApproved
    );

    return allDocsApproved;
  }

  canReviewDocument(doc: UploadedDocument): boolean {
    const currentUserType = this.userType?.toLowerCase();
    const uploaderType = doc.docUploadedBy?.toLowerCase();

    if (!this.canAccessStage(doc.stageId)) {
      console.log(
        '[REVIEW BLOCKED]',
        'AllowedStages:', this.userForStages,
        'DocStage:', doc.stageId
      );
      return false;
    }

    if (currentUserType === 'user' && uploaderType === 'vendor') return true;
    if (currentUserType === 'vendor' && uploaderType === 'user') return true;

    return false;
  }

  isUser(): boolean {
    return this.userType?.toLowerCase() === 'user';
  }

  isVendor(): boolean {
    return this.userType?.toLowerCase() === 'vendor';
  }

  hasApprovedDocument(group: DocumentGroup): boolean {
    return group.uploadedDocuments.some(doc => doc.isApproved);
  }

  isGroupVisible(group: DocumentGroup): boolean {
    if (group.uploadedDocuments.some(doc => doc.isApproved)) return false;
    return group.uploadedDocuments.some(doc => doc.isRejected) || group.uploadedDocuments.length === 0;
  }

  getDocumentCount(stage: StageGroup, documentId: number): number {
    const docGroup = stage.documents.find(d => d.documentType.id === documentId);
    return docGroup ? docGroup.uploadedDocuments.length : 0;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  trackByQuantity(index: number, item: QuantityRowData): any {
    return item.quantityId;
  }

  trackByStage(index: number, item: StageGroup): any {
    return item.stageId;
  }

  trackByDocument(index: number, item: UploadedDocument): any {
    return item.id;
  }

  retryLoad(): void {
    this.loadAllData();
  }

  refreshData(): void {
    this.loadAllData();
  }

  exportData(): void {
    this.toastservice.showToast('warning', 'Export functionality');
  }

  getProgressPercentage(): number {
    if (this.tableData.length === 0) return 0;
    const submitted = this.tableData.filter(row => row.submitted).length;
    return Math.round((submitted / this.tableData.length) * 100);
  }

  getCompletedCount(): number {
    return this.tableData.filter(row => row.submitted).length;
  }

  getPendingCount(): number {
    return this.tableData.filter(row => !row.submitted).length;
  }

  getTotalCount(): number {
    return this.tableData.length;
  }
getApprovedDoc(group: DocumentGroup): UploadedDocument | null {
  return group.uploadedDocuments.find(d => d.isApproved) || null;
}

shouldShowReuseButton(row: QuantityRowData, stage: StageGroup, docGroup: DocumentGroup): boolean {
  // Only show for users
  if (!this.isUser() || !this.canAccessStage(stage.stageId)) {
    return false;
  }

  // Check if this document group has an approved document
  const hasApproved = this.hasApprovedDocument(docGroup);
  if (!hasApproved) {
    return false;
  }

  // Find the FIRST quantity that has an approved document for this stage and document type
  const firstQuantityWithApproval = this.tableData.find(r => {
    const matchingStage = r.stages.find(s => s.stageId === stage.stageId);
    if (!matchingStage) return false;

    const matchingDocGroup = matchingStage.documents.find(
      d => d.documentType.id === docGroup.documentType.id
    );
    if (!matchingDocGroup) return false;

    return this.hasApprovedDocument(matchingDocGroup);
  });

  // Only show reuse button if this is the first quantity with an approved document
  return firstQuantityWithApproval?.quantityId === row.quantityId;
}

  // NEW METHOD: Reuse document for another quantity
  async reuseDocument(doc: UploadedDocument, stageId: number): Promise<void> {
    // Get available quantities (excluding current quantity)
    const availableQuantities = this.tableData
      .filter(row => row.quantityId !== doc.quantityId)
      .map(row => ({
        value: row.quantityId.toString(),
        text: `Quantity ${row.quantity} (Delivery: ${row.dateDeliver})`
      }));

    if (availableQuantities.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Available Quantities',
        text: 'There are no other quantities to reuse this document for.'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Reuse Document',
      html: `
        <div style="text-align: left; padding: 1rem;">
          <p><strong>Document:</strong> ${doc.uploadedDocumentName}</p>
          <p><strong>Current Quantity:</strong> ${this.getQuantityByDoc(doc)?.quantity}</p>
          <p><strong>Stage:</strong> ${this.stageNames[stageId]}</p>
        </div>
      `,
      input: 'select',
      inputLabel: 'Select Target Quantity',
      inputOptions: availableQuantities.reduce((acc, curr) => {
        acc[curr.value] = curr.text;
        return acc;
      }, {} as { [key: string]: string }),
      inputPlaceholder: 'Choose quantity...',
      showCancelButton: true,
      confirmButtonText: 'Reuse Document',
      confirmButtonColor: '#007bff',
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a target quantity';
        }
        return null;
      }
    });

    if (result.isConfirmed && result.value) {
      this.performDocumentReuse(doc, stageId, parseInt(result.value));
    }
  }

  private performDocumentReuse(doc: UploadedDocument, stageId: number, targetQuantityId: number): void {
    const payload = {
      poId: this.poId,
      stageId: stageId,
      documentTypeId: doc.documentTypeId,
      targetQuantityId: targetQuantityId
    };

    this.http.post(
      `${environment.apiUrl}/v1/UploadedDocument/reuse-for-quantity`,
      payload,
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Document Reused',
          text: 'Document has been successfully reused for the selected quantity.',
          timer: 2000,
          showConfirmButton: false
        });
        this.loadAllData();
      },
      error: (err) => {
        console.error('Document reuse error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Reuse Failed',
          text: err.error?.message || 'Failed to reuse document. Please try again.'
        });
      }
    });
  }

  private getQuantityByDoc(doc: UploadedDocument): QuantityRowData | undefined {
    return this.tableData.find(row => row.quantityId === doc.quantityId);
  }
}