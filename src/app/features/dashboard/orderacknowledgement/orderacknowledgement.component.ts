import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ColDef, ICellRendererParams, Module } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'; 
import { ToastserviceService } from '../../../core/services/toastservice.service';
import { AuthService } from '../../../core/services/auth.service';
import { ViewChild, ElementRef } from '@angular/core';
import { UtilService } from '../../../core/services/util.service';

interface Vendor {
  companyName: any;
  id: number;
  vendorCode: string;
  contactNameTitle?: string;
  contactEmail?: string;
  email?: string;
  contactPhone1?: string;
  telephone?: string;
}

interface StaggeredData {
  id: number;
  quantity: string;
  deliveryDateOfQuantity: Date;
  poId: number;
}

interface PurchaseOrder {
  id: number;
  pO_NO: string;
  poDescription: string;
  poType: number;
  incoterms: number;
  poTypeName: string;
  incotermName: string;
  contractualDeliveryDate: string;
  actualDeliveryDate: string;
  contactPersonName: string;
  contactPersonEmailId: string;
  contactNo: string;
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
  isDeleted: boolean;
  vendorId: number;
  poFilePath: string;
  vendorCode: string;
  reminderSent: boolean;
  vendName: string | null;
  staggeredOrder: boolean;
  orderValue: string | null;
  shippingDate: string | null;
  cpbgDueDate: string | null;
  dlpDueDate: string | null;
  stageStatuses: any[];
  staggeredDataList: any[] | null;
  uploadedDocumentFlow: any[] | null;
}

@Component({
  selector: 'app-orderacknowledgement',
  standalone: false,  
  templateUrl: './orderacknowledgement.component.html',
  styleUrl: './orderacknowledgement.component.css'
})
export class OrderacknowledgementComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  poForm: FormGroup;
  editPoForm: FormGroup;
  rowData: any[] = [];
  
  userId: string | null = null;
  selectedFile: File | null = null;
  filteredRowData: any[] = [];
  poSearchText: string = ''; 
  incotermsList: any[] = []; 
  poTypeList: any[] = [];
  public modules: Module[] = [ClientSideRowModelModule];

  bulkPoFile: File | null = null;
  bulkPoFileName: string = '';

  vendors: Vendor[] = [];
  vendorId: string | null = null;
  selectedVendorId: number | null = null;
  
  isStaggeredOrder: boolean = false;
  
  // Edit functionality properties
  allPurchaseOrders: PurchaseOrder[] = [];
  selectedPoForEdit: number | null = null;
  isEditMode: boolean = false;

  today = new Date();

  
  columnDefs: ColDef[] = [
    { field: 'poDescription', headerName: 'PO Description' },
    { field: 'poTypeName', headerName: 'PO Type' },
    { field: 'incotermName', headerName: 'Incoterms' },
    { field: 'actualDeliveryDate', headerName: 'Shipment Date' },
    { field: 'contactPersonName', headerName: 'Contact Person Name' },
    { field: 'contactPersonEmailId', headerName: 'Contact Person Email' },
    {
      field: 'actions',
      headerName: 'Actions',
      cellRenderer: (params: ICellRendererParams) => {
        const eDiv = document.createElement('div');
        
        // Create view button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn-action upload-btn';
        viewBtn.innerHTML = '<span class="material-icons">visibility</span>';
        viewBtn.addEventListener('click', () => this.viewDocument(params.data.id));
        
        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn-action upload-btn';
        downloadBtn.innerHTML = '<span class="material-icons">download</span>';
        downloadBtn.addEventListener('click', () => this.downloadDocument(params.data.id));
        
        eDiv.appendChild(viewBtn);
        eDiv.appendChild(downloadBtn);
        return eDiv;
      },
      width: 150,
    },
  ];

  gridOptions = {
    context: {
      viewDocument: this.viewDocument.bind(this),
      downloadDocument: this.downloadDocument.bind(this)
    }
  };

  defaultColDef: ColDef = {
    sortable: true,
    filter: true, 
    resizable: true, 
    flex: 1, 
    minWidth: 100,
  };

  constructor(private fb: FormBuilder, private http: HttpClient, private authService: AuthService, private ToastserviceService : ToastserviceService, private utilService: UtilService) {
    this.poForm = this.fb.group({
      poDescription: ['', Validators.required],
      poType: ['', Validators.required],
      incoterms: ['', Validators.required],
      contractualDeliveryDate: ['', Validators.required, noPastDateValidator],
      actualDeliveryDate: ['', [noPastDateValidator]],

      contactPersonName: ['', Validators.required],
      contactPersonEmailId: ['', [Validators.required]],
      contactNumber: ['', Validators.required],
      poFilePath: [null, Validators.required],
      poNo: ['', [Validators.required]],
      vendorCode: ['', Validators.required],
      orderValue: ['', Validators.required],
shippingDate: ['', [noPastDateValidator]],
cpbgDueDate: ['', [noPastDateValidator]],
dlpDueDate: ['', [noPastDateValidator]],
      isStaggered: [false],
      staggeredDataList: this.fb.array([])
    });

    // Initialize edit form
    this.editPoForm = this.fb.group({
      id: [{ value: '', disabled: true }],
      poNo: [{ value: '', disabled: true }],
      poDescription: [{ value: '', disabled: true }],
      poType: [{ value: '', disabled: true }],
      incoterms: [{ value: '', disabled: true }],
      contactPersonName: [{ value: '', disabled: true }],
      contactPersonEmailId: [{ value: '', disabled: true }],
      contactNumber: [{ value: '', disabled: true }],
      vendorCode: [{ value: '', disabled: true }],
      orderValue: [{ value: '', disabled: true }],
      // Editable date fields
      contractualDeliveryDate: ['', Validators.required], noPastDateValidator,
actualDeliveryDate: ['', [noPastDateValidator]],
shippingDate: ['', [noPastDateValidator]],
cpbgDueDate: ['', [noPastDateValidator]],
dlpDueDate: ['', [noPastDateValidator]],
    });
  }

  ngOnInit(): void {
    this.fetchPo();
    this.fetchIncoterms();
    this.fetchpotypes();
    this.fetchVendors();
    this.fetchAllPurchaseOrders();
    this.userId = this.authService.getUserId();
    
    // Initialize with one staggered item by default
    this.addStaggeredItem();
  }

  get staggeredDataList() {
    return this.poForm.get('staggeredDataList') as FormArray;
  }

  onStaggeredChange(event: any): void {
    this.isStaggeredOrder = event.checked;
    
    if (this.isStaggeredOrder) {
      // If enabling staggered order and no items exist, add one
      if (this.staggeredDataList.length === 0) {
        this.addStaggeredItem();
      }
    } else {
      // If disabling staggered order, clear all items
      this.clearStaggeredItems();
    }
  }

  addStaggeredItem(): void {
    const staggeredGroup = this.fb.group({
      id: [0],
      quantity: ['', [Validators.required, Validators.min(1)]],
      deliveryDateOfQuantity: ['', Validators.required],
      poId: [0]
    });
    
    this.staggeredDataList.push(staggeredGroup);
  }

  removeStaggeredItem(index: number): void {
    if (this.staggeredDataList.length > 1) {
      this.staggeredDataList.removeAt(index);
    }
  }

  clearStaggeredItems(): void {
    while (this.staggeredDataList.length !== 0) {
      this.staggeredDataList.removeAt(0);
    }
  }

  fetchVendors(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<Vendor[]>(`${environment.apiUrl}/v1/vendors`, { headers }).subscribe({
      next: (response) => {
        this.vendors = response;
      },
      error: (error) => {
        console.error('Error fetching vendors:', error);
      }
    });
  }

  // Fetch all purchase orders for edit dropdown
  fetchAllPurchaseOrders(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<PurchaseOrder[]>(`${environment.apiUrl}/v1/PurchaseOrder`, { headers }).subscribe({
      next: (response) => {
        this.allPurchaseOrders = response;
      },
      error: (error) => {
        console.error('Error fetching all purchase orders:', error);
        this.ToastserviceService.showToast('error', 'Error fetching purchase orders');
      }
    });
  }

  // Fetch specific PO by ID and populate edit form
  onPoSelectionForEdit(poId: number): void {
    if (!poId) {
      this.resetEditForm();
      return;
    }

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<PurchaseOrder>(`${environment.apiUrl}/v1/PurchaseOrder/${poId}`, { headers }).subscribe({
      next: (po) => {
        this.populateEditForm(po);
        this.isEditMode = true;
      },
      error: (error) => {
        console.error('Error fetching PO details:', error);
        this.ToastserviceService.showToast('error', 'Error fetching PO details');
      }
    });
  }

  populateEditForm(po: PurchaseOrder): void {
    // Convert date strings to Date objects for form
    const contractualDate = po.contractualDeliveryDate ? new Date(po.contractualDeliveryDate) : null;
    const actualDate = po.actualDeliveryDate ? new Date(po.actualDeliveryDate) : null;
    const shippingDate = po.shippingDate ? new Date(po.shippingDate) : null;
    const cpbgDate = po.cpbgDueDate ? new Date(po.cpbgDueDate) : null;
    const dlpDate = po.dlpDueDate ? new Date(po.dlpDueDate) : null;

    this.editPoForm.patchValue({
      id: po.id,
      poNo: po.pO_NO,
      poDescription: po.poDescription,
      poType: po.poTypeName,
      incoterms: po.incotermName,
      contactPersonName: po.contactPersonName,
      contactPersonEmailId: po.contactPersonEmailId,
      contactNumber: po.contactNo,
      vendorCode: po.vendorCode,
      orderValue: po.orderValue || '',
      // Editable date fields
      contractualDeliveryDate: contractualDate,
      actualDeliveryDate: actualDate,
      shippingDate: shippingDate,
      cpbgDueDate: cpbgDate,
      dlpDueDate: dlpDate
    });
  }

  onEditSubmit(): void {
    if (!this.editPoForm.valid || !this.selectedPoForEdit) {
      this.markFormGroupTouched(this.editPoForm);
      return;
    }

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const formValues = this.editPoForm.getRawValue();
    
    const updatePayload = {
      contractualDeliveryDate: formValues.contractualDeliveryDate ? new Date(formValues.contractualDeliveryDate).toISOString() : null,
      actualDeliveryDate: formValues.actualDeliveryDate ? new Date(formValues.actualDeliveryDate).toISOString() : null,
      shippingDate: formValues.shippingDate ? new Date(formValues.shippingDate).toISOString() : null,
      cpbgDueDate: formValues.cpbgDueDate ? new Date(formValues.cpbgDueDate).toISOString() : null,
      dlpDueDate: formValues.dlpDueDate ? new Date(formValues.dlpDueDate).toISOString() : null,
      modifiedAt: this.utilService.getISTISOString(),
      modifiedBy: parseInt(this.userId || '0')
    };

    this.http.patch(`${environment.apiUrl}/v1/PurchaseOrder/dates/update?poId=${this.selectedPoForEdit}`, updatePayload, { headers })
      .subscribe({
        next: (response) => {
          console.log('PO dates updated successfully:', response);
          this.ToastserviceService.showToast('success', 'PO Dates Updated Successfully');
          this.fetchPo(); // Refresh the main PO list
          this.fetchAllPurchaseOrders(); // Refresh the edit dropdown list
          this.resetEditForm();
        },
        error: (error) => {
          console.error('Error updating PO dates:', error);
          this.ToastserviceService.showToast('error', 'Error updating PO dates');
        }
      });
  }

  resetEditForm(): void {
    this.editPoForm.reset();
    this.selectedPoForEdit = null;
    this.isEditMode = false;
  }

  onVendorSelect(selectedCode: string): void {
    const selectedVendor = this.vendors.find(vendor => vendor.vendorCode === selectedCode);
    this.selectedVendorId = selectedVendor ? selectedVendor.id : null;

       if (selectedVendor) {
      this.poForm.patchValue({
        contactPersonName: selectedVendor.contactNameTitle || '',
        contactPersonEmailId: selectedVendor.contactEmail || selectedVendor.email || '',
        contactNumber: selectedVendor.contactPhone1 || selectedVendor.telephone || ''
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.poForm.patchValue({ poFilePath: this.selectedFile });
    }
  }

  fetchPo(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.get<any[]>(`${environment.apiUrl}/v1/PurchaseOrder`, { headers }).subscribe({
      next: (data) => {
        this.rowData = data.map(item => ({
          ...item,
          shipmentDate: new Date(item.shipmentDate).toLocaleDateString(), 
          createdAt: new Date(item.createdAt).toLocaleDateString(),
          updatedAt: new Date(item.updatedAt).toLocaleDateString()
        }));
  
        this.filteredRowData = this.rowData;
      },
      error: (error) => {
        console.error('Error fetching stages:', error);
      },
    });
  }

  fetchpotypes(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .get<any[]>(`${environment.apiUrl}/v1/potype`, { headers })
      .subscribe({
        next: (data) => {
          this.poTypeList = data;
          console.log('potypes fetched successfully:', data);
        },
        error: (error) => {
          console.error('Error fetching potypes:', error);
        },
      });
  }

  fetchIncoterms(): void {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    this.http.get<any[]>(`${environment.apiUrl}/v1/incoterms`, { headers }).subscribe({
      next: (data) => {
        this.incotermsList = data;
        console.log('Incoterms fetched successfully:', data);
      },
      error: (error) => {
        console.error('Error fetching incoterms:', error);
      },
    });
  }

  onSubmit(): void {
  if (this.selectedFile) {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const staggeredData = this.isStaggeredOrder
      ? this.staggeredDataList.value.map((item: any) => ({
          id: 0,
          quantity: parseInt(item.quantity),
          deliveryDateOfQuantity: new Date(item.deliveryDateOfQuantity).toISOString(),
          poId: 0
        }))
      : []; 

    // Create the JSON payload matching your required format
    const jsonPayload = {
      id: 0,
      po_NO: this.poForm.value.poNo,
      poDescription: this.poForm.value.poDescription,
      poType: parseInt(this.poForm.value.poType),
      incoterms: parseInt(this.poForm.value.incoterms),
      poTypeName: 'purchaseOrder.poTypeName',
      incotermName: 'purchaseOrder.incotermName',
      contractualDeliveryDate: this.poForm.value.contractualDeliveryDate.toISOString(),
      actualDeliveryDate: this.poForm.value.actualDeliveryDate.toISOString(),
      contactPersonName: this.poForm.value.contactPersonName,
      contactPersonEmailId: this.poForm.value.contactPersonEmailId,
      contactNo: this.poForm.value.contactNumber,
      createdAt: this.utilService.getISTISOString(),
      createdBy: this.userId ?? 0,
      updatedAt: this.utilService.getISTISOString(),
      updatedBy: this.userId ?? 0,
      isDeleted: false,
      vendorId: this.selectedVendorId ? (this.selectedVendorId) : 0,
      poFilePath: 'purchaseOrder.poFilePath',
      vendorCode: this.poForm.value.vendorCode,
      reminderSent: false,
      vendName: 'purchaseOrder.vendName',
      staggeredOrder: this.isStaggeredOrder,
      orderValue: this.poForm.value.orderValue,
      shippingDate: this.poForm.value.shippingDate.toISOString(),
      cpbgDueDate: this.poForm.value.cpbgDueDate.toISOString(),
      dlpDueDate: this.poForm.value.dlpDueDate.toISOString(),
      stageStatuses: [],
      staggeredDataList: staggeredData,
      uploadedDocumentFlow: []
    };

    // Build FormData
    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);
    formData.append('purchaseOrderJson', JSON.stringify(jsonPayload));

    this.http.post<any>(`${environment.apiUrl}/v1/PurchaseOrder`, formData, { headers })
      .subscribe({
        next: (response) => {
          console.log('PO submitted successfully:', response);
          this.ToastserviceService.showToast('success', 'PO Created Successfully');
          this.fetchPo();
          this.fetchAllPurchaseOrders(); // Refresh edit dropdown
          this.resetForm();
        },
        error: (error) => {
          console.error('Error submitting PO:', error);
          this.ToastserviceService.showToast('error', 'PO Creation Error');
        },
      });

  } else {
    console.log('Form is invalid or file not selected');
    this.markFormGroupTouched(this.poForm);
  }
}

  resetForm(): void {
    this.poForm.reset();
    this.selectedFile = null;
    this.isStaggeredOrder = false;
    this.clearStaggeredItems();
    this.addStaggeredItem(); // Add one default item
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }
  
  onSearchPO(): void {
    if (this.poSearchText.trim()) {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.get<any>(`${environment.apiUrl}/v1/PurchaseOrder/${this.poSearchText.trim()}`, { headers }).subscribe({
        next: (data) => {
          this.filteredRowData = [data];
          console.log('PO found:', data);
        },
        error: (error) => {
          console.error('Error fetching PO:', error);
          this.filteredRowData = [];
        },
      });
    } else {
      this.filteredRowData = [...this.rowData]; 
    }
  }

  triggerBulkFileInput() {
    const fileInput = document.getElementById('bulkPoFileInput') as HTMLInputElement;
    fileInput.click();
  }
  
  onBulkFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.bulkPoFile = input.files[0];
      this.bulkPoFileName = this.bulkPoFile.name;
    }
  }
  
  onBulkPoUpload(): void {
    if (this.bulkPoFile) {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
      const formData = new FormData();
      formData.append('ExcelFile', this.bulkPoFile, this.bulkPoFile.name);
      formData.append('VendorId', this.vendorId ?? '');
  
      this.http.post<any>(`${environment.apiUrl}/v1/PurchaseOrder/upload`, formData, { headers }).subscribe({
        next: (response) => {
          console.log('Bulk PO uploaded successfully:', response);
          this.ToastserviceService.showToast('success', 'Bulk PO Uploaded Successfully');
          this.bulkPoFile = null;
          this.bulkPoFileName = '';
          this.fetchPo();
          this.fetchAllPurchaseOrders(); // Refresh edit dropdown
        },
        error: (error) => {
          console.error('Error uploading bulk PO:', error);
          this.ToastserviceService.showToast('error', 'Bulk PO Upload Error');
        },
      });
    } else {
      console.log('No bulk PO file selected');
    }
  }

  viewDocument(documentId: number): void {
    const token = localStorage.getItem('authToken');
    const documentUrl = `${environment.apiUrl}/v1/UploadedDocument/view/${encodeURIComponent(documentId)}`;
  
    fetch(documentUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const newWindow = window.open(blobUrl, '_blank');
        if (newWindow) {
          newWindow.addEventListener('unload', () => {
            URL.revokeObjectURL(blobUrl);
          });
        }
      })
      .catch(error => {
        console.error('Error viewing document:', error);
        alert('Error viewing document. Please ensure you are logged in and try again.');
      });
  }
  
  downloadDocument(documentName: number): void {
    const documentUrl = `${environment.apiUrl}/v1/PurchaseOrder/download/${encodeURIComponent(documentName)}`;
  
    fetch(documentUrl)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `document_${documentName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(error => {
        console.error('Error downloading document:', error);
      });
  }
}

export function noPastDateValidator(control: any) {
  if (!control.value) return null;

  const selected = new Date(control.value);
  selected.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selected < today ? { pastDate: true } : null;
}
