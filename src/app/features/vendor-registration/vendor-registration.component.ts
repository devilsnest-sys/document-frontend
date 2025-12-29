// vendor-registration.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { VendorService } from './vendor-registration.service';
import { ToastserviceService } from '../../core/services/toastservice.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vendor-registration',
  standalone: false,
  templateUrl: './vendor-registration.component.html',
  styleUrl: './vendor-registration.component.css'
})
export class VendorRegistrationComponent implements OnInit {
  registrationForm!: FormGroup;
  isSubmitting = false;
  selectedFile: File | null = null;
  vendorList: Array<{ username: string; vendorCode: string; companyName: string; id?: number; [key: string]: any }> = [];
  isEditMode: boolean = false;
  selectedVendorId: number | null = null;
  originalEmail: string = ''; // Track original email to avoid unnecessary validation

  constructor(
    private fb: FormBuilder,
    private vendorService: VendorService,
    private toastservice: ToastserviceService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.registrationForm = this.fb.group({
      vendorCode: ['', Validators.required],
      companyName: ['', Validators.required],
      mailingAddress: ['', Validators.required],
      telephone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      website: [''],
      contactNameTitle: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone1: [''],
      generalDetails: ['', Validators.required],
      username: [''],
      HashedPassword: [''],
      userType: ['vendor'],
      salt: ['']
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode) {
      this.fetchVendors();
      this.registrationForm.reset();
      this.initializeForm();
      this.registrationForm.get('vendorCode')?.enable();
      this.originalEmail = '';
    } else {
      this.registrationForm.reset();
      this.selectedVendorId = null;
      this.originalEmail = '';
      this.initializeForm();
    }
  }

  fetchVendors(): void {
    this.vendorService.getAllVendors().subscribe({
      next: (data) => {
        this.vendorList = data;
      },
      error: (err) => {
        console.error(err);
        this.toastservice.showToast('error', 'Failed to load vendors');
      },
    });
  }

  onVendorCodeSelected(vendorCode: string): void {
    if (!vendorCode) return;

    const selectedVendor = this.vendorList.find(vendor => vendor.vendorCode === vendorCode);

    if (selectedVendor && selectedVendor.id) {
      this.selectedVendorId = selectedVendor.id;

      this.vendorService.getVendorById(selectedVendor.id).subscribe({
        next: (vendorData) => {
          this.populateForm(vendorData);
          this.originalEmail = vendorData.email; // Store original email
        },
        error: (err) => {
          console.error(err);
          this.toastservice.showToast('error', 'Failed to load vendor details');
        }
      });
    }
  }

  populateForm(vendorData: any): void {
    const normalizedServiceType = this.mapServiceType(vendorData.serviceType);
    
    this.registrationForm.patchValue({
      vendorCode: vendorData.vendorCode,
      companyName: vendorData.companyName,
      mailingAddress: vendorData.mailingAddress,
      telephone: vendorData.telephone,
      email: vendorData.email,
      website: vendorData.website || '',
      contactNameTitle: vendorData.contactNameTitle,
      contactEmail: vendorData.contactEmail,
      contactPhone1: vendorData.contactPhone1 || '',
      serviceType: normalizedServiceType || '',
      generalDetails: vendorData.generalDetails || '',
      username: vendorData.username,
      HashedPassword: '',
      userType: vendorData.userType || 'vendor',
      salt: vendorData.salt || ''
    });
  }

  private mapServiceType(value: string): string {
    if (!value) return '';

    const val = value.toLowerCase().replace(/\s|_/g, '');

    if (val.includes('composite')) return 'Composite Services';
    if (val.includes('service')) return 'Services';
    if (val.includes('goods')) return 'Goods';
    if (val.includes('work')) return 'Works';

    return '';
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      this.isSubmitting = true;
      const token = localStorage.getItem('authToken');

      if (!token) {
        this.toastservice.showToast('error', 'Authentication Failed', 'Please login again!');
        this.isSubmitting = false;
        return;
      }

      const payload = { ...this.registrationForm.getRawValue() };

      if (this.isEditMode && this.selectedVendorId) {
        payload.id = this.selectedVendorId;

        this.vendorService.updateVendor(payload, token).subscribe({
          next: (response) => {
            this.toastservice.showToast('success', 'Vendor Updated Successfully');
            this.resetFormState();
          },
          error: (error) => {
            console.error('Error updating vendor:', error);
            this.isSubmitting = false;
            this.toastservice.showToast('error', 'Update Failed');
          }
        });
      } else {
        const generatedPassword = this.generateRandomPassword(10);
        const vendorCode = this.registrationForm.get('vendorCode')?.value;
        payload.HashedPassword = generatedPassword;
        payload.vendorCode = vendorCode;
        payload.username = vendorCode;
        payload.userType = 'vendor';
        
        this.vendorService.registerVendor(payload).subscribe(
          (response) => {
            console.log('Vendor registered successfully:', response);
            this.toastservice.showToast('success', 'Registration Successful');
            this.resetFormState();
          },
          (error) => {
            console.error('Error registering vendor:', error);
            this.isSubmitting = false;
            this.toastservice.showToast('error', 'Registration Failed');
          }
        );
      }
    } else {
      console.log('Form is invalid');
      this.toastservice.showToast('error', 'Form Invalid', 'Please fill all required fields correctly!');
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  private generateRandomPassword(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private resetFormState(): void {
    this.isSubmitting = false;
    this.registrationForm.reset();
    this.initializeForm();
    this.isEditMode = false;
    this.selectedVendorId = null;
    this.originalEmail = '';
  }

  /**
   * Validates email based on current mode:
   * - CREATE MODE: Uses checkEmailExists API to see if email is already taken
   * - EDIT MODE: Uses validateEmail API to check if email is duplicate (excluding current vendor)
   */
  checkEmailExists(email: string, type: string = 'vendor'): void {
    if (!email) return;

    // Skip validation if email hasn't changed in edit mode
    if (this.isEditMode && email === this.originalEmail) {
      return;
    }

    if (this.isEditMode && this.selectedVendorId) {
      // EDIT MODE: Use validate API with vendor ID
      this.vendorService.validateEmail(this.selectedVendorId, type, email).subscribe(
        response => {
          if (!response.isDuplicate) {
            // Email is already used by another vendor
            this.registrationForm.controls['email'].setErrors({ emailTaken: true });
          } else {
            // Email is valid - clear the emailTaken error if it exists
            const emailControl = this.registrationForm.controls['email'];
            if (emailControl.hasError('emailTaken')) {
              const errors = { ...emailControl.errors };
              delete errors['emailTaken'];
              emailControl.setErrors(Object.keys(errors).length ? errors : null);
            }
          }
        },
        error => {
          console.error('Error validating email:', error);
          this.toastservice.showToast('error', 'Email validation failed');
        }
      );
    } else {
      // CREATE MODE: Use existing check-email API
      this.vendorService.checkEmailExists(email, type).subscribe(
        response => {
          if (response.exists) {
            this.registrationForm.controls['email'].setErrors({ emailTaken: true });
          } else {
            // Clear the emailTaken error if it exists
            const emailControl = this.registrationForm.controls['email'];
            if (emailControl.hasError('emailTaken')) {
              const errors = { ...emailControl.errors };
              delete errors['emailTaken'];
              emailControl.setErrors(Object.keys(errors).length ? errors : null);
            }
          }
        },
        error => {
          console.error('Error checking email:', error);
        }
      );
    }
  }

  get emailControl() {
    return this.registrationForm.get('email');
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
            this.selectedFile = null;
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