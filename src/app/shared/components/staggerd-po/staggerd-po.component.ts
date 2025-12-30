import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import Swal from 'sweetalert2';

interface StaggeredData {
  id: number;
  quantity: number;
  deliveryDateOfQuantity: string;
  poId: number;
}

interface StageWiseData {
  id: number;
  poId: number;
  stageId: number;
  quantityId: number;
  submitted: boolean;
  createdAt: string;
  createdBy: number;
  modifiedAt?: string;
  modifiedBy?: number;
}

interface TableRowData {
  sn: number;
  quantity: number;
  dateDeliver: string;
  quantityId: number;
  submitted: boolean;
  stageWiseId: number;
  isSubmitting?: boolean;
}

@Component({
  selector: 'app-staggerd-po',
  standalone: false,
  templateUrl: './staggerd-po.component.html',
  styleUrl: './staggerd-po.component.css'
})
export class StaggerdPoComponent implements OnInit, OnChanges {
  @Input() poId!: number;
  @Input() stageId: number = 1;
  @Input() stageStatus: string = 'Pending'; // NEW: Receive stage status from parent

  staggeredData: StaggeredData[] = [];
  stageWiseData: StageWiseData[] = [];
  tableData: TableRowData[] = [];
  loading = false;
  error: string | null = null;
  userType: string | null = ''; // NEW: Track user type

  constructor(
    private http: HttpClient,
    private toastservice: ToastserviceService
  ) { }

  ngOnInit(): void {
    // NEW: Get user type from localStorage
    this.userType = localStorage.getItem('userType');
    
    if (this.poId && this.stageId) {
      this.loadData();
    }
    console.log("Staggered PO - poId:", this.poId, "stageId:", this.stageId);
  }

  // NEW: Handle input changes
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['poId'] || changes['stageId']) {
      if (this.poId && this.stageId) {
        this.loadData();
      }
    }
  }

  retryLoad() {
    this.loadData();
  }

  refreshData() {
    this.loadData();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': '*/*'
    });
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // Load both APIs concurrently
    Promise.all([
      this.fetchStaggeredData(),
      this.fetchStageWiseData()
    ]).then(() => {
      this.combineData();
      this.loading = false;
    }).catch((error) => {
      console.error('Error loading staggered PO data:', error);
      this.error = 'Failed to load staggered PO data';
      this.loading = false;
    });
  }

  public fetchStaggeredData(): Promise<StaggeredData[]> {
    const url = `${environment.apiUrl}/v1/staggered-data/staggered/search?poId=${this.poId}`;

    return this.http.get<StaggeredData[]>(url, { headers: this.getHeaders() }).toPromise().then(data => {
      this.staggeredData = data || [];
      return this.staggeredData;
    });
  }

  public fetchStageWiseData(): Promise<StageWiseData[]> {
    const url = `${environment.apiUrl}/v1/staggered-data/stagewise/search?poId=${this.poId}&stageId=${this.stageId}`;

    return this.http.get<StageWiseData[]>(url, { headers: this.getHeaders() }).toPromise().then(data => {
      this.stageWiseData = data || [];
      return this.stageWiseData;
    });
  }

  private combineData(): void {
    this.tableData = this.staggeredData.map((staggered, index) => {
      const stageWise = this.stageWiseData.find(sw => sw.quantityId === staggered.id);

      return {
        sn: index + 1,
        quantity: staggered.quantity,
        dateDeliver: this.formatDate(staggered.deliveryDateOfQuantity),
        quantityId: staggered.id,
        submitted: stageWise?.submitted || false,
        stageWiseId: stageWise?.id || 0
      };
    });
  }

  public formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  onSubmit(row: TableRowData): void {
    // NEW: Check if user has permission to submit
    if (!this.canSubmitRow()) {
      Swal.fire({
        icon: 'error',
        title: 'Unauthorized',
        text: 'You do not have permission to submit.',
      });
      return;
    }

    if (row.submitted) {
      Swal.fire({
        icon: 'info',
        title: 'Already Submitted',
        text: 'This row has already been submitted.',
      });
      return;
    }

    // NEW: Check if stage is complete
    if (this.stageStatus === 'Complete') {
      Swal.fire({
        icon: 'info',
        title: 'Stage Completed',
        text: 'This stage has already been completed.',
      });
      return;
    }

    // NEW: Confirmation dialog
    Swal.fire({
      title: 'Submit Row',
      html: `
        <div style="text-align: left; padding: 1rem;">
          <p><strong>Quantity:</strong> ${row.quantity} units</p>
          <p><strong>Delivery Date:</strong> ${row.dateDeliver}</p>
        </div>
        <p>Are you sure you want to submit this row?</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.performSubmit(row);
      }
    });
  }

  private performSubmit(row: TableRowData): void {
    row.isSubmitting = true;
    this.loading = true;

    const url = `${environment.apiUrl}/v1/staggered-data/stagewise/update?poId=${this.poId}&stageId=${this.stageId}&quantityId=${row.quantityId}`;

    this.http.patch(url, {}, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('Submit successful:', response);

        // Update the local data to reflect the submitted status
        const tableRowIndex = this.tableData.findIndex(item => item.quantityId === row.quantityId);
        if (tableRowIndex !== -1) {
          this.tableData[tableRowIndex].submitted = true;
          this.tableData[tableRowIndex].isSubmitting = false;
        }

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Row submitted successfully.',
          timer: 2000,
          showConfirmButton: false
        });

        this.loading = false;
      },
      error: (err) => {
        console.error('Error submitting row:', err);
        row.isSubmitting = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: err.error?.message || 'Failed to submit row. Please try again.',
        });
        
        this.loading = false;
      }
    });
  }

  // NEW: Permission checks
  canSubmitRow(): boolean {
    // Only 'user' role can submit rows
    return this.userType?.toLowerCase() === 'user';
  }

  isVendor(): boolean {
    return this.userType?.toLowerCase() === 'vendor';
  }

  isUser(): boolean {
    return this.userType?.toLowerCase() === 'user';
  }

  // NEW: Check if submit button should be disabled
  isSubmitDisabled(row: TableRowData): boolean {
    return row.submitted || 
           this.loading || 
           this.stageStatus === 'Complete' || 
           !this.canSubmitRow();
  }

  // NEW: Get submit button text based on state
  getSubmitButtonText(row: TableRowData): string {
    if (row.isSubmitting) return 'Submitting...';
    return row.submitted ? 'Completed' : 'Submit';
  }

  // Helper methods
  getSubmittedCount(): number {
    return this.tableData.filter(row => row.submitted).length;
  }

  getPendingCount(): number {
    return this.tableData.filter(row => !row.submitted).length;
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

  trackByFn(index: number, item: TableRowData): any {
    return item.quantityId || index;
  }

  exportData(): void {
    if (this.tableData.length === 0) {
      this.toastservice.showToast('warning', 'No data available to export');
      return;
    }

    try {
      // Create CSV content
      const csvHeaders = ['Serial No.', 'Quantity', 'Delivery Date', 'Status'];
      const csvData = this.tableData.map(row => [
        row.sn,
        row.quantity,
        row.dateDeliver,
        row.submitted ? 'Submitted' : 'Pending'
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `staggered-po-${this.poId}-stage-${this.stageId}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.toastservice.showToast('success', 'Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      this.toastservice.showToast('error', 'Failed to export data');
    }
  }

  getProgressPercentage(): number {
    if (this.tableData.length === 0) return 0;
    return Math.round((this.getSubmittedCount() / this.tableData.length) * 100);
  }

  // NEW: Check if all rows are submitted
  allRowsSubmitted(): boolean {
    return this.tableData.length > 0 && this.tableData.every(row => row.submitted);
  }
}