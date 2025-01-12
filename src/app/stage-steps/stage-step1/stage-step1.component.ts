import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { ColDef, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ToastserviceService } from '../../core/services/toastservice.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-stage-step1',
  standalone: false,
  
  templateUrl: './stage-step1.component.html',
  styleUrl: './stage-step1.component.css'
})
export class StageStep1Component {

  poData: any[] = [];
  displayedColumns: string[] = [
    'pO_NO',
    'poDescription',
    'actualDeliveryDate',
    'contractualDeliveryDate',
    'contactPersonName',
    'contactPersonEmailId',
    'contactNo',
    'incoterms',
    'poType'
  ];
  isLoading = true;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const poNumber = this.route.snapshot.paramMap.get('poNumber');
    this.fetchPurchaseOrderData(poNumber);
  }

  fetchPurchaseOrderData(poNumber: string | null): void {
    if (!poNumber) {
      console.error('PO Number is missing!');
      this.isLoading = false;
      return;
    }

    const token = localStorage.getItem('authToken'); // Get token from local storage
    const url = `https://localhost:7255/api/v1/PurchaseOrder/PurchaseOrder/${poNumber}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'text/plain',
    };

    this.http.get<any[]>(url, { headers }).subscribe({
      next: (response) => {
        this.poData = response;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching PO data:', err);
        this.isLoading = false;
      },
    });
  }
}
