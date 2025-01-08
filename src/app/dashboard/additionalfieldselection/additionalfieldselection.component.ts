import { Component, OnInit } from '@angular/core';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { AdditionalFieldService } from './additionalfield.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-additionalfieldselection',
  standalone: false,
  templateUrl: './additionalfieldselection.component.html',
  styleUrls: ['./additionalfieldselection.component.css'],
})
export class AdditionalfieldselectionComponent implements OnInit {
  public modules: Module[] = [ClientSideRowModelModule];
  userId: string | null = null;
  responseData: any[] = [];
  rowData: any[] = [];
  columnDefs: ColDef[] = [];
  allStages: any;
  allAdditionalFields: any;

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  };

  constructor(
    private additionalFieldService: AdditionalFieldService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    this.fetchStages();
  }

  fetchStages(): void {
    this.additionalFieldService.getStages().subscribe({
      next: (stages) => {
        this.allStages = stages;
        this.setupGridColumns(stages);
        this.fetchAdditionalFields(stages);
      },
      error: (error) => console.error('Error fetching stages:', error),
    });
  }

  setupGridColumns(stages: { id: number; name: string }[]): void {
    this.columnDefs = [
      { field: 'id', headerName: 'Sr. No', valueGetter: 'node.rowIndex + 1', sortable: false },
      { field: 'additionalFieldName', headerName: 'Additional Field Name', filter: 'agTextColumnFilter' },
    ];

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
    this.additionalFieldService.getAdditionalFields().subscribe({
      next: (data) => {
        this.allAdditionalFields = data;
        this.additionalFieldService.getAdditionalFieldSelections().subscribe({
          next: (selections) => {
            this.rowData = data.map((item) => {
              const stagesData: { [key: string]: boolean } = {};
              stages.forEach((stage) => {
                const selection = selections.find(
                  (sel) =>
                    sel.stageId === stage.id &&
                    sel.additionalFieldId === item.id &&
                    sel.isDelete === 0
                );
                stagesData[`stage${stage.id}`] = !!selection;
              });
              return { ...item, ...stagesData };
            });
          },
          error: (error) => console.error('Error fetching additional field selections:', error),
        });
      },
      error: (error) => console.error('Error fetching additional fields:', error),
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

    this.additionalFieldService.updateFieldSelection(recordId, payload).subscribe({
      next: (response) => console.log('Checkbox state updated successfully:', response),
      error: (error) => console.error('Error updating checkbox state:', error),
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
