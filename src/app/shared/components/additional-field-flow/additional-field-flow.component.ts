import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ActivatedRoute } from '@angular/router';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import Swal from 'sweetalert2';

interface AdditionalField {
  id: number;
  poId: string;
  stageId: string;
  additionalFieldId: string;
  initAddFieldValue: string;
  finalAddFieldValue: string;
  isMandatory: boolean;
  isApproved: boolean;
  isRejected: boolean;
  isDocSubmited: boolean;
  reviewRemark: string;
}

@Component({
  selector: 'app-additional-field-flow',
  standalone: false,
  templateUrl: './additional-field-flow.component.html',
  styleUrl: './additional-field-flow.component.css'
})
export class AdditionalFieldFlowComponent implements OnInit {
  rowData: AdditionalField[] = [];
  fieldForm!: FormGroup;
  loading = false;
  submitting = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private toastService: ToastserviceService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.fieldForm = this.fb.group({
      poId: ['', Validators.required],
      stageId: ['', Validators.required],
      additionalFieldId: ['', Validators.required],
      initAddFieldValue: [''],
      finalAddFieldValue: [''],
      isMandatory: [false],
      isApproved: [false],
      isRejected: [false],
      isDocSubmited: [false],
      reviewRemark: ['']
    });
  }

  ngOnInit(): void {
    const poNumber = this.route.snapshot.paramMap.get('poNumber');
    if (poNumber) {
      this.fetchAdditionalFieldsFlow(poNumber);
    } else {
      this.toastService.showToast('error', 'No PO Number provided');
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No auth token found');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  fetchAdditionalFieldsFlow(poNumber: string): void {
    this.loading = true;

    try {
      const headers = this.getHeaders();

      this.http.get<AdditionalField[]>(
        `${environment.apiUrl}/v1/UploadedAdditionalFieldFlow/${poNumber}`,
        { headers }
      ).subscribe({
        next: (data) => {
          this.rowData = data || [];
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.handleError('Failed to fetch additional fields', error);
          this.loading = false;
        }
      });
    } catch (error) {
      this.handleError('Authentication error', error);
      this.loading = false;
    }
  }

  addRow(): void {
    if (this.fieldForm.invalid) {
      this.toastService.showToast('warning', 'Please fill in all required fields');
      return;
    }

    const newField: AdditionalField = this.fieldForm.value;
    this.rowData.push(newField);
    this.fieldForm.reset();
    this.initializeForm(); // Reset with default values
    this.toastService.showToast('success', 'Row added successfully');
  }

  editRow(index: number, data: AdditionalField): void {
    this.loading = true;
    
    try {
      const headers = this.getHeaders();

      this.http.patch<void>(
        `${environment.apiUrl}/v1/UploadedAdditionalFieldFlow/${data.id}`,
        data,
        { headers }
      ).subscribe({
        next: () => {
          this.rowData[index] = { ...data };
          this.toastService.showToast('success', 'Field updated successfully');
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.handleError('Failed to update field', error);
          this.loading = false;
        }
      });
    } catch (error) {
      this.handleError('Authentication error', error);
      this.loading = false;
    }
  }

  deleteFieldFlow(index: number, id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.performDelete(index, id);
      }
    });
  }

  private performDelete(index: number, id: number): void {
    this.loading = true;
    
    try {
      const headers = this.getHeaders();

      this.http.delete<void>(
        `${environment.apiUrl}/v1/UploadedAdditionalFieldFlow/${id}`,
        { headers }
      ).subscribe({
        next: () => {
          this.rowData.splice(index, 1);
          this.toastService.showToast('success', 'Field deleted successfully');
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.handleError('Failed to delete field', error);
          this.loading = false;
        }
      });
    } catch (error) {
      this.handleError('Authentication error', error);
      this.loading = false;
    }
  }

  onSubmit(): void {
    if (this.rowData.length === 0) {
      this.toastService.showToast('error', 'No data available to submit');
      return;
    }

    this.submitting = true;
    const lastRowData = this.rowData[this.rowData.length - 1];
    
    try {
      const headers = this.getHeaders();

      this.http.post<void>(
        `${environment.apiUrl}/v1/UploadedAdditionalFieldFlow/Create`,
        { dto: lastRowData },
        { headers }
      ).subscribe({
        next: () => {
          this.toastService.showToast('success', 'Last row submitted successfully');
          this.submitting = false;
        },
        error: (error: HttpErrorResponse) => {
          this.handleError('Submission failed', error);
          this.submitting = false;
        }
      });
    } catch (error) {
      this.handleError('Authentication error', error);
      this.submitting = false;
    }
  }

  private handleError(message: string, error: any): void {
    console.error('Error:', error);
    const errorMessage = error?.error?.message || error?.message || message;
    this.toastService.showToast('error', errorMessage);
  }
}