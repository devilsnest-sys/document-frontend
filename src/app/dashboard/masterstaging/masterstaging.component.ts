import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'; 
import { ToastserviceService } from '../../services/toastservice.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-masterstaging',
  standalone: false,
  templateUrl: './masterstaging.component.html',
  styleUrl: './masterstaging.component.css'
})
export class MasterstagingComponent {
  stageForm!: FormGroup;
  isSubmitting = false;
  editingStageId: number | null = null;
  public modules: Module[] = [ClientSideRowModelModule];
  rowData: any[] = [];

  columnDefs: ColDef[] = [
    { field: 'sno', headerName: 'S No', valueGetter: "node.rowIndex + 1" },
    { field: 'sequence', headerName: 'Sequence', filter: 'agNumberColumnFilter' },
    { field: 'stageName', headerName: 'Stage Name', filter: 'agTextColumnFilter' },
    {
      field: 'action',
      headerName: 'Action',
      cellRenderer: (params: any) => {
        return `
        <button class="btn-action edit-btn" title="Edit">
        <span class="material-icons">edit</span>
      </button>
      <button class="btn-action delete-btn" title="Delete">
        <span class="material-icons">delete</span>
      </button>
        `;
      },
      onCellClicked: (params: any) => {
        if (params.event.target.closest('.edit-btn')) {
          this.openEditPopup(params.data);
        } else if (params.event.target.closest('.delete-btn')) {
          this.confirmDelete(params.data.id);
        }
      },
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  };

  constructor(private fb: FormBuilder, private http: HttpClient, private toastService: ToastserviceService) {}

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
        this.rowData = data.map((item, index) => {
          const { stageStatuses, ...rest } = item;
          return { ...rest, sno: index + 1 };
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
        id: this.editingStageId || 0,
        sequence: this.stageForm.value.sequence,
        stageName: this.stageForm.value.stageName,
        stageStatuses: [],
      };

      const apiUrl = this.editingStageId
        ? `${environment.apiUrl}/v1/stages/${this.editingStageId}`
        : `${environment.apiUrl}/v1/stages`;

      const request = this.editingStageId
        ? this.http.put(apiUrl, payload, { headers })
        : this.http.post(apiUrl, payload, { headers });

      request.subscribe({
        next: (response) => {
          console.log(this.editingStageId ? 'Stage updated successfully:' : 'Stage created successfully:', response);
          this.stageForm.reset();
          this.stageForm.patchValue({ sequence: 1 });
          this.fetchStages();
          this.toastService.showToast('success', this.editingStageId ? 'Stage Updated Successfully' : 'Stage Created Successfully');
          this.editingStageId = null;
        },
        error: (error) => {
          this.toastService.showToast('error', this.editingStageId ? 'Stage Update Failed' : 'Stage Creation Failed');
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    }
  }

  openEditPopup(stage: any): void {
    Swal.fire({
      title: 'Edit Stage',
      html: `
        <input id="sequence" class="swal2-input" type="number" min="1" value="${stage.sequence}" placeholder="Sequence">
        <input id="stageName" class="swal2-input" type="text" value="${stage.stageName}" placeholder="Stage Name">
      `,
      focusConfirm: false,
      preConfirm: () => {
        const sequence = (document.getElementById('sequence') as HTMLInputElement).value;
        const stageName = (document.getElementById('stageName') as HTMLInputElement).value;

        if (!sequence || !stageName) {
          Swal.showValidationMessage('All fields are required');
          return null;
        }

        return { sequence: +sequence, stageName };
      },
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.updateStage(stage.id, result.value);
      }
    });
  }

  updateStage(stageId: number, updatedData: { sequence: number; stageName: string }): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const payload = {
      id: stageId,
      sequence: updatedData.sequence,
      stageName: updatedData.stageName,
      stageStatuses: [], // Assuming this field is optional
    };

    this.http.put(`${environment.apiUrl}/v1/stages/${stageId}`, payload, { headers }).subscribe({
      next: () => {
        this.toastService.showToast('success', 'Stage Updated Successfully');
        this.fetchStages(); // Refresh data after update
      },
      error: (error) => {
        console.error('Error updating stage:', error);
        this.toastService.showToast('error', 'Stage Update Failed');
      },
    });
  }

  confirmDelete(stageId: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteStage(stageId);
      }
    });
  }
  deleteStage(stageId: number): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete(`${environment.apiUrl}/v1/stages/${stageId}`, { headers }).subscribe({
      next: () => {
        this.toastService.showToast('success', 'Stage Deleted Successfully');
        this.fetchStages(); // Refresh data after deletion
      },
      error: (error) => {
        console.error('Error deleting stage:', error);
        this.toastService.showToast('error', 'Stage Deletion Failed');
      },
    });
  }

  onCancel(): void {
    this.stageForm.reset();
    this.stageForm.patchValue({ sequence: 1 });
    this.editingStageId = null;
  }
}
