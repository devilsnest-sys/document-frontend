import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidenavbar',
  standalone: false,

  templateUrl: './sidenavbar.component.html',
  styleUrl: './sidenavbar.component.css',
})
export class SidenavbarComponent {
  isSidebarOpen = true;
  isDropdownOpen: boolean = false;
  isLoggedIn = false;

  constructor(
    private authService: AuthService,private router: Router
  ) {}

  @Output() sidebarToggle = new EventEmitter<boolean>();

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.authService.getLoginState().subscribe(status => {
      this.isLoggedIn = status;
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.sidebarToggle.emit(this.isSidebarOpen);
  }
  
  logout(): void {
    this.authService.clearToken();
    this.router.navigate(['/login']).then(() => {
      window.location.reload(); // Ensures full refresh
    });
  }
}
