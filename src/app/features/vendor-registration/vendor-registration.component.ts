import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl  } from '@angular/forms';
import { VendorService } from './vendor-registration.service';
import { ToastserviceService } from '../../core/services/toastservice.service';

@Component({
  selector: 'app-vendor-registration',
  standalone: false,
  
  templateUrl: './vendor-registration.component.html',
  styleUrl: './vendor-registration.component.css'
})
export class VendorRegistrationComponent {
  registrationForm!: FormGroup;
  isSubmitting = false;

  constructor(private fb: FormBuilder, private vendorService: VendorService, private toastservice : ToastserviceService) {}

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
      this.isSubmitting = true;

      this.vendorService.registerVendor(this.registrationForm.value).subscribe(
        (response) => {
          console.log('Vendor registered successfully:', response);
          this.isSubmitting = false;
          this.toastservice.showToast('success', 'Registration Successful');
          this.registrationForm.reset();
        },
        (error) => {
          console.error('Error registering vendor:', error);
          this.isSubmitting = false;
          this.toastservice.showToast('error', 'Registration Failed');
        }
      );
    } else {
      console.log('Form is invalid');
      this.toastservice.showToast('error', 'Login Failed', 'Invalid credentials. Please try again!');
    }
  }
}
