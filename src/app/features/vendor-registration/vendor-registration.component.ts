import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl  } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'app-vendor-registration',
  standalone: false,
  
  templateUrl: './vendor-registration.component.html',
  styleUrl: './vendor-registration.component.css'
})
export class VendorRegistrationComponent {
  registrationForm!: FormGroup;
  private registrationUrl = `${environment.apiUrl}/v1/vendors`;
  isSubmitting = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.registrationForm = this.fb.group({
      companyName: ['', Validators.required],
      mailingAddress: ['', Validators.required],
      telephone: ['', Validators.required],
      fax: [''],
      email: ['', [Validators.required, Validators.email]],
      website: [''],
      contactNameTitle: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone1: ['', Validators.required],
      contactPhone2: [''],
      generalDetails: [''],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      userType: "vendor"
    });
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      const token = localStorage.getItem('authToken');
      console.log(`Token: ${token}`);
      
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.isSubmitting = true;

      this.http.post(this.registrationUrl, this.registrationForm.value, { headers }).subscribe(
        (response) => {
          console.log('Vendor registered successfully:', response);
          this.isSubmitting = false;
          alert('Vendor registered successfully!');
          this.registrationForm.reset();
        },
        (error) => {
          console.error('Error registering vendor:', error);
          this.isSubmitting = false;
          alert('Error occurred during registration. Please try again.');
        }
      );
    } else {
      console.log('Form is invalid');
      alert('Please fill in all required fields correctly.');
    }
  }
}
