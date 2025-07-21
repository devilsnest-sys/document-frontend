import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ActivatedRoute } from '@angular/router';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import { catchError, finalize } from 'rxjs/operators';
import { firstValueFrom, throwError } from 'rxjs';
import Swal from 'sweetalert2';

interface AdditionalField {
  id: number;
  poId: string;
  stageId: string;
  additionalFieldId: string;
  initAddFieldValue: string;
  isMandatory: boolean;
  initAddFieldCreatedBy: number;
  createdAt: string;
  additionalFieldName: string;
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
  poNumber: string | null = null;
  editingIndex: number | null = null;
  additionalFieldIdCounter = 1; // Counter for generating unique additionalFieldId
  addField: any[] | undefined;
   purchaseid: any;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private toastService: ToastserviceService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  private initializeForm(data?: Partial<AdditionalField>): void {
    // Generate dynamic values
    const now = new Date();
    const defaultPoId = data?.poId || '';
    
    this.fieldForm = this.fb.group({
      id: [data?.id || 0],
      poId: [defaultPoId],
      stageId: [data?.stageId || this.stageNumber?.toString()],
      additionalFieldId: [data?.additionalFieldId || this.additionalFieldIdCounter.toString()],
      initAddFieldValue: [data?.initAddFieldValue || '', [Validators.required]],
      isMandatory: [data?.isMandatory || false],
      initAddFieldCreatedBy: [1], // You may want to get this from a user service
      createdAt: [now.toISOString()]
    });
  }

  async ngOnInit(): Promise<void>{
    this.poNumber = this.route.snapshot.paramMap.get('poNumber');
    this.purchaseid=this.poNumber;
    await this.fetchDPoNo();
    if (this.poNumber) {
      this.fetchAdditionalFieldsFlow(this.poNumber);
    } else {
      this.toastService.showToast('error', 'No PO Number provided');
    }

    console.log('this is stage id', this.stageNumber);
    this.fetchAdditionalFields();
   
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No auth token found');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

//     fetchDPoNo(): void {
//       this.http
//     .get<any>(`${environment.apiUrl}/v1/PurchaseOrder/${this.poNumber}`, {
//       headers: this.getHeaders(),
//     })
//     .pipe(
   
//     )
//     .subscribe({
//       next: (response) => {
//         console.log('Fetched PO details:', response);

//         this.poNumber = response.pO_NO; 
//         console.log("this is po number", this.poNumber ) // <- extract the PO number from response
        
//       },
//     });
// }
async fetchDPoNo(): Promise<void> {
  try {
    const response = await firstValueFrom(
      this.http.get<any>(`${environment.apiUrl}/v1/PurchaseOrder/${this.poNumber}`, {
        headers: this.getHeaders(),
      })
    );
    console.log('Fetched PO details:', response);
    this.poNumber = response.pO_NO;
  } catch (error) {
    console.error('Error fetching PO:', error);
    this.toastService.showToast('error', 'Failed to fetch PO Number');
  }
}
  fetchAdditionalFields(): void{
    this.loading = true;
 debugger;
 //console.log("this is additional field", this.poNumber);
    try{
      const headers = this.getHeaders();

      this.http.get<AdditionalField[]>(
       
        `${environment.apiUrl}/v1/additional-field-selection/additionalfield/${this.stageNumber}?poNo=${this.poNumber}`,
        { headers }
      ).pipe(
        catchError(error => this.handleHttpError('Failed to fetch additional fields-34', error)),
        finalize(() => this.loading = false)
      ).subscribe(data => {
        this.addField = data || [];
        console.log("this is additional field", this.addField);
        if (this.addField.length > 0) {
          const maxId = Math.max(...this.addField.map(row => parseInt(row.additionalFieldId) || 0));
          this.additionalFieldIdCounter = maxId + 1;
        }
      });
    } catch (error) {
      this.handleError('Authentication error', error);
      this.loading = false;
    }
  }

  fetchAdditionalFieldsFlow(poNumber: string): void {
    this.loading = true;
debugger;
    try {
      const headers = this.getHeaders();

      this.http.get<AdditionalField[]>(
        `${environment.apiUrl}/v1/UploadedAdditionalFieldFlow/${this.stageNumber}/${this.purchaseid}`,
        { headers }
      ).pipe(
        catchError(error => this.handleHttpError('Failed to fetch additional fields -12', error)),
        finalize(() => this.loading = false)
      ).subscribe(data => {
        this.rowData = data || [];
        if (this.rowData.length > 0) {
          // Pre-fill the form with the PO ID from existing data
          this.fieldForm.patchValue({
            poId: this.rowData[0].poId,
          });
          
          // Update additionalFieldIdCounter to be higher than any existing ID
          const maxId = Math.max(...this.rowData.map(row => parseInt(row.additionalFieldId) || 0));
          this.additionalFieldIdCounter = maxId + 1;
        }
      });
    } catch (error) {
      this.handleError('Authentication error', error);
      this.loading = false;
    }
  }

  addRow(fieldId: number): void {
    if (this.fieldForm.invalid) {
      this.markFormGroupTouched(this.fieldForm);
      this.toastService.showToast('warning', 'Please fill in all required fields correctly');
      return;
    }

    // Ensure poId is set from either existing data or from the route parameter
    if (!this.fieldForm.get('poId')?.value) {
      this.fieldForm.patchValue({
        poId: this.purchaseid
      });
    }

    if (!this.fieldForm.get('stageId')?.value && this.stageNumber) {
      this.fieldForm.patchValue({
        stageId: this.stageNumber.toString()
      });
    }

    // Ensure additionalFieldId is correctly set using the fieldId from the template
  this.fieldForm.patchValue({
    additionalFieldId: fieldId.toString()
  });

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
        
        // Increment the additionalFieldId counter for the next new item
        this.additionalFieldIdCounter++;

        
        this.resetForm();
        this.toastService.showToast('success', 'Row added successfully');
        location.reload();
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
    } else if (this.poNumber) {
      this.fieldForm.patchValue({
        poId: this.poNumber
      });
    }
    
    // Set the stage ID and additional field ID
    this.fieldForm.patchValue({
      stageId: this.stageNumber?.toString(),
      additionalFieldId: this.additionalFieldIdCounter.toString()
    });
    
    this.editingIndex = null;
  }

  filteredFields() {
    if (!this.addField) {
      return []; // Return an empty array if addField is undefined
    }
  
    const usedFieldIds = new Set(
      (this.rowData || []) // Ensure rowData is also defined
        .filter(row => row.initAddFieldValue)
        .map(row => row.additionalFieldId)
    );
  
    return this.addField.filter(field => !usedFieldIds.has(field.id));
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