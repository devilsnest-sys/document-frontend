import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ActivatedRoute } from '@angular/router';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import { catchError, finalize } from 'rxjs/operators';
import { firstValueFrom, of, throwError } from 'rxjs';
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

interface AvailableField {
  id: number;
  additionalFieldName: string;
}

interface StageFieldsMap {
  [stageId: string]: AvailableField[];
}

interface StageGroup {
  stageId: number;
  stageName: string;
  availableFields: AvailableField[];
  uploadedFields: AdditionalField[];
}

interface Stage {
  id: number;
  sequence: number;
  stageName: string;
  stageStatuses: any[];
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
  additionalFieldIdCounter = 1;
  purchaseid: any;
  
  // New properties for grouped structure
  stageFieldsMap: StageFieldsMap = {};
  stageGroups: StageGroup[] = [];
  expandedStages: { [key: number]: boolean } = {};
  expandedFields: { [key: string]: boolean } = {};
  
  // Stage names mapping
  stageNames: { [key: number]: string } = {};

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private toastService: ToastserviceService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  private initializeForm(data?: Partial<AdditionalField>): void {
    const now = new Date();
    const defaultPoId = data?.poId || '';
    
    this.fieldForm = this.fb.group({
      id: [data?.id || 0],
      poId: [defaultPoId],
      stageId: [data?.stageId || ''],
      additionalFieldId: [data?.additionalFieldId || ''],
      initAddFieldValue: [data?.initAddFieldValue || '', [Validators.required]],
      isMandatory: [data?.isMandatory || false],
      initAddFieldCreatedBy: [1],
      createdAt: [now.toISOString()]
    });
  }

  async ngOnInit(): Promise<void> {
    this.poNumber = this.route.snapshot.paramMap.get('poNumber');
    this.purchaseid = this.poNumber;
    this.fetchStageNames();
    await this.fetchDPoNo();
    
    if (this.poNumber) {
      await this.fetchAllStageFields();
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

  async fetchAllStageFields(): Promise<void> {
    this.loading = true;
    
    try {
      const headers = this.getHeaders();

      // Fetch available fields grouped by stage
      this.http.get<StageFieldsMap>(
        `${environment.apiUrl}/v1/additional-field-selection/addfield-by-po-Group?poNo=${this.poNumber}`,
        { headers }
      ).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.stageFieldsMap = {};
            this.stageGroups = [];
            return of({});
          }
          return this.handleHttpError('Failed to fetch additional fields', error);
        }),
        finalize(() => (this.loading = false))
      ).subscribe({
        next: async (stageFieldsMap) => {
          console.log('Fetched stage fields:', stageFieldsMap);
          this.stageFieldsMap = stageFieldsMap;
          
          // Initialize expanded states
          Object.keys(stageFieldsMap).forEach((stageId) => {
            this.expandedStages[parseInt(stageId)] = false;
          });

          // Fetch uploaded fields for all stages
          await this.fetchAllUploadedFields();
        },
        error: (error) => {
          console.error('Error fetching stage fields:', error);
        },
      });
    } catch (error) {
      this.handleError('Authentication error', error);
      this.loading = false;
    }
  }

   fetchStageNames(): void {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Fetch stages 1-10 (adjust range based on your needs)
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

  async fetchAllUploadedFields(): Promise<void> {
    this.loading = true;

    const stageIds = Object.keys(this.stageFieldsMap).map((id) => parseInt(id));

    const requests = stageIds.map((stageId) => {
      return this.http.get<AdditionalField[]>(
        `${environment.apiUrl}/v1/UploadedAdditionalFieldFlow/${stageId}/${this.purchaseid}`,
        { headers: this.getHeaders() }
      ).pipe(catchError(() => of([])));
    });

    Promise.all(requests.map((req) => req.toPromise())).then((results) => {
      this.rowData = results.flat().filter((field): field is AdditionalField => field !== undefined);
      console.log('All uploaded fields:', this.rowData);
      this.groupFieldsByStage();
      this.loading = false;
    });
  }

  private groupFieldsByStage(): void {
    this.stageGroups = [];

    Object.keys(this.stageFieldsMap).forEach((stageIdStr) => {
      const stageId = parseInt(stageIdStr);
      const availableFields = this.stageFieldsMap[stageIdStr];

      const uploadedFields = this.rowData.filter(
        (field) => parseInt(field.stageId) === stageId
      );

      this.stageGroups.push({
        stageId: stageId,
        stageName: this.stageNames[stageId] || `Stage ${stageId}`,
        availableFields: availableFields,
        uploadedFields: uploadedFields,
      });
    });

    this.stageGroups.sort((a, b) => a.stageId - b.stageId);
    console.log('Grouped fields by stage:', this.stageGroups);
  }

  toggleStage(stageId: number): void {
    this.expandedStages[stageId] = !this.expandedStages[stageId];
  }

  isStageExpanded(stageId: number): boolean {
    return this.expandedStages[stageId] === true;
  }

  toggleField(stageId: number, fieldId: number): void {
    const key = `${stageId}-${fieldId}`;
    this.expandedFields[key] = !this.expandedFields[key];
  }

  isFieldExpanded(stageId: number, fieldId: number): boolean {
    const key = `${stageId}-${fieldId}`;
    return this.expandedFields[key] === true;
  }

  getFieldCountForStage(stageId: number): number {
    const stage = this.stageGroups.find((s) => s.stageId === stageId);
    return stage ? stage.availableFields.length : 0;
  }

  getUploadedFieldsForField(stageId: number, fieldId: number): AdditionalField[] {
    return this.rowData.filter(
      (field) => parseInt(field.stageId) === stageId && parseInt(field.additionalFieldId) === fieldId
    );
  }

  isFieldVisible(stageId: number, field: AvailableField): boolean {
    const uploadedFields = this.getUploadedFieldsForField(stageId, field.id);
    return uploadedFields.length === 0;
  }

  addRow(stageId: number, fieldId: number): void {
    if (this.fieldForm.invalid) {
      this.markFormGroupTouched(this.fieldForm);
      this.toastService.showToast('warning', 'Please fill in all required fields correctly');
      return;
    }

    this.fieldForm.patchValue({
      poId: this.purchaseid,
      stageId: stageId.toString(),
      additionalFieldId: fieldId.toString()
    });

    const newField: AdditionalField = this.fieldForm.value;
    
    if (this.editingIndex !== null) {
      this.updateRow(this.editingIndex, newField);
      return;
    }

    this.loading = true;
    
    try {
      const headers = this.getHeaders();

      this.http.post<AdditionalField>(
        `${environment.apiUrl}/v1/UploadedAdditionalFieldFlow/Create`,
        newField,
        { headers }
      ).pipe(
        catchError(error => this.handleHttpError('Failed to add field', error)),
        finalize(() => this.loading = false)
      ).subscribe(response => {
        newField.id = response.id || newField.id;
        this.rowData.push(newField);
        
        this.resetForm();
        this.toastService.showToast('success', 'Field added successfully');
        this.groupFieldsByStage();
      });
    } catch (error) {
      this.handleError('Authentication error', error);
      this.loading = false;
    }
  }

  startEdit(index: number, field: AdditionalField): void {
    this.editingIndex = index;
    const rowToEdit = { ...field };
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
        const fieldIndex = this.rowData.findIndex(f => f.id === data.id);
        if (fieldIndex !== -1) {
          this.rowData[fieldIndex] = { ...data };
        }
        this.resetForm();
        this.toastService.showToast('success', 'Field updated successfully');
        this.groupFieldsByStage();
      });
    } catch (error) {
      this.handleError('Authentication error', error);
      this.loading = false;
    }
  }

  deleteFieldFlow(field: AdditionalField): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.performDelete(field.id);
      }
    });
  }

  private performDelete(id: number): void {
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
        const index = this.rowData.findIndex(f => f.id === id);
        if (index !== -1) {
          this.rowData.splice(index, 1);
        }
        this.toastService.showToast('success', 'Field deleted successfully');
        this.groupFieldsByStage();
      });
    } catch (error) {
      this.handleError('Authentication error', error);
      this.loading = false;
    }
  }

  resetForm(): void {
    this.fieldForm.reset();
    
    this.fieldForm.patchValue({
      poId: this.purchaseid
    });
    
    this.editingIndex = null;
  }

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

  getFieldError(fieldName: string): string {
    const control = this.fieldForm.get(fieldName);
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        return 'This field is required';
      }
      if (control.errors?.['pattern']) {
        return 'Please enter a valid value';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.fieldForm.get(fieldName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}