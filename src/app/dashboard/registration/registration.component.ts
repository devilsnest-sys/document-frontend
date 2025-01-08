import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl  } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environment/environment';
import { ToastserviceService } from '../../core/services/toastservice.service';

@Component({
  selector: 'app-registration',
  standalone: false,
  
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent {
  registrationForm!: FormGroup;
  private registrationUrl = `${environment.apiUrl}/v1/users`;

  constructor(private fb: FormBuilder, private http: HttpClient, private ToastserviceService: ToastserviceService) {}

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
      userType: "user"
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
        this.ToastserviceService.showToast('error', 'Login Failed', 'Invalid credentials. Please try again!');
        return;
      }
  
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      const payload = this.registrationForm.value;
  
      this.http.post(this.registrationUrl, payload, { headers }).subscribe({
        next: () => {
          this.ToastserviceService.showToast('success', 'Registration Successful');
          this.registrationForm.reset();
        },
        error: (err) => {
          console.error(err);
          this.ToastserviceService.showToast('error', 'Registration Failed');
        },
      });
    } else {
      this.ToastserviceService.showToast('error', 'Login Failed', 'Invalid credentials. Please try again!');
    }
  }
  
}
