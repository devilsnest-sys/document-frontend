import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { environment } from '../../../../environment/environment';
import { AuthService } from '../../../core/services/auth.service';

interface AdditionalFieldRow {
  id: number;
  additionalFieldName: string;
  [key: `stage${number}`]: boolean;
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
  responseData: Array<{
    id: number;
    createdUserId: number;
    updatedUserId: number;
    stageId: number;
    additionalFieldId: number;
    createdAt: string;
    updatedAt: string;
    isDelete: number;
  }> = [];
  
  
  rowData: AdditionalFieldRow[] = [];
  columnDefs: ColDef[] = [];



  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  };

  constructor(private http: HttpClient, private authService: AuthService) {}
allStages:any;
allAdditionalfield:any;
  ngOnInit(): void {
    this.fetchStages();
    this.userId = this.authService.getUserId();

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.get(`${environment.apiUrl}/v1/additional-field-selection`, { headers }).subscribe({
      next: (response: any) => {
        this.responseData = response; // Adjust this based on your API's response structure
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      },
    });
  }

  fetchStages(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/v1/stages`, { headers }).subscribe({
      next: (stages) => {
        this.allStages=stages;
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
        this.allAdditionalfield=data;
        // Fetch the state of selections
        this.http.get<any[]>(`${environment.apiUrl}/v1/additional-field-selection`, { headers }).subscribe({
          next: (selections) => {
            // Extend each row with stage properties dynamically
            this.rowData = data.map((item) => {
              const stagesData: { [key: string]: boolean } = {};
              stages.forEach((stage) => {
                // Check if there's a matching selection for this field and stage
                const selection = selections.find(
                  (sel) =>
                    sel.stageId === stage.id &&
                    sel.additionalFieldId === item.id &&
                    sel.isDelete === 0 // Only consider selections that are not deleted
                );
                stagesData[`stage${stage.id}`] = !!selection; // Set checkbox state
              });
              return { ...item, ...stagesData };
            });
          },
          error: (error) => {
            console.error('Error fetching additional field selections:', error);
          },
        });
      },
      error: (error) => {
        console.error('Error fetching additional fields:', error);
      },
    });
  }
  

  onCheckboxChange(params: any): void {
    const { data, colDef, value } = params;
    const stageField = colDef.field as string;
    const stageId = Number(stageField.replace('stage', ''));
    const additionalFieldId = data.id;
  
    const targetRecord = this.responseData.find(
      (item) => item.stageId === stageId && item.additionalFieldId === additionalFieldId
    );
  
    if (!targetRecord) {
      console.error(`Record not found for stageId ${stageId} and additionalFieldId ${additionalFieldId}`);
      return;
    }
  
    const recordId = targetRecord.id;
  
    const payload = {
      updatedUserId: this.userId,
      isDelete: value ? 0 : 1,
    };
  
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    const url = `${environment.apiUrl}/v1/additional-field-selection/${recordId}`;
  
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
