import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ActivatedRoute } from '@angular/router';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
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
  @Input() stageNumber!: number;
  
  rowData: AdditionalField[] = [];
  fieldForm!: FormGroup;
  loading = false;
  submitting = false;
  poNumber: string | null = null;
  editingIndex: number | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private toastService: ToastserviceService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  private initializeForm(data?: Partial<AdditionalField>): void {
    this.fieldForm = this.fb.group({
      id: [data?.id || 0],
      poId: [data?.poId || '', [Validators.required, Validators.pattern(/^\d+$/)]],
      stageId: [data?.stageId || this.stageNumber, [Validators.required, Validators.pattern(/^\d+$/)]],
      additionalFieldId: [data?.additionalFieldId || '', [Validators.required, Validators.pattern(/^\d+$/)]],
      initAddFieldValue: [data?.initAddFieldValue || ''],
      finalAddFieldValue: [data?.finalAddFieldValue || ''],
      isMandatory: [data?.isMandatory || false],
      isApproved: [data?.isApproved || false],
      isRejected: [data?.isRejected || false],
      isDocSubmited: [data?.isDocSubmited || false],
      reviewRemark: [data?.reviewRemark || '']
    });

    // Add validation to prevent both approval and rejection
    this.fieldForm.get('isApproved')?.valueChanges.subscribe(value => {
      if (value && this.fieldForm.get('isRejected')?.value) {
        this.fieldForm.get('isRejected')?.setValue(false);
      }
    });

    this.fieldForm.get('isRejected')?.valueChanges.subscribe(value => {
      if (value && this.fieldForm.get('isApproved')?.value) {
        this.fieldForm.get('isApproved')?.setValue(false);
      }
    });
  }

  ngOnInit(): void {
    this.poNumber = this.route.snapshot.paramMap.get('poNumber');
    if (this.poNumber) {
      this.fetchAdditionalFieldsFlow(this.poNumber);
    } else {
      this.toastService.showToast('error', 'No PO Number provided');
    }

    console.log('this is stage id',  this.stageNumber);
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
      ).pipe(
        catchError(error => this.handleHttpError('Failed to fetch additional fields', error)),
        finalize(() => this.loading = false)
      ).subscribe(data => {
        this.rowData = data || [];
        if (this.rowData.length > 0) {
          // Pre-fill the form with the PO ID from existing data
          this.fieldForm.patchValue({
            poId: this.rowData[0].poId
          });
        }
      });
    } catch (error) {
      this.handleError('Authentication error', error);
      this.loading = false;
    }
  }

  addRow(): void {
    if (this.fieldForm.invalid) {
      this.markFormGroupTouched(this.fieldForm);
      this.toastService.showToast('warning', 'Please fill in all required fields correctly');
      return;
    }

    const newField: AdditionalField = this.fieldForm.value;
    
    // If we're editing an existing row
    if (this.editingIndex !== null) {
      this.updateRow(this.editingIndex, newField);
      return;
    }

    // Otherwise, add new row
    this.loading = true;
    
    try {
      const headers = this.getHeaders();

      this.http.post<AdditionalField>(
        `${environment.apiUrl}/v1/UploadedAdditionalFieldFlow/Create`,
        newField,
        { headers }
      ).pipe(
        catchError(error => this.handleHttpError('Failed to add row', error)),
        finalize(() => this.loading = false)
      ).subscribe(response => {
        // Add the returned ID to our new field
        newField.id = response.id || newField.id;
        this.rowData.push(newField);
        this.resetForm();
        this.toastService.showToast('success', 'Row added successfully');
      });
    } catch (error) {
      this.handleError('Authentication error', error);
      this.loading = false;
    }
  }

  startEdit(index: number): void {
    this.editingIndex = index;
    const rowToEdit = { ...this.rowData[index] };
    this.initializeForm(rowToEdit);
  }

  cancelEdit(): void {
    this.editingIndex = null;
    this.resetForm();
  }

  updateRow(index: number, data: AdditionalField): void {
    this.loading = true;
    
    try {
      const headers = this.getHeaders();

      this.http.patch<void>(
        `${environment.apiUrl}/v1/UploadedAdditionalFieldFlow/${data.id}`,
        data,
        { headers }
      ).pipe(
        catchError(error => this.handleHttpError('Failed to update field', error)),
        finalize(() => {
          this.loading = false;
          this.editingIndex = null;
        })
      ).subscribe(() => {
        this.rowData[index] = { ...data };
        this.resetForm();
        this.toastService.showToast('success', 'Field updated successfully');
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
      ).pipe(
        catchError(error => this.handleHttpError('Failed to delete field', error)),
        finalize(() => this.loading = false)
      ).subscribe(() => {
        this.rowData.splice(index, 1);
        this.toastService.showToast('success', 'Field deleted successfully');
      });
    } catch (error) {
      this.handleError('Authentication error', error);
      this.loading = false;
    }
  }

  resetForm(): void {
    this.fieldForm.reset();
    // If we have existing data, pre-fill the PO ID
    if (this.rowData.length > 0) {
      this.fieldForm.patchValue({
        poId: this.rowData[0].poId
      });
    }
    this.editingIndex = null;
  }

  // Helper to mark all form controls as touched to trigger validation
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private handleHttpError(message: string, error: HttpErrorResponse) {
    console.error('HTTP Error:', error);
    
    let errorMessage = message;
    
    if (error.status === 401) {
      errorMessage = 'Your session has expired. Please log in again.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      errorMessage = 'The requested resource was not found.';
    } else if (error.status === 400 && error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    this.toastService.showToast('error', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private handleError(message: string, error: any): void {
    console.error('Error:', error);
    const errorMessage = error?.message || message;
    this.toastService.showToast('error', errorMessage);
  }

  // Validation helpers
  getFieldError(fieldName: string): string {
    const control = this.fieldForm.get(fieldName);
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        return 'This field is required';
      }
      if (control.errors?.['pattern']) {
        return 'Please enter a valid number';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.fieldForm.get(fieldName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}