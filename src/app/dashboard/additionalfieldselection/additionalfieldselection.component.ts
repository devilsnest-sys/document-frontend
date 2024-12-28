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
    this.setupGridColumns();
    this.fetchAdditionalFields();
  }

  setupGridColumns(): void {
    // Define the default columns
    this.columnDefs = [
      { field: 'id', headerName: 'Sr. No', valueGetter: 'node.rowIndex + 1', sortable: false },
      { field: 'additionalFieldName', headerName: 'Additional Field Name', filter: 'agTextColumnFilter' },
    ];

    // Dynamically add columns for stages with checkboxes
    for (let i = 1; i <= 15; i++) {
      this.columnDefs.push({
        headerName: `Stage ${i}`,
        field: `stage${i}`,
        cellRenderer: this.checkboxRenderer,
        editable: false,
        cellRendererParams: {
          checkboxCallback: this.onCheckboxChange.bind(this),
        },
      });
    }
  }

  fetchAdditionalFields(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<AdditionalFieldRow[]>(`${environment.apiUrl}/v1/AdditionalField`, { headers }).subscribe({
      next: (data) => {
        // Extend each row with stage properties
        this.rowData = data.map((item) => {
          const stages = {};
          for (let i = 1; i <= 15; i++) {
            // stages[`stage${i}`] = false; // Initialize all stages as unchecked
          }
          return { ...item, ...stages };
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
    data[stageField] = value; // Update the stage field in the row data
    console.log(`Checkbox changed: ${stageField} for ${data.additionalFieldName} = ${value}`);
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
