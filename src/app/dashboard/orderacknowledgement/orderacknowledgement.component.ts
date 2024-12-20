import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ColDef, ClientSideRowModelModule, Module } from 'ag-grid-community';

@Component({
  selector: 'app-orderacknowledgement',
  standalone: false,
  
  templateUrl: './orderacknowledgement.component.html',
  styleUrl: './orderacknowledgement.component.css'
})
export class OrderacknowledgementComponent {
  public modules: Module[] = [ClientSideRowModelModule];
  poForm: FormGroup;
  rowData: any[] = [];

  columnDefs: ColDef[] = [
    { field: 'poDescription', headerName: 'PO Description' },
    { field: 'poType', headerName: 'PO Type' },
    { field: 'incoterms', headerName: 'Incoterms' },
    { field: 'shipmentDate', headerName: 'Shipment Date' },
    { field: 'proofOfDelivery', headerName: 'Proof of Delivery' },
    { field: 'contactPersonName', headerName: 'Contact Person Name' },
    { field: 'contactPersonEmail', headerName: 'Contact Person Email' },
    { field: 'alternateEmailId', headerName: 'Alternate Email ID' },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true, 
    resizable: true, 
    flex: 1, 
    minWidth: 100,
  };

  constructor(private fb: FormBuilder) {
      this.poForm = this.fb.group({
          poDescription: ['', Validators.required],
          poType: ['', Validators.required],
          incoterms: ['', Validators.required],
          shipmentDate: ['', Validators.required],
          proofOfDelivery: ['', Validators.required],
          contactPersonName: ['', Validators.required],
          contactPersonEmail: ['', [Validators.required, Validators.email]],
          alternateEmailId: ['', Validators.email],
      });
  }

  onSubmit(): void {
      if (this.poForm.valid) {
          console.log('Form Submitted:', this.poForm.value);
          this.rowData = [...this.rowData, this.poForm.value];
          this.poForm.reset();
      } else {
          console.log('Form is invalid');
      }
  }
}
