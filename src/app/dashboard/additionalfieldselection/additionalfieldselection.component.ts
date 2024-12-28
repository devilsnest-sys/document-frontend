import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { environment } from '../../../environment/environment';

interface AdditionalFieldRow {
  id: number;
  additionalFieldName: string;
  [key: `stage${number}`]: boolean; // Dynamically define stage fields
}

@Component({
  selector: 'app-additionalfieldselection',
  standalone: false,
  templateUrl: './additionalfieldselection.component.html',
  styleUrls: ['./additionalfieldselection.component.css'],
})
export class AdditionalfieldselectionComponent implements OnInit {
  public modules: Module[] = [ClientSideRowModelModule];
  userId: string | null = null;
  rowData: AdditionalFieldRow[] = [];
  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchStages();
    console.log(this.userId)
  }

  fetchStages(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/v1/stages`, { headers }).subscribe({
      next: (stages) => {
        this.setupGridColumns(stages); 
        this.fetchAdditionalFields(stages);
      },
      error: (error) => {
        console.error('Error fetching stages:', error);
      },
    });
  }

  setupGridColumns(stages: { id: number; name: string }[]): void {
    // Define the default columns
    this.columnDefs = [
      { field: 'id', headerName: 'Sr. No', valueGetter: 'node.rowIndex + 1', sortable: false },
      { field: 'additionalFieldName', headerName: 'Additional Field Name', filter: 'agTextColumnFilter' },
    ];

    // Dynamically add stage columns
    stages.forEach((stage) => {
      this.columnDefs.push({
        headerName: stage.name,
        field: `stage${stage.id}`,
        cellRenderer: this.checkboxRenderer,
        editable: false,
        cellRendererParams: {
          checkboxCallback: this.onCheckboxChange.bind(this),
        },
      });
    });
  }

  fetchAdditionalFields(stages: { id: number; name: string }[]): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<AdditionalFieldRow[]>(`${environment.apiUrl}/v1/AdditionalField`, { headers }).subscribe({
      next: (data) => {
        // Extend each row with stage properties dynamically
        this.rowData = data.map((item) => {
          const stagesData = {};
          stages.forEach((stage) => {
            // stagesData[`stage${stage.id}`] = false; // Initialize all stages as unchecked
          });
          return { ...item, ...stagesData };
        });
      },
      error: (error) => {
        console.error('Error fetching additional fields:', error);
      },
    });
  }

  onCheckboxChange(params: any): void {
    const { data, colDef, value } = params;
    const stageField = colDef.field as keyof AdditionalFieldRow;
    const stageId = Number(stageField.replace('stage', '')); // Extract the stage ID from the field name

    data[stageField] = value; // Update the stage field in the row data

    const payload = {
      id: 0,
      createdUserId: 3, // Replace with actual user ID
      updatedUserId: 3, // Replace with actual user ID
      stageId: stageId,
      additionalFieldId: data.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDelete: value ? 0 : 1, // Use 0 for checked and 1 for unchecked
    };

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post(`${environment.apiUrl}/v1/additional-field-selection`, payload, { headers }).subscribe({
      next: (response) => {
        console.log('Checkbox state saved successfully:', response);
      },
      error: (error) => {
        console.error('Error saving checkbox state:', error);
      },
    });
  }

  checkboxRenderer(params: any): HTMLElement {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = params.value;
    input.addEventListener('change', () => {
      params.value = input.checked;
      params.colDef.cellRendererParams.checkboxCallback(params);
    });
    return input;
  }
}
