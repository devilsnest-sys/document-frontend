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

  constructor(
    private fb: FormBuilder,
    private vendorService: VendorService,
    private toastservice: ToastserviceService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    if (!this.isEditMode) {
      this.fetchAndSetVendorCode();
    }
  }

  initializeForm(): void {
    this.registrationForm = this.fb.group({
      vendorCode: [''],
      companyName: ['', Validators.required],
      mailingAddress: ['', Validators.required],
      telephone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      website: [''],
      contactNameTitle: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone1: [''],
      serviceType: ['', Validators.required],
      generalDetails: [''],
      username: [''],
      HashedPassword: [''],
      userType: ['vendor'],
      salt: ['']
    });
  }

  // New method to fetch vendor code from API
  fetchAndSetVendorCode(): void {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      this.toastservice.showToast('error', 'Authentication Failed', 'Please login again!');
      return;
    }

    this.vendorService.generateNextVendorCode(token).subscribe({
      next: (response) => {
        // Assuming the API returns { vendorCode: "VEN001234" } or similar
        const vendorCode = response.vendorCode || response;
        this.registrationForm.patchValue({ vendorCode });
      },
      error: (error) => {
        console.error('Error generating vendor code:', error);
        this.toastservice.showToast('error', 'Failed to generate vendor code');
        // Fallback to local generation if API fails
        const fallbackCode = this.generateVendorCode();
        this.registrationForm.patchValue({ vendorCode: fallbackCode });
      }
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode) {
      this.fetchVendors();
      this.registrationForm.reset();
      this.initializeForm();
      this.registrationForm.get('vendorCode')?.enable();
    } else {
      this.registrationForm.reset();
      this.selectedVendorId = null;
      this.initializeForm();
      this.fetchAndSetVendorCode();
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
        },
        error: (err) => {
          console.error(err);
          this.toastservice.showToast('error', 'Failed to load vendor details');
        }
      });
    }
  }

  populateForm(vendorData: any): void {
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
      serviceType: vendorData.serviceType || '',
      generalDetails: vendorData.generalDetails || '',
      username: vendorData.username,
      HashedPassword: '',
      userType: vendorData.userType || 'vendor',
      salt: vendorData.salt || ''
    });
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

  // Keeping this as fallback
  private generateVendorCode(): string {
    const timestamp = Date.now().toString().slice(-6);
    return `VEN00${timestamp}`;
  }

  private resetFormState(): void {
    this.isSubmitting = false;
    this.registrationForm.reset();
    this.initializeForm();
    
    if (!this.isEditMode) {
      this.fetchAndSetVendorCode();
    }
    
    this.isEditMode = false;
    this.selectedVendorId = null;
  }

  checkEmailExists(email: string, type: string = 'vendor'): void {
    if (!email || this.isEditMode) return;

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