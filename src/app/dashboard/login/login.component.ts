import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  dummyUsers: { email: string; password: string }[];

  constructor(private fb: FormBuilder, private router: Router) {
    this.dummyUsers = [
      { email: 'testuser@example.com', password: 'password123' },
      { email: 'john.doe@example.com', password: 'john12345' },
      { email: 'jane.doe@example.com', password: 'jane45678' },
    ];

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      const authenticatedUser = this.dummyUsers.find(
        (user) => user.email === email && user.password === password
      );

      if (authenticatedUser) {
        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: `Welcome back, ${authenticatedUser.email}!`,
          timerProgressBar: true,
          showConfirmButton: true
        }).then(() => {
          this.router.navigate(['/dashboard']);
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: 'Invalid email or password. Please try again!',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Please fill out the form correctly before submitting.',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false
      });
    }
  }
}
