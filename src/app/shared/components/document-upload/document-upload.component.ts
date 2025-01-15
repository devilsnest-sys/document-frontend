import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { ToastserviceService } from '../../../core/services/toastservice.service';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';

@Component({
  selector: 'app-document-upload',
  standalone: false,
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.css'
})
export class DocumentUploadComponent implements ICellRendererAngularComp {
  params: any;

  agInit(params: any): void {
    this.params = params;
  }

  refresh(): boolean {
    return true;
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (file) {
      // Update the document name in the grid
      const rowNode = this.params.node;
      const updatedData = { ...this.params.data };
      updatedData.docname = file.name;
      
      // Update the row data
      rowNode.setData(updatedData);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docname', this.params.data.documentName);
      
      // You can proceed with the file upload here using HttpClient
    }
  }
}