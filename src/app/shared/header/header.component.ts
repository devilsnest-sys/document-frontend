import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  logoUrl!: string;
  headerTitle!: string;
  isLoggedIn: boolean = false;
  userName: string | null = null;
  userType: string | null = null;
  isMobileMenuOpen: boolean = false;
  isMobileMastersOpen: boolean = false;
  isUserMenuOpen = false;

  private loginStateSubscription!: Subscription;
  private userNameSubscription!: Subscription;
  private userTypeSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.logoUrl = 'assets/images/envato-logo-small.svg';
    this.headerTitle = 'Post Order Activity';

    // Subscribe to login state
    this.loginStateSubscription = this.authService.getLoginState().subscribe(
      (loggedIn) => {
        this.isLoggedIn = loggedIn;
      }
    );

    // Subscribe to username state
    this.userNameSubscription = this.authService.getUserNameState().subscribe(
      (name) => {
        this.userName = name;
      }
    );

    this.userTypeSubscription = this.authService.getUserTypeState().subscribe(
      (type) => {
        this.userType = type;
      }
    );
  }

  toggleUserMenu() {
  this.isUserMenuOpen = !this.isUserMenuOpen;
}
@HostListener('document:click', ['$event'])
closeMenu(event: Event) {
  const target = event.target as HTMLElement;
  if (!target.closest('.user-section')) {
    this.isUserMenuOpen = false;
  }
}

  ngOnDestroy(): void {
    if (this.loginStateSubscription) {
      this.loginStateSubscription.unsubscribe();
    }
    if (this.userNameSubscription) {
      this.userNameSubscription.unsubscribe();
    }
    if (this.userTypeSubscription) {
      this.userTypeSubscription.unsubscribe();
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (!this.isMobileMenuOpen) {
      this.isMobileMastersOpen = false;
    }
  }

  toggleMobileMasters(): void {
    this.isMobileMastersOpen = !this.isMobileMastersOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    this.isMobileMastersOpen = false;
  }

  logout(): void {
    this.authService.clearToken();
    this.closeMobileMenu();
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }
}