import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'; 
import { AuthService } from '../../services/auth.service';
import { ToastserviceService } from '../../services/toastservice.service';

@Component({
  selector: 'app-masterstaging',
  standalone: false,
  
  templateUrl: './masterstaging.component.html',
  styleUrl: './masterstaging.component.css'
})
export class MasterstagingComponent {
  stageForm!: FormGroup;
  isSubmitting = false;
   public modules: Module[] = [ClientSideRowModelModule];
  rowData: any[] = [];

  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', filter: 'agNumberColumnFilter' },
    { field: 'sequence', headerName: 'Sequence', filter: 'agNumberColumnFilter' },
    { field: 'stageName', headerName: 'Stage Name', filter: 'agTextColumnFilter' },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  };

  constructor(private fb: FormBuilder, private http: HttpClient, private ToastserviceService: ToastserviceService) {}

  ngOnInit(): void {
    this.stageForm = this.fb.group({
      sequence: [1, [Validators.required, Validators.min(1)]],
      stageName: ['', [Validators.required, Validators.minLength(3)]],
    });
    this.fetchStages();
  }

  fetchStages(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>(`${environment.apiUrl}/v1/stages`, { headers }).subscribe({
    next: (data) => {
      this.rowData = data.map(item => {
        const { stageStatuses, ...rest } = item;  
        return rest;  
      });
      console.log('Stages fetched successfully:', this.rowData);
    },
    error: (error) => {
      console.error('Error fetching stages:', error);
    },
  });
  }

  onSubmit(): void {
    if (this.stageForm.valid) {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.isSubmitting = true;
      const payload = {
        id: 0,
        sequence: this.stageForm.value.sequence,
        stageName: this.stageForm.value.stageName,
        StageStatuses: []
      };

      this.http.post(`${environment.apiUrl}/v1/stages`, payload, { headers }).subscribe({
        next: (response) => {
          console.log('Stage saved successfully:', response);
          this.stageForm.reset();
          this.stageForm.patchValue({ sequence: 1 });
          this.fetchStages();
          this.ToastserviceService.showToast('success', 'Stage Created Successfully');
        },
        error: (error) => {
          this.ToastserviceService.showToast('error', 'Stage Creation Failed');
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    }
  }

  onCancel(): void {
    this.stageForm.reset();
    this.stageForm.patchValue({ sequence: 1 });
  }
}
