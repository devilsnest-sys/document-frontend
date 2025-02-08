import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-password-reset',
  standalone: false,
  
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.css'
})
export class PasswordResetComponent {
  email: string = '';
  otp: string = '';
  newPassword: string = '';
  isOtpSent: boolean = false;
  message: string = '';
  errorMessage: string = '';


  constructor(private authService: AuthService,  private router: Router) {}

  onSubmit() {
    if (!this.isOtpSent) {
      // Step 1: Request Password Reset
      this.authService.requestPasswordReset(this.email).subscribe(
        response => {
          this.isOtpSent = true;
          this.message = 'OTP sent to your email.';
          this.errorMessage = '';
        },
        error => {
          this.errorMessage = 'Error requesting reset.';
          this.message = '';
        }
      );
    } else {
      // Step 2: Reset Password
      this.authService.resetPassword(this.email, this.otp, this.newPassword).subscribe(
        response => {
          this.message = 'Password reset successfully!';
          this.isOtpSent = false;
          this.email = '';
          this.otp = '';
          this.newPassword = '';
          this.errorMessage = '';
          this.router.navigate(['/dashboard'])
        },
        error => {
          this.errorMessage = 'Failed to reset password.';
          this.message = '';
        }
      );
    }
  }
}
