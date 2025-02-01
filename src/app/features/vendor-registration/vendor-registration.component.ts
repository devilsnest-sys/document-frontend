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
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder, private vendorService: VendorService, private toastservice : ToastserviceService) {}

  ngOnInit(): void {
    this.registrationForm = this.fb.group({
      vendorCode: ['', Validators.required],
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
      HashedPassword: ['', [Validators.required, Validators.minLength(6)]],
      userType: "vendor",
      salt: ['']
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

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.toastservice.showToast('error', 'Upload Failed', 'Please select a file first.');
      return;
    }
  
    this.vendorService.bulkRegisterVendors(this.selectedFile).subscribe(
      (response) => {
        console.log('Bulk upload successful:', response);
        this.toastservice.showToast('success', 'Bulk Upload Successful');
      },
      (error) => {
        console.error('Error in bulk upload:', error);
        this.toastservice.showToast('error', 'Bulk Upload Failed');
      }
    );
  }
}
