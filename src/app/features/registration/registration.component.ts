import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl  } from '@angular/forms';
import { RegistrationService } from './registration.service';
import { ToastserviceService } from '../../core/services/toastservice.service';

@Component({
  selector: 'app-registration',
  standalone: false,
  
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css'
})
export class RegistrationComponent {
  registrationForm!: FormGroup;
  stages: Array<{ id: number; stageName: string }> = [];
  constructor(private fb: FormBuilder, private toastservice: ToastserviceService, private registrationService: RegistrationService) {}

  ngOnInit(): void {
    this.registrationForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      HashedPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, this.matchPasswords.bind(this)]],
      MobileNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      role: ['', Validators.required],
      designation: ['', Validators.required],
      companyId: ['', Validators.required],
      UserDesignationForstageId: [[], Validators.required], // Multi-select control
      userType: "user",
      salt: ['']
    });

    // Fetch stages for the dropdown
    this.fetchStages();
  }
  fetchStages(): void {
    this.registrationService.getStages().subscribe({
      next: (data) => {
        this.stages = data.map((stage) => ({
          id: stage.id,
          stageName: stage.stageName, // Ensure `stageName` is used here
        }));
      },
      error: (err) => {
        console.error(err);
        this.toastservice.showToast('error', 'Failed to load stages');
      },
    });
  }
  
  matchPasswords(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.value !== this.registrationForm?.get('HashedPassword')?.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      const token = localStorage.getItem('authToken');
      if (!token) {
        this.toastservice.showToast('error', 'Login Failed', 'Invalid credentials. Please try again!');
        return;
      }
      // Clone the form value to avoid mutating the original form data
    const payload = { ...this.registrationForm.value };

    // Convert UserDesignationForstageId to a comma-separated string
    if (Array.isArray(payload.UserDesignationForstageId)) {
      payload.UserDesignationForstageId = payload.UserDesignationForstageId.join(', ');
    }

  
      this.registrationService.registerUser(payload, token).subscribe({
        next: () => {
          this.toastservice.showToast('success', 'Registration Successful');
          this.registrationForm.reset();
        },
        error: (err) => {
          console.error(err);
          this.toastservice.showToast('error', 'Registration Failed');
        },
      });
    } else {
      this.toastservice.showToast('error', 'Login Failed', 'Invalid credentials. Please try again!');
    }
  }
  
}
