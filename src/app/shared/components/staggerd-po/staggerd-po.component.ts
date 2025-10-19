import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ToastserviceService } from '../../../core/services/toastservice.service';

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
export class StaggerdPoComponent implements OnInit {
  retryLoad() {
    this.loadData();

  }
  refreshData() {
    this.loadData();

  }
  @Input() poId!: number;
  @Input() stageId: number = 1;

  staggeredData: StaggeredData[] = [];
  stageWiseData: StageWiseData[] = [];
  tableData: TableRowData[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private toastservice: ToastserviceService
  ) { }

  ngOnInit(): void {
    if (this.poId) {
      this.loadData();
    }
    console.log("test staggered", this.poId);
    console.log("test staggered", this.stageId);
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
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': '*/*'
    });

    const url = `${environment.apiUrl}/v1/staggered-data/staggered/search?poId=${this.poId}`;

    return this.http.get<StaggeredData[]>(url, { headers }).toPromise().then(data => {
      this.staggeredData = data || [];
      return this.staggeredData;
    });
  }

  public fetchStageWiseData(): Promise<StageWiseData[]> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': '*/*'
    });

    const url = `${environment.apiUrl}/v1/staggered-data/stagewise/search?poId=${this.poId}&stageId=${this.stageId}`;

    return this.http.get<StageWiseData[]>(url, { headers }).toPromise().then(data => {
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
    if (row.submitted) {
      return; // Already submitted
    }

    this.loading = true;
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': '*/*'
    });

    const url = `${environment.apiUrl}/v1/staggered-data/stagewise/update?poId=${this.poId}&stageId=${this.stageId}&quantityId=${row.quantityId}`;

    this.http.patch(url, {}, { headers }).subscribe({
      next: (response) => {
        console.log('Submit successful:', response);

        // Update the local data to reflect the submitted status
        const tableRowIndex = this.tableData.findIndex(item => item.quantityId === row.quantityId);
        if (tableRowIndex !== -1) {
          this.tableData[tableRowIndex].submitted = true;
        }

        this.toastservice.showToast('success', 'Row submitted successfully');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error submitting row:', err);
        this.toastservice.showToast('error', 'Failed to submit row');
        this.loading = false;
      }
    });
  }

  // New methods for enhanced UI functionality
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

  // Optional: Method to check if data needs refresh based on timestamp
  shouldRefreshData(): boolean {
    // You can implement logic here to determine if data should be refreshed
    // For example, based on last fetch time or data staleness
    return true;
  }

  // Optional: Method to get progress percentage
  getProgressPercentage(): number {
    if (this.tableData.length === 0) return 0;
    return Math.round((this.getSubmittedCount() / this.tableData.length) * 100);
  }
}