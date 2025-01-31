import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { environment } from '../../../../environment/environment';

interface DocumentTypeRow {
  id: number;
  documentName: string;
  [key: `stage${number}`]: boolean;
}

@Component({
  selector: 'app-documentselection',
  standalone: false,
  templateUrl: './documentselection.component.html',
  styleUrls: ['./documentselection.component.css'],
})
export class DocumentselectionComponent implements OnInit {
  public modules: Module[] = [ClientSideRowModelModule];
  userId: string | null = null;
  responseData: Array<{
    id: number;
    createdUserId: number;
    updatedUserId: number;
    stageId: number;
    documentId: number;
    createdAt: string;
    updatedAt: string;
    isDelete: number;
  }> = [];
  
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
  allStages: any;
  allDocumentTypes: any;
 ngOnInit(): void {
  this.fetchStages();  // Fetch stages on init
  this.userId = localStorage.getItem('userId');  // Get the user ID from local storage

  const token = localStorage.getItem('authToken');  // Retrieve the authentication token
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);  // Set headers with the token
  
  // Fetch the document selection data from the backend
  this.http.get(`${environment.apiUrl}/v1/document-selection`, { headers }).subscribe({
    next: (response: any) => {
      this.responseData = response;  // Adjust this based on your API's response structure
    },
    error: (error) => {
      console.error('Error fetching document selection data:', error);
    },
  });
}


  fetchStages(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/v1/stages`, { headers }).subscribe({
      next: (stages) => {
        this.allStages = stages;
        this.setupGridColumns(stages);
        this.fetchDocumentTypes(stages);
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
      { field: 'documentName', headerName: 'Document Name', filter: 'agTextColumnFilter' },
    ];

    // Dynamically add columns for stages with checkboxes
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

  fetchDocumentTypes(stages: { id: number; name: string }[]): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<DocumentTypeRow[]>(`${environment.apiUrl}/v1/DocumentType`, { headers }).subscribe({
      next: (data) => {
        this.allDocumentTypes = data;

        // Fetch selection data and update rowData with checkbox states
        this.http.get<any[]>(`${environment.apiUrl}/v1/document-selection`, { headers }).subscribe({
          next: (selections) => {
            // Update rowData with selections
            this.rowData = data.map((item) => {
              const stagesData: { [key: string]: boolean } = {};
              stages.forEach((stage) => {
                const selection = selections.find(
                  (sel) =>
                    sel.stageId === stage.id &&
                    sel.documentId === item.id &&
                    sel.isDelete === 0
                );
                stagesData[`stage${stage.id}`] = !!selection; // Set checkbox state
              });
              return { ...item, ...stagesData };
            });
          },
          error: (error) => {
            console.error('Error fetching document selections:', error);
          },
        });
      },
      error: (error) => {
        console.error('Error fetching document types:', error);
      },
    });
  }

  onCheckboxChange(params: any): void {
    const { data, colDef, value } = params;
    const stageField = colDef.field as string;
    const stageId = Number(stageField.replace('stage', ''));
    const documentId = data.id;

    const targetRecord = this.responseData.find(
      (item) => item.stageId === stageId && item.documentId === documentId
    );

    if (!targetRecord) {
      return;
    }

    const recordId = targetRecord.id;

    const payload = {
      updatedUserId: this.userId,
      isDelete: value ? 0 : 1,
    };

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const url = `${environment.apiUrl}/v1/document-selection/${recordId}`;

    this.http.patch(url, payload, { headers }).subscribe({
      next: (response) => {
        console.log('Checkbox state updated successfully:', response);
      },
      error: (error) => {
        console.error('Error updating checkbox state:', error);
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
