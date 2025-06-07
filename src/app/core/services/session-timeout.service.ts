import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SessionTimeoutService {
  private timeoutDuration = 30 * 60 * 1000; // 1 minute for testing
  private timeoutId: any;

  constructor(private authService: AuthService, private router: Router) {
    this.startTimer();
    this.addEventListeners();
  }

  private startTimer(): void {
    this.clearTimer();
   // console.log('Timer started. User will be logged out in 1 minute if inactive.');
    this.timeoutId = setTimeout(() => this.handleTimeout(), this.timeoutDuration);
  }

  private clearTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      //console.log('Timer cleared and reset.');
    }
  }

//   private handleTimeout(): void {
//     console.log('Session expired. Logging out user.');
//     this.authService.clearToken();
//     this.router.navigate(['/login']);
//     alert('Session expired. Please log in again.');
//   }

  private handleTimeout(): void {
    //console.log('Session expired. Logging out user.');
    this.authService.clearToken();
    alert('Session expired. Please log in again.');
    this.router.navigate(['/login']).then(() => {
      window.location.reload(); // Ensures the state is reset
    });
   
  }

  private addEventListeners(): void {
    ['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach((event) => {
      window.addEventListener(event, () => {
        //console.log(`Activity detected: ${event}`);
        this.startTimer();
      });
    });
  }
} 
