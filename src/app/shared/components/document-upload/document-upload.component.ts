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
export class DocumentUploadComponent  implements ICellRendererAngularComp{
  private params: any;

  agInit(params: any): void {
    this.params = params;
  }

  refresh(params: any): boolean {
    this.params = params;
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
      alert(`File selected: ${file.name}`);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docname', this.params.data.documentName);

      const token = localStorage.getItem('authToken');
      this.params.context.componentParent.http.post(
        `${environment.apiUrl}/v1/UploadDocument`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      ).subscribe({
        next: (response: any) => {
          this.params.data.docname = file.name; // Update docname
          this.params.api.refreshCells({ rowNodes: [this.params.node] }); // Refresh grid
          console.log('File uploaded successfully:', response);
        },
        error: (error: any) => {
          console.error('Error uploading file:', error);
        }
      });
    }
  }
}
