import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastserviceService } from '../../services/toastservice.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  userTypes = [
    { value: 'vendor', label: 'Vendor' },
    { value: 'user', label: 'User' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private ToastserviceService: ToastserviceService
  ) {
    this.loginForm = this.fb.group({
      userType: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { username, password, userType } = this.loginForm.value;
      this.authService.login(username, password, userType).subscribe({
        next: (response) => {
          if (response.token) {
            this.authService.setToken(response.token, response.userName, response.id);
            this.ToastserviceService.showToast('success', 'Login Successful');
            this.router.navigate(['/dashboard']);
          } else {
            this.ToastserviceService.showToast('error', 'Login Failed', 'Invalid credentials. Please try again!');
          }
        },
        error: () => {
          this.ToastserviceService.showToast('error', 'Login Error', 'Something went wrong. Please try again later!');
        },
      });
    } else {
      this.ToastserviceService.showToast('warning', 'Invalid Input', 'Please fill out the form correctly before submitting.');
    }
  }  
}
