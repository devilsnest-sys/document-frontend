import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastserviceService } from '../../core/services/toastservice.service';

@Component({
  selector: 'app-change-password',
  standalone: false,
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  userType: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastserviceService
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.userType = this.authService.getUserType();
    
    if (!this.authService.isLoggedIn()) {
      this.toastService.showToast('error', 'Unauthorized', 'Please login to change password');
      this.router.navigate(['/login']);
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.changePasswordForm.valid) {
      this.isLoading = true;
      const formValue = this.changePasswordForm.value;

      this.authService.changePassword(
        formValue.currentPassword,
        formValue.newPassword,
        formValue.confirmPassword,
        this.userType!
      ).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.toastService.showToast('success', 'Password Changed', 'Your password has been changed successfully');
          this.changePasswordForm.reset();
          
          // Optionally logout and redirect to login
          setTimeout(() => {
            this.authService.clearToken();
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage = error.error?.message || 'Failed to change password. Please check your current password.';
          this.toastService.showToast('error', 'Password Change Failed', errorMessage);
        }
      });
    } else {
      this.toastService.showToast('warning', 'Invalid Input', 'Please fill out the form correctly');
    }
  }

  onCancel(): void {
    this.changePasswordForm.reset();
    this.router.navigate(['/dashboard']);
  }
}