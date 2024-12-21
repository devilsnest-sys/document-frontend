import { Component } from '@angular/core';

@Component({
  selector: 'app-sidenavbar',
  standalone: false,
  
  templateUrl: './sidenavbar.component.html',
  styleUrl: './sidenavbar.component.css'
})
export class SidenavbarComponent {
  isSidebarOpen = true;
  isDropdownOpen: boolean = false;

toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
}

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
