import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RegistrationService } from './registration.service';
import { ToastserviceService } from '../../core/services/toastservice.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-registration',
  standalone: false,
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'], // ✅ Fixed `styleUrls`
})
export class RegistrationComponent implements OnInit {
  registrationForm!: FormGroup;
  stages: Array<{ id: number; stageName: string }> = [];

  constructor(
    private fb: FormBuilder,
    private toastservice: ToastserviceService,
    private registrationService: RegistrationService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.registrationForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      HashedPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, this.matchPasswords.bind(this)]], // ✅ Fixed function binding
      MobileNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      role: ['', Validators.required],
      designation: ['', Validators.required],
      companyId: ['', Validators.required],
      UserDesignationForstageId: [[], Validators.required], // Multi-select control
      userType: 'user',
      salt: ['']
    });

    this.fetchStages();
  }

  fetchStages(): void {
    this.registrationService.getStages().subscribe({
      next: (data) => {
        this.stages = data.map((stage) => ({
          id: stage.id,
          stageName: stage.stageName,
        }));
      },
      error: (err) => {
        console.error(err);
        this.toastservice.showToast('error', 'Failed to load stages');
      },
    });
  }

  checkEmailExists(email: string, type: string = 'user'): void {
    if (!email) return;
  
    this.registrationService.checkEmailExists(email, type).subscribe(
      response => {
        if (response.exists) {
          this.registrationForm.controls['email'].setErrors({ emailTaken: true });
        }
      },
      error => {
        console.error('Error checking email:', error);
      }
    );
  }
  

  get emailControl() {
    return this.registrationForm.get('email');
  }

  checkUsernameExists(username: string, type: string = 'user'): void {
    if (!username) return;
  
    this.registrationService.checkUsernameExists(username,type).subscribe(
      response => {
        if (response.exists) {
          this.registrationForm.controls['username'].setErrors({ usernameTaken: true });
        }
      },
      error => {
        console.error('Error checking username:', error);
      }
    );
  }
  

  matchPasswords(control: AbstractControl): { [key: string]: boolean } | null {
    if (this.registrationForm && control.value !== this.registrationForm.get('HashedPassword')?.value) {
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

      const payload = { ...this.registrationForm.value };

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
