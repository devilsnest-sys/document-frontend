import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { environment } from '../../../../environment/environment';

interface DocumentTypeRow {
  id: number;
  documentName: string;
  [key: `stage${number}`]: boolean; // Dynamically define stage fields
}

@Component({
  selector: 'app-documentselection',
  standalone: false,
  templateUrl: './documentselection.component.html',
  styleUrls: ['./documentselection.component.css'],
})
export class DocumentselectionComponent implements OnInit {
  public modules: Module[] = [ClientSideRowModelModule];
  rowData: DocumentTypeRow[] = [];
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
    this.fetchDocumentTypes();
  }

  setupGridColumns(): void {
    // Define the default columns
    this.columnDefs = [
      { field: 'id', headerName: 'Sr. No', valueGetter: 'node.rowIndex + 1', sortable: false },
      { field: 'documentName', headerName: 'Document Name', filter: 'agTextColumnFilter' },
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

  fetchDocumentTypes(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<DocumentTypeRow[]>(`${environment.apiUrl}/v1/DocumentType`, { headers }).subscribe({
      next: (data) => {
        // Extend each row with stage properties
        this.rowData = data.map((item) => {
          const stages = {};
          for (let i = 1; i <= 15; i++) {
            // stages[`stage${i}`] = false; // Initialize all stages as unchecked
          }
          return { ...item, ...stages };
        });
        console.log('Document Types fetched successfully:', this.rowData);
      },
      error: (error) => {
        console.error('Error fetching document types:', error);
      },
    });
  }

  onCheckboxChange(params: any): void {
    const { data, colDef, value } = params;
    const stageField = colDef.field as keyof DocumentTypeRow;
    data[stageField] = value; // Update the stage field in the row data
    console.log(`Checkbox changed: ${stageField} for ${data.documentName} = ${value}`);
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
