import { Component } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, Event } from '@angular/router';
import { LoaderService } from './core/services/loader-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'document-frontend';
  isLoading = false;

  constructor(private router: Router, private loaderService: LoaderService) {}

  ngOnInit(): void {
    // Subscribe to loader service for API requests
    this.loaderService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });

    // Subscribe to router events
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        this.isLoading = true; // Show loader on navigation start
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isLoading = false; // Hide loader on navigation end, cancel, or error
      }
    });
  }
}
