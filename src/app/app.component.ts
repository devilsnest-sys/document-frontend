import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, Event } from '@angular/router';
import { LoaderService } from './core/services/loader-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'document-frontend';
  isLoading = false;
  isSidebarOpen = false;
  isLoggedIn = false;

  constructor(private router: Router, private loaderService: LoaderService) {}

  ngOnInit(): void {
    this.checkLoginStatus();

    // Subscribe to loader service for API requests
    this.loaderService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });

    // Subscribe to router events
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;

        // Redirect already logged-in users away from the login page
        if (event.url === '/login' && this.isLoggedIn) {
          this.router.navigate(['/dashboard']);
        } else {
          this.checkLoginStatus();
        }
      } 

      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.isLoading = false;
      }
    });
  }

  private checkLoginStatus() {
    const token = localStorage.getItem('authToken');
    this.isLoggedIn = !!token;
    
    // Ensure sidebar is only open when logged in
    this.isSidebarOpen = this.isLoggedIn;
  }

  onSidebarToggle(isOpen: boolean) {
    this.isSidebarOpen = isOpen;
  }
}
