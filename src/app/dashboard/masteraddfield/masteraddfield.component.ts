import { Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-masteraddfield',
  standalone: false,
  
  templateUrl: './masteraddfield.component.html',
  styleUrl: './masteraddfield.component.css'
})
export class MasteraddfieldComponent {
  rowData = [
    { groupName: 'Document 1', uploadedDocumentName: 'Doc1.pdf', status: 'Pending', reviewedBy: 'John', docReviewDate: '2025-01-20' },
    { groupName: 'Document 1', uploadedDocumentName: 'Doc2.pdf', status: 'Approved', reviewedBy: 'Jane', docReviewDate: '2025-01-19' },
    { groupName: 'Document 2', uploadedDocumentName: 'Doc3.pdf', status: 'Rejected', reviewedBy: 'John', docReviewDate: '2025-01-18' },
  ];

  groupedData: { groupName: string; documents: any[] }[] = [];  // Initialized as an empty array
  expandedGroups: { [key: string]: boolean } = {};
  itemsPerPage: number = 5;  // Pagination for documents
  currentPage: number = 1;
  totalPages: number = 0; // Total pages for pagination

  ngOnInit(): void {
    this.groupData();
    this.calculateTotalPages();
  }

  groupData(): void {
    const grouped = this.rowData.reduce((acc, item) => {
      acc[item.groupName] = acc[item.groupName] || [];
      acc[item.groupName].push(item);
      return acc;
    }, {} as { [key: string]: any[] });

    this.groupedData = Object.keys(grouped).map((key) => ({
      groupName: key,
      documents: grouped[key],
    }));

    this.calculateTotalPages();
  }

  calculateTotalPages(): void {
    const documentsCount = this.groupedData.reduce((count, group) => count + group.documents.length, 0);
    this.totalPages = Math.ceil(documentsCount / this.itemsPerPage);
  }

  toggleGroup(groupName: string): void {
    this.expandedGroups[groupName] = !this.expandedGroups[groupName];
  }

  submit(document: any): void {
    alert(`Submitting: ${document.uploadedDocumentName}`);
  }

  paginateDocuments(documents: any[]): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return documents.slice(start, end);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }
}
