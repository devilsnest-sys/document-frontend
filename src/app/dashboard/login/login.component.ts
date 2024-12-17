import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (response) => {
          if (response.token) {
            this.authService.setToken(response.token);
            Swal.fire({
              icon: 'success',
              title: 'Login Successful',
              text: 'Welcome back!',
              timerProgressBar: true,
              showConfirmButton: true,
            }).then(() => {
              this.router.navigate(['/dashboard']);
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Login Failed',
              text: 'Invalid credentials. Please try again!',
              timerProgressBar: true,
              showConfirmButton: true,
            });
          }
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Login Error',
            text: 'Something went wrong. Please try again later!',
            timerProgressBar: true,
            showConfirmButton: true,
          });
        },
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Please fill out the form correctly before submitting.',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  }
}
