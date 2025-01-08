import { Component, OnInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
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
  userName: string | null = null;
  private loginStateSubscription!: Subscription;
  private userNameSubscription!: Subscription;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.logoUrl = 'assets/images/envato-logo-small.svg';
    this.headerTitle = 'Document Dashboard';
    this.loginStateSubscription = this.authService.getLoginState().subscribe(
      (loggedIn) => {
        this.isLoggedIn = loggedIn;
      }
    );

    this.userNameSubscription = this.authService.getUserNameState().subscribe(
      (name) => {
        this.userName = name;
      }
    );
  }

  ngOnDestroy(): void {
    this.loginStateSubscription.unsubscribe();
    this.userNameSubscription.unsubscribe();
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.authService.clearToken();
    this.router.navigate(['/login']);
  }
}
