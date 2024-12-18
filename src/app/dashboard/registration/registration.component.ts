import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl  } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environment/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-registration',
  standalone: false,
  
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent {
  registrationForm!: FormGroup;
  private registrationUrl = `${environment.apiUrl}/v1/users`;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.registrationForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, this.matchPasswords.bind(this)]],
      MobileNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      role: ['', Validators.required],
      designation: ['', Validators.required],
      companyId: ['', Validators.required],
    });
  }

  matchPasswords(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.value !== this.registrationForm?.get('password')?.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      const token = localStorage.getItem('authToken');
      console.log(`Token: ${token}`);
  
      if (!token) {
        Swal.fire('Error', 'User is not logged in. Please log in first.', 'error');
        return;
      }
  
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      const payload = this.registrationForm.value;
  
      this.http.post(this.registrationUrl, payload, { headers }).subscribe({
        next: () => {
          Swal.fire('Success!', 'Registration successful.', 'success');
          this.registrationForm.reset();
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'Failed to register. Please check your authentication.', 'error');
        },
      });
    } else {
      Swal.fire('Error', 'Please fill out all required fields correctly.', 'error');
    }
  }
  
}
