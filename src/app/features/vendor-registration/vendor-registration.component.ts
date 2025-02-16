import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl  } from '@angular/forms';
import { VendorService } from './vendor-registration.service';
import { ToastserviceService } from '../../core/services/toastservice.service';
import Swal from 'sweetalert2';

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
  
  checkEmailExists(email: string, type: string = 'vendor'): void {
    if (!email) return;
   
    this.vendorService.checkEmailExists(email, type).subscribe(
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

  checkUsernameExists(username: string, type: string = 'vendor'): void {
    if (!username) return;
  
    this.vendorService.checkUsernameExists(username,type).subscribe(
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
  uploadFile(): void {
    if (!this.selectedFile) {
      this.toastservice.showToast('error', 'Upload Failed', 'Please select a file first.');
      return;
    }
  
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to upload this file? This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Upload',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.vendorService.bulkRegisterVendors(this.selectedFile as File).subscribe(
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
    });
  }
}
