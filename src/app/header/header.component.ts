import { Component, OnInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../app/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  logoUrl!: string;
  headerTitle!: string;
  isLoggedIn!: boolean;
  private loginStateSubscription!: Subscription;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.logoUrl = 'assets/images/envato-logo-small.svg';
    this.headerTitle = 'Document Dashboard';
    this.loginStateSubscription = this.authService.getLoginState().subscribe(
      (loggedIn) => {
        this.isLoggedIn = loggedIn;
        // console.log('Login state changed:', loggedIn);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.loginStateSubscription) {
      this.loginStateSubscription.unsubscribe();
    }
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.authService.clearToken();
    this.router.navigate(['/login']);
  }
}
