import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, Event } from '@angular/router';
import { LoaderService } from './core/services/loader-service.service';
import { SessionTimeoutService } from './core/services/session-timeout.service';
import { NotificationService } from './services/notification.service';
import { SignalrService } from './services/signalr.service';

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

  // ✅ Add for notifications
  notifications: string[] = [];
  showNotifications = false;

  constructor(private router: Router, private loaderService: LoaderService , private sessionTimeoutService: SessionTimeoutService,private notificationService: NotificationService,private signalRService: SignalrService) {}

  ngOnInit(): void {
    this.signalRService.startConnection();
    this.checkLoginStatus();


    // ✅ Subscribe to notification updates
    this.notificationService.notifications$.subscribe((msgs) => {
      this.notifications = msgs;
    });

    // Subscribe to loader service for API requests
    this.loaderService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
      // console.log('isLoading status:', loading);
    });

    // Subscribe to router events
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        this.loaderService.showLoader();

        if (event.url === '/login' && this.isLoggedIn) {
          this.router.navigate(['/dashboard']);
        } else {
          this.checkLoginStatus();
        }
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loaderService.hideLoader();
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

  // ✅ Notification dropdown toggle
  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  // ✅ Remove a notification
  removeNotification(index: number) {
    this.notificationService.removeNotification(index);
  }
}
